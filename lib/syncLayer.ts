// Cross-layer sync orchestration.
//
// Two public entry points:
//   - syncLayer(story, source, target)     — run one source→target sync.
//   - syncLayers(story, source, targets, onStep) — run several, in canonical
//     order, against the same source snapshot. Each target's write is
//     applied to the evolving Story.
//
// Each sync:
//   1. POSTs an ActionRequest of type `sync_<source>_to_<target>` to
//      /api/generate.
//   2. Concatenates the ndjson `text` events into a single string.
//   3. Parses the string as JSON. Shape depends on target:
//        concept    → { logline?, summary?, tone?, themes?, endingTypes? }
//        characters → { characters: [...] }
//        story      → { beats: [...] } or { episodes: [...] }   (non-TV / TV)
//        script     → { scenes: [...] }
//   4. Normalizes the payload into the `LayerContent` union.
//   5. Calls `applySyncResult` in lib/story.ts, which picks overwrite-in-place
//      vs new-draft based on whether the target's active draft is empty.
//
// Protected Concept fields (`title`, `projectType`, `genres`) are stripped at
// parse time — defense-in-depth even though the prompt already asks the model
// not to include them.

import type {
  Story,
  LayerKey,
  LayerContent,
  Character,
  CharacterRelationship,
  Beat,
  Episode,
  Scene,
  EndingType,
  Arc,
  ArcType,
  Framework,
} from "./story";
import {
  applySyncResult,
  // TV import pipeline helpers — concept fill, characters, arcs,
  // episodes, pilot. The pipeline at the bottom of this file
  // orchestrates these one after the other.
  getActiveConceptDraft, updateConceptDraft,
  getActiveCharactersDraft, updateCharactersDraft,
  getActiveArcsDraft, updateArcsDraft, addArcToActiveDraft,
  getActiveEpisodesDraft, updateEpisodesDraft, upsertEpisodeInActiveDraft,
  updateStoryLayerDraft, updateScriptDraft,
  getActiveStoryLayerDraft, getActiveScriptDraft,
  ARC_COLORS, ARC_TYPES,
} from "./story";
import type { ActionRequest, ActionType } from "./prompt";
import type { WriterProfile } from "./writerProfile";

// ── Canonical order ────────────────────────────────────────────────
// Sort targets by this so that when the user checks several, they run
// Concept → Characters → Story → Script (most upstream first).
const ORDER: LayerKey[] = ["concept", "characters", "story", "script"];
export function compareLayers(a: LayerKey, b: LayerKey): number {
  return ORDER.indexOf(a) - ORDER.indexOf(b);
}

// ── /api/generate call ─────────────────────────────────────────────

// Exported so other orchestrators (e.g. lib/easyMode.ts) can reuse the
// same ndjson-streaming + error-handling logic without duplication.
export async function callGenerate(
  story: Story,
  action: ActionRequest,
  profile?: WriterProfile | null,
): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ story, action, profile }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`/api/generate ${res.status}: ${body || "(no body)"}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let fullText = "";
  let streamError: string | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === "text") fullText += msg.value;
        else if (msg.type === "error") streamError = msg.value;
      } catch {
        /* ignore malformed line */
      }
    }
  }

  if (streamError && !fullText) {
    throw new Error(`generate stream error: ${streamError}`);
  }
  return fullText;
}

// ── JSON parsing ───────────────────────────────────────────────────
// Models return strict JSON per our prompts, but in practice sometimes
// wrap in ```json fences, add prose before/after, or truncate. Be lenient:
//   1. Strip ```json fences.
//   2. Locate the first `{` and walk balanced braces (string-aware) to
//      find its matching `}` — robust to trailing prose.
//   3. If the balance never closes (stream truncation), try the tail up
//      to the last `}` we saw.
//   4. On failure, include a preview of the raw output so the user has
//      something actionable to report.

// Exported alongside callGenerate so other orchestrators can use the
// same lenient JSON-extraction strategy (strip code fences, walk
// balanced braces, fall back to last-`}` on truncation).
export function extractJson(text: string): any {
  let body = text.trim();
  // Strip surrounding code fences.
  const fenced = body.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) body = fenced[1].trim();

  const firstBrace = body.indexOf("{");
  if (firstBrace === -1) {
    throw new Error(
      `Sync result was not valid JSON: no '{' found. Response preview: ${snippet(body)}`
    );
  }

  // Walk from the first `{`, tracking nesting and string state, to find
  // the matching `}`. This lets us isolate the JSON object even when the
  // model appended a stray trailing comment or sign-off.
  let depth = 0;
  let inString = false;
  let escape = false;
  let endIdx = -1;
  for (let i = firstBrace; i < body.length; i++) {
    const ch = body[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  // If the walk never closed, fall back to the last `}` we saw in the
  // body — better to try parsing a truncated object than bail outright.
  if (endIdx === -1) {
    const lastBrace = body.lastIndexOf("}");
    endIdx = lastBrace > firstBrace ? lastBrace : body.length - 1;
  }

  const candidate = body.slice(firstBrace, endIdx + 1);
  try {
    return JSON.parse(candidate);
  } catch (e) {
    throw new Error(
      `Sync result was not valid JSON: ${(e as Error).message}. Response preview: ${snippet(body)}`
    );
  }
}

function snippet(s: string): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > 240 ? `${clean.slice(0, 240)}…` : clean;
}

// ── Payload → LayerContent normalization ───────────────────────────

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCharacter(raw: any): Character {
  return {
    id: typeof raw?.id === "string" && raw.id ? raw.id : randomId("c"),
    name:         typeof raw?.name === "string"         ? raw.name         : "",
    role:         typeof raw?.role === "string"         ? raw.role         : "",
    archetype:    typeof raw?.archetype === "string"    ? raw.archetype    : "",
    backstory:    typeof raw?.backstory === "string"    ? raw.backstory    : "",
    motivations:  typeof raw?.motivations === "string"  ? raw.motivations  : "",
    flaws:        typeof raw?.flaws === "string"        ? raw.flaws        : "",
    want:         typeof raw?.want === "string"         ? raw.want         : "",
    need:         typeof raw?.need === "string"         ? raw.need         : "",
    relationships: Array.isArray(raw?.relationships) ? raw.relationships
      .filter((r: any) => r && typeof r.characterId === "string" && typeof r.description === "string")
      .map((r: any) => ({ characterId: r.characterId, description: r.description }))
      : [],
    voice:        typeof raw?.voice === "string"        ? raw.voice        : "",
    arc:          typeof raw?.arc === "string"          ? raw.arc          : "",
    notes:        typeof raw?.notes === "string"        ? raw.notes        : "",
  };
}

function normalizeBeat(raw: any, position: number): Beat {
  return {
    id:      typeof raw?.id === "string" && raw.id ? raw.id : randomId("b"),
    name:    typeof raw?.name === "string"    ? raw.name    : "",
    summary: typeof raw?.summary === "string" ? raw.summary : "",
    purpose: typeof raw?.purpose === "string" ? raw.purpose : "",
    position,
    momentIds: [],
    characterIds: [],
    status: "design",
  };
}

function normalizeEpisode(raw: any, idx: number): Episode {
  const rawBeats = Array.isArray(raw?.beats) ? raw.beats : [];
  return {
    id:     typeof raw?.id === "string" && raw.id ? raw.id : randomId("ep"),
    title:  typeof raw?.title === "string" ? raw.title : `Episode ${idx + 1}`,
    number: typeof raw?.number === "number" ? raw.number : idx + 1,
    beats:  rawBeats.map((b: any, i: number) => normalizeBeat(b, i)),
  };
}

function normalizeScene(raw: any): Scene {
  return {
    id:      typeof raw?.id === "string" && raw.id ? raw.id : randomId("sc"),
    beatId:  typeof raw?.beatId === "string" ? raw.beatId : null,
    heading: typeof raw?.heading === "string" ? raw.heading : "",
    content: typeof raw?.content === "string" ? raw.content : "",
    notes:   typeof raw?.notes === "string" ? raw.notes : "",
  };
}

const ALLOWED_ENDING_TYPES: ReadonlySet<EndingType> =
  new Set(["happy", "bittersweet", "tragic", "ambiguous", "twist"]);

// Exported so Easy mode's expandFullConcept can reuse the protected-
// fields stripping (defense-in-depth: the prompt asks the model to
// omit title/projectType/genres; this guarantees they never make it
// into the patch even if the model misbehaves).
export function normalizeConceptPatch(raw: any) {
  // Strip any protected fields defensively — the prompt asks the model
  // to omit them, but don't trust.
  const patch: {
    logline?: string; summary?: string; tone?: string;
    themes?: string[]; endingTypes?: EndingType[];
  } = {};
  if (typeof raw?.logline === "string") patch.logline = raw.logline;
  if (typeof raw?.summary === "string") patch.summary = raw.summary;
  if (typeof raw?.tone === "string")    patch.tone    = raw.tone;
  if (Array.isArray(raw?.themes)) {
    patch.themes = raw.themes.filter((t: any): t is string => typeof t === "string");
  }
  if (Array.isArray(raw?.endingTypes)) {
    patch.endingTypes = raw.endingTypes
      .filter((t: any): t is EndingType => typeof t === "string" && ALLOWED_ENDING_TYPES.has(t as EndingType));
  }
  return patch;
}

function payloadToContent(
  target: LayerKey,
  raw: any,
  story: Story,
): LayerContent {
  switch (target) {
    case "concept":
      return { kind: "concept", patch: normalizeConceptPatch(raw) };
    case "characters": {
      const list = Array.isArray(raw?.characters) ? raw.characters : [];
      return { kind: "characters", characters: list.map(normalizeCharacter) };
    }
    case "story": {
      if (story.projectType === "tv-show") {
        const rawEps = Array.isArray(raw?.episodes) ? raw.episodes : [];
        return {
          kind: "story",
          beats: [],
          episodes: rawEps.map((e: any, i: number) => normalizeEpisode(e, i)),
        };
      }
      const rawBeats = Array.isArray(raw?.beats) ? raw.beats : [];
      return {
        kind: "story",
        beats: rawBeats.map((b: any, i: number) => normalizeBeat(b, i)),
      };
    }
    case "script": {
      const list = Array.isArray(raw?.scenes) ? raw.scenes : [];
      return { kind: "script", scenes: list.map(normalizeScene) };
    }
    case "episodes": {
      // TV-only sync target. Maps the model's `episodes` array onto
      // the EpisodesLayerDraft shape. Phase 1 doesn't define new
      // sync prompts that target this layer — kept here so the
      // exhaustive-switch return-type check passes and so Phase 3
      // can hook this up without revisiting syncLayer.ts.
      const list = Array.isArray(raw?.episodes) ? raw.episodes : [];
      return { kind: "episodes", episodes: list.map((e: any, i: number) => normalizeEpisode(e, i)) };
    }
    case "arcs": {
      // TV-only sync target. Phase 1 doesn't define sync prompts
      // that target the Arcs layer — kept as a passthrough so the
      // exhaustive-switch type-check passes. When Phase 3 wires up
      // a `sync_concept_to_arcs` action this case will lift the
      // model's `arcs` array into the canonical Arc shape.
      const list = Array.isArray(raw?.arcs) ? raw.arcs : [];
      return { kind: "arcs", arcs: list };
    }
  }
}

// ── Public API ────────────────────────────────────────────────────

function actionTypeFor(source: LayerKey, target: LayerKey): ActionType {
  return `sync_${source}_to_${target}` as ActionType;
}

// ── Import-pipeline helpers ───────────────────────────────────────
// Used by the 4-step script-import flow in components/Studio.tsx. These
// don't fit the syncLayer shape (step 1 takes raw text; step 2 returns
// beats 1:1 with the active script) so they're separate entry points.

/**
 * Step 1 of the import pipeline.
 *
 * Ask the model to identify scene line-ranges in the supplied raw text,
 * then slice the ORIGINAL text by those ranges to build Scene[] whose
 * content is guaranteed word-for-word faithful to the source (the LLM
 * never emits prose — only integers — so it cannot paraphrase).
 */
export async function importExtractScenes(
  story: Story,
  sourceText: string,
  profile?: WriterProfile | null,
): Promise<Scene[]> {
  const action: ActionRequest = {
    type: "import_extract_scenes",
    payload: { sourceText },
  };
  const rawText = await callGenerate(story, action, profile);
  const parsed = extractJson(rawText);

  const lines = sourceText.split("\n");
  const rawScenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];

  const scenes: Scene[] = [];
  for (const s of rawScenes) {
    const headingLine = Number(s?.headingLine);
    const lastLine = Number(s?.lastLine);
    const heading = typeof s?.heading === "string" ? s.heading : "";
    if (!Number.isFinite(headingLine) || !Number.isFinite(lastLine)) continue;
    if (headingLine < 1 || lastLine < headingLine) continue;
    // Convert 1-indexed inclusive range to 0-indexed array slice.
    // Heading line itself isn't part of content — we stored heading separately.
    const bodyLines = lines.slice(headingLine, Math.min(lastLine, lines.length));
    // Trim leading/trailing blank lines from the body; preserve internal blanks.
    while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();
    while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === "") bodyLines.pop();
    scenes.push({
      id: `sc_${Math.random().toString(36).slice(2, 10)}`,
      beatId: null,
      heading: heading.toUpperCase().trim() || `SCENE ${scenes.length + 1}`,
      content: bodyLines.join("\n"),
      notes: "",
    });
  }
  return scenes;
}

/**
 * Step 2 of the import pipeline.
 *
 * Pulls scene prose from the active Script draft (which step 1 just
 * populated) and asks the model for one beat per scene. Returns the
 * beats as Beat[] in scene order — caller drops them into either the
 * top-level beats array or Episode 1, depending on projectType.
 */
export async function importSummarizeScenesIntoBeats(
  story: Story,
  profile?: WriterProfile | null,
): Promise<Beat[]> {
  const action: ActionRequest = {
    type: "import_summarize_scenes",
    payload: {},
  };
  const rawText = await callGenerate(story, action, profile);
  const parsed = extractJson(rawText);
  const rawBeats = Array.isArray(parsed?.beats) ? parsed.beats : [];
  return rawBeats.map((b: any, i: number): Beat => ({
    id: `b_${Math.random().toString(36).slice(2, 10)}`,
    name: typeof b?.name === "string" ? b.name : `Scene ${i + 1}`,
    summary: typeof b?.summary === "string" ? b.summary : "",
    purpose: typeof b?.purpose === "string" ? b.purpose : "",
    position: i,
    momentIds: [],
    characterIds: [],
    status: "design",
  }));
}

export async function syncLayer(
  story: Story,
  source: LayerKey,
  target: LayerKey,
  profile?: WriterProfile | null,
): Promise<Story> {
  if (source === target) {
    throw new Error(`syncLayer: source and target must differ (got ${source})`);
  }
  const action: ActionRequest = {
    type: actionTypeFor(source, target),
    payload: {},
  };
  const rawText = await callGenerate(story, action, profile);
  const parsed = extractJson(rawText);
  const content = payloadToContent(target, parsed, story);
  return applySyncResult(story, content);
}

/**
 * Run several targets from the same source, in canonical order. Results
 * are applied cumulatively to the evolving Story so draft numbering and
 * "empty vs non-empty" checks see the prior writes correctly.
 *
 * NOTE: the source snapshot passed to each LLM call is always the
 * original `story`, so no sync's result pollutes a later sync's source
 * context. Only the write-target state evolves.
 *
 * If any target throws, prior successful writes are preserved and the
 * error is rethrown, tagged with which target failed.
 */
export async function syncLayers(
  story: Story,
  source: LayerKey,
  targets: LayerKey[],
  onStep?: (target: LayerKey) => void,
  profile?: WriterProfile | null,
): Promise<Story> {
  const ordered = [...targets]
    .filter(t => t !== source)
    .sort(compareLayers);

  let next = story;
  for (const target of ordered) {
    onStep?.(target);
    try {
      const action: ActionRequest = {
        type: actionTypeFor(source, target),
        payload: {},
      };
      // Always drive the LLM from the original source snapshot.
      const rawText = await callGenerate(story, action, profile);
      const parsed = extractJson(rawText);
      const content = payloadToContent(target, parsed, next);
      // Apply to the evolving story so draft numbering stays consistent
      // if the same target somehow appears twice (defensive). Decide
      // overwrite-vs-new-draft against the ORIGINAL `story` — otherwise
      // a prior target's write (e.g. syncing to Story first) would reset
      // that layer's content and trick the next empty-check (e.g. for
      // Script, which cross-references written beats) into overwriting.
      next = applySyncResult(next, content, story);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const err = new Error(`Sync to ${target} failed: ${msg}`) as Error & {
        failedTarget?: LayerKey;
        partialStory?: Story;
      };
      err.failedTarget = target;
      err.partialStory = next;
      throw err;
    }
  }
  return next;
}

// ── TV "Upload Script → build the show" pipeline ──────────────────
//
// Five sequential steps that populate the whole project from an
// uploaded script + free-text notes. The driver `importTVProjectFromScript`
// owns the choreography:
//
//   1. Concept fill   — propose ONLY the empty Concept fields
//                       (preserve filled ones).
//   2. Characters     — full cast roster.
//   3. Arcs           — season arcs + character arcs for the top
//                       3-5 most important characters.
//   4. Episodes       — title + logline + seed beats for ALL N
//                       episodes (pilot through finale).
//   5. Pilot screenplay — full scene-prose for Episode 1, written
//                         to be impactful, raw, and setup for the
//                         rest of the season.
//
// Each step's output is APPLIED to the in-flight Story before the
// next step runs, so the bible carries each layer's output forward.
// The `onStep` callback fires with the upcoming step name so the UI
// can show progress; the `onPartialStory` callback fires after each
// successful step so the autosave queue picks up incremental writes
// even if a later step fails.

const TV_IMPORT_STEPS = [
  "concept",
  "characters",
  "arcs",
  "episodes",
  "pilot",
] as const;
export type TVImportStep = (typeof TV_IMPORT_STEPS)[number];

// Map the AI-returned friendly framework labels back to the canonical
// kebab-case slugs the data model uses. We accept either the friendly
// label OR the slug, in case the model leaks the schema verbatim.
const FRAMEWORK_LABEL_TO_SLUG: Record<string, Framework> = {
  "save the cat":   "save-the-cat",
  "save-the-cat":   "save-the-cat",
  "hero's journey": "heros-journey",
  "heros journey":  "heros-journey",
  "heros-journey":  "heros-journey",
  "three-act":      "three-act",
  "three act":      "three-act",
  "story circle":   "story-circle",
  "story-circle":   "story-circle",
};

/** Apply the AI's Concept-fill proposal, honoring the no-overwrite rule.
 *  The prompt is supposed to return null for filled fields, but we
 *  belt-and-suspenders by checking each filled field on the client too. */
function applyTVImportConceptResult(story: Story, parsed: any): Story {
  const c = getActiveConceptDraft(story);
  const out: any = { ...c };
  // Each field: only adopt the AI's value if the field is currently
  // empty AND the AI proposed a non-null value of the right shape.
  if (!c.logline?.trim() && typeof parsed?.logline === "string" && parsed.logline.trim()) {
    out.logline = parsed.logline.trim();
  }
  const concept = { ...c.concept };
  if (!c.concept?.summary?.trim() && typeof parsed?.summary === "string" && parsed.summary.trim()) {
    concept.summary = parsed.summary.trim();
  }
  if ((c.concept?.themes?.length ?? 0) === 0 && Array.isArray(parsed?.themes)) {
    const themes = parsed.themes
      .map((t: any) => (typeof t === "string" ? t.trim() : ""))
      .filter((t: string) => t.length > 0);
    if (themes.length > 0) concept.themes = themes;
  }
  out.concept = concept;
  const settings = { ...c.settings };
  if (!c.settings.framework && typeof parsed?.framework === "string") {
    const mapped = FRAMEWORK_LABEL_TO_SLUG[parsed.framework.trim().toLowerCase()];
    if (mapped) settings.framework = mapped;
  }
  out.settings = settings;
  return updateConceptDraft(story, out);
}

/** Apply the AI's character roster. Replaces the active draft's
 *  characters wholesale — TV import is a fresh-population flow, not
 *  an incremental merge, so the writer starts from a clean slate. */
function applyTVImportCharactersResult(story: Story, parsed: any): Story {
  const raw = Array.isArray(parsed?.characters) ? parsed.characters : [];
  const allowedRoles = new Set([
    "protagonist", "antagonist", "supporting", "mentor", "love_interest", "comic_relief",
  ]);
  const characters: Character[] = raw.map((ch: any, i: number): Character => ({
    id: `ch_${Math.random().toString(36).slice(2, 10)}`,
    name: typeof ch?.name === "string" ? ch.name.trim() : `Character ${i + 1}`,
    role: allowedRoles.has(ch?.role) ? ch.role : "supporting",
    archetype: typeof ch?.archetype === "string" ? ch.archetype.trim() : "",
    gender: typeof ch?.gender === "string" ? (ch.gender as any) : undefined,
    age: typeof ch?.age === "string" ? ch.age : "",
    backstory: typeof ch?.backstory === "string" ? ch.backstory : "",
    motivations: typeof ch?.motivations === "string" ? ch.motivations : "",
    flaws: typeof ch?.flaws === "string" ? ch.flaws : "",
    want: typeof ch?.want === "string" ? ch.want : "",
    need: typeof ch?.need === "string" ? ch.need : "",
    // Filled in the second pass below — the AI emits relationships by
    // character NAME (it never sees ids), so resolution has to wait
    // until every character has an id.
    relationships: [],
    voice: typeof ch?.voice === "string" ? ch.voice : "",
    arc: typeof ch?.arc === "string" ? ch.arc : "",
    notes: typeof ch?.notes === "string" ? ch.notes : "",
  }));
  // Second pass — resolve each character's relationships[] from names
  // to ids. These render into every downstream prompt as FIXED FACTS
  // (the gauntlet's F2 gap: the render path existed but TV-import
  // never populated the data). Unresolvable names and self-references
  // are dropped rather than kept as dangling ids.
  const idByName = new Map(characters.map(c => [c.name.trim().toLowerCase(), c.id]));
  characters.forEach((c, i) => {
    c.relationships = resolveRelationshipNames(raw[i]?.relationships, idByName, c.id);
  });
  return updateCharactersDraft(story, { characters });
}

/** Resolve AI-emitted `{ with: name, description }` relationship rows
 *  to `{ characterId, description }` against a lowercased name→id map.
 *  Shared by TV import and derive_relationships. Drops rows whose name
 *  doesn't resolve, self-references, and duplicate targets. */
export function resolveRelationshipNames(
  rawRels: any,
  idByName: Map<string, string>,
  selfId: string,
): CharacterRelationship[] {
  if (!Array.isArray(rawRels)) return [];
  const out: CharacterRelationship[] = [];
  const seen = new Set<string>();
  for (const r of rawRels) {
    const name = typeof r?.with === "string" ? r.with.trim().toLowerCase() : "";
    const description = typeof r?.description === "string" ? r.description.trim() : "";
    const characterId = idByName.get(name);
    if (!characterId || !description || characterId === selfId || seen.has(characterId)) continue;
    seen.add(characterId);
    out.push({ characterId, description });
  }
  return out;
}

/** Enforce the curve grammar's per-arc season budget on an
 *  AI-generated intensity curve: DOMINANT (8-10) in at most 2
 *  episodes, everything below the arc's top-6 episodes pressed into
 *  BACKGROUND (1-3). The prompt teaches the budget but three live
 *  rounds proved the model cannot hold numeric allocations across a
 *  whole season (it places PEAKS well; it pads the valleys with
 *  polite 6s). So: the model decides WHERE an arc peaks — that's the
 *  creative signal and it is never moved or raised — and this pass
 *  compresses only DOWNWARD so every curve has real valleys:
 *    - the arc's top-2 episodes keep their exact scores
 *    - its next-4 episodes cap at 7 (ACTIVE)
 *    - everything below caps at 3 (BACKGROUND)
 *  Downward-only means designed convergence episodes survive (peaks
 *  stay peaks) and no arc is ever inflated. Exported for testing.
 *  Applied ONLY to import-generated arcs — user-authored curves are
 *  never touched. */
export function enforceCurveBudget(scores: number[]): number[] {
  const ranked = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x, rank) => ({ ...x, rank }));
  const out = [...scores];
  for (const { i, rank } of ranked) {
    if (rank < 2) continue;                       // top-2: untouched
    else if (rank < 6) out[i] = Math.min(out[i], 7); // ACTIVE cap
    else out[i] = Math.min(out[i], 3);            // BACKGROUND cap
  }
  return out;
}

/** The budget's global half. Per-arc caps alone can't stop STACKING —
 *  ten arcs can still park their hot slots on the same episode (live
 *  measurement: max 11 arcs ≥6 in one hour even after per-arc caps).
 *  So per episode: the 5 hottest arcs keep their scores; every other
 *  arc ≥6 there is pressed to 5 — still ACTIVE (it keeps its beats in
 *  the digest), no longer claiming heat it can't be given on screen.
 *  Ties resolve by arc order (the model lists main-plot first, so
 *  structural arcs win ties). Peaks kept by the per-arc pass are
 *  ranked highest and therefore never pressed unless 5 hotter arcs
 *  own the hour — exactly the triage the digest's overload note asks
 *  the model to perform, done deterministically at the source.
 *  Exported for testing. */
export function enforceEpisodeHeat(all: number[][]): number[][] {
  if (all.length === 0) return all;
  const out = all.map(s => [...s]);
  const epCount = out[0]?.length ?? 0;
  for (let ep = 0; ep < epCount; ep++) {
    const hot = out
      .map((s, arcIdx) => ({ score: s[ep], arcIdx }))
      .filter(x => x.score >= 6)
      .sort((a, b) => b.score - a.score || a.arcIdx - b.arcIdx);
    for (const x of hot.slice(5)) out[x.arcIdx][ep] = 5;
  }
  return out;
}

/** Apply the AI's season arcs. Each arc gets a fresh id + an assigned
 *  color from ARC_COLORS in order. Character-type arcs resolve their
 *  characterName back to a characterId by exact-match search against
 *  the cast (case-insensitive). Anything unresolvable falls back to a
 *  generic character arc without an explicit linked character. */
function applyTVImportArcsResult(story: Story, parsed: any, episodeCount: number): Story {
  const raw = Array.isArray(parsed?.arcs) ? parsed.arcs : [];
  const chars = getActiveCharactersDraft(story).characters;
  const byName = new Map(chars.map(c => [c.name.trim().toLowerCase(), c.id]));
  // Two-phase apply: normalize every arc first (per-arc curve budget
  // included), run the GLOBAL episode-heat pass across the whole set,
  // then add to the draft. See enforceCurveBudget/enforceEpisodeHeat.
  const pending: Array<{
    type: ArcType; title: string; description: string; scores: number[];
    characterId?: string; moments?: Array<{ id: string; position: number; text: string }>;
  }> = [];
  for (const a of raw) {
    const type = typeof a?.type === "string" && (ARC_TYPES as readonly string[]).includes(a.type)
      ? (a.type as ArcType)
      : "subplot";
    const title = typeof a?.title === "string" ? a.title.trim() : "";
    const description = typeof a?.description === "string" ? a.description.trim() : "";
    const rawScores = Array.isArray(a?.scores) ? a.scores : [];
    const clamped: number[] = [];
    for (let i = 0; i < episodeCount; i++) {
      const s = Number(rawScores[i]);
      clamped.push(Number.isFinite(s) ? Math.max(1, Math.min(10, Math.round(s))) : 5);
    }
    // Curve-grammar enforcement, per-arc half — see enforceCurveBudget
    // above. The global per-episode half runs after the loop, once
    // every arc's curve is known.
    const scores = enforceCurveBudget(clamped);
    const linkedName = typeof a?.characterName === "string" ? a.characterName.trim().toLowerCase() : "";
    const characterId = linkedName ? byName.get(linkedName) : undefined;
    // Hard moments — the arcs-quality pass extended the schema so the
    // model anchors 1-3 filmable turns per major arc. AI emits 1-based
    // episode numbers; ArcMoment.position is a 0-based fractional
    // episode index, so EP n lands at position n-1 (exactly on the
    // episode's marker). Invalid rows are dropped, positions clamped
    // into the season, and text is required (a diamond with no event
    // is noise downstream — the digest renders it "(empty moment)").
    const rawMoments = Array.isArray(a?.moments) ? a.moments : [];
    const moments = rawMoments
      .filter((m: any) => m && Number.isFinite(Number(m.episode)) && typeof m.text === "string" && m.text.trim())
      .slice(0, 3)
      .map((m: any) => ({
        id: `am_${Math.random().toString(36).slice(2, 10)}`,
        position: Math.max(0, Math.min(episodeCount - 1, Math.round(Number(m.episode)) - 1)),
        text: m.text.trim(),
      }));
    pending.push({
      type: characterId ? "character" : type,
      title,
      description,
      scores,
      ...(characterId ? { characterId } : {}),
      ...(moments.length ? { moments } : {}),
    });
  }
  // Global half of the curve grammar: at most 5 arcs hot (≥6) per
  // episode; everything past the top-5 there is pressed to 5.
  const balanced = enforceEpisodeHeat(pending.map(p => p.scores));
  let next = story;
  pending.forEach((p, i) => {
    next = addArcToActiveDraft(next, {
      ...p,
      scores: balanced[i],
      // Character arcs from the AI implicitly have intensitySet=true —
      // the writer's job here is to seed the arc with intent.
      intensitySet: true,
    });
  });
  return next;
}

/** Apply the AI's full season of episodes. Each episode gets a fresh
 *  id; beats inside each episode also get fresh ids. Replaces the
 *  active episodes draft's episodes array wholesale. */
function applyTVImportEpisodesResult(story: Story, parsed: any): Story {
  const raw = Array.isArray(parsed?.episodes) ? parsed.episodes : [];
  const allowedArchetypes = new Set([
    "pilot", "case-of-the-week", "myth-arc", "character-focus",
    "two-hander", "bottle", "flashback", "finale", "premiere",
  ]);
  // Bulk step intentionally returns NO beats. Every episode is a fresh
  // empty container — beats for the pilot get generated in the next
  // step (tv_import_pilot, alongside the screenplay); beats for episodes
  // 2..N stay empty and are generated lazily later (per-episode, on
  // demand) so this single bulk call stays well under the output cap on
  // long seasons. If the model accidentally returns a `beats` array we
  // discard it — the schema only asks for containers.
  const episodes: Episode[] = raw
    .map((ep: any, i: number): Episode => {
      const num = Number(ep?.number);
      return {
        id: `ep_${Math.random().toString(36).slice(2, 10)}`,
        number: Number.isFinite(num) && num > 0 ? Math.round(num) : i + 1,
        title: typeof ep?.title === "string" ? ep.title.trim() : `Episode ${i + 1}`,
        logline: typeof ep?.logline === "string" ? ep.logline.trim() : "",
        archetype: allowedArchetypes.has(ep?.archetype) ? ep.archetype : undefined,
        beats: [],
      };
    })
    .sort((a: Episode, b: Episode) => (a.number ?? 0) - (b.number ?? 0));
  return updateEpisodesDraft(story, { episodes });
}

/** Apply the AI's pilot output. Step 4 (tv_import_episodes) leaves
 *  the pilot's beats EMPTY — this step generates both the beat sheet
 *  and a screenplay scene per beat in a single Opus call, so we have
 *  to materialize the beats FIRST (from parsed.beats), then splice
 *  each scene's prose onto its matching beat by `beatIndex`. Mirrors
 *  what the existing importScriptFromText does for feature/short
 *  projects, just scoped to Episode 1. The Scene[] for the active
 *  Script draft is rebuilt from the scenes too (linking back to
 *  beats via beatId).
 *
 *  Resilience: if parsed.beats is missing/empty but parsed.scenes is
 *  present (older model output, or the model decided to skip the
 *  beats array), we fall back to deriving beats from the scenes —
 *  one beat per scene, name = "Scene N" — so the pilot at least
 *  renders. Better than dropping the whole step on a schema slip. */
function applyTVImportPilotResult(story: Story, parsed: any): Story {
  const rawBeats = Array.isArray(parsed?.beats) ? parsed.beats : [];
  const rawScenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];

  // Surface empty-array failures as REAL errors instead of silent no-ops.
  // Previously, when the model returned `{ "beats": [], "scenes": [] }`,
  // we'd patch the pilot with empty beats and the user would see "no
  // beats, no script" with zero diagnostic context. The TV-import popup
  // would just close as if everything succeeded.
  if (rawBeats.length === 0 && rawScenes.length === 0) {
    throw new Error(
      `Pilot step succeeded HTTP-wise but the model returned empty beats AND scenes arrays. The bible/source may have triggered a refusal, or the prompt was overconstrained. Raw response keys: ${Object.keys(parsed ?? {}).join(", ") || "(none)"}`,
    );
  }

  const epd = getActiveEpisodesDraft(story);
  if (!epd || epd.episodes.length === 0) {
    throw new Error(
      "Pilot step ran but no episodes draft exists. Step 4 (episodes) must complete successfully before step 5.",
    );
  }
  const sorted = [...epd.episodes].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const pilot = sorted[0];

  // 1. Materialize pilot beats. Prefer parsed.beats; fall back to
  //    one-beat-per-scene if the model skipped the beats array.
  const beatSeeds: { name: string; summary: string; purpose: string }[] =
    rawBeats.length > 0
      ? rawBeats.map((b: any, i: number) => ({
          name: typeof b?.name === "string" ? b.name : `Beat ${i + 1}`,
          summary: typeof b?.summary === "string" ? b.summary : "",
          purpose: typeof b?.purpose === "string" ? b.purpose : "",
        }))
      : rawScenes.map((_s: any, i: number) => ({
          name: `Scene ${i + 1}`,
          summary: "",
          purpose: "",
        }));

  const pilotBeats: Beat[] = beatSeeds.map((seed, i) => {
    const match = rawScenes.find((s: any) => Number(s?.beatIndex) === i);
    const content = typeof match?.content === "string" ? match.content : "";
    return {
      id: `b_${Math.random().toString(36).slice(2, 10)}`,
      name: seed.name,
      summary: seed.summary,
      purpose: seed.purpose,
      position: i,
      momentIds: [],
      characterIds: [],
      // Beats with a matched scene get their prose + "written" status;
      // any beat the model failed to write a scene for stays "design".
      ...(content.trim()
        ? { sceneContent: content, status: "written" as const }
        : { status: "design" as const }),
    };
  });

  // Patch the pilot episode with the new beats array.
  const nextEpisodes = sorted.map(e =>
    e.id === pilot.id ? { ...e, beats: pilotBeats } : e,
  );
  let next = updateEpisodesDraft(story, { episodes: nextEpisodes });

  // 2. Build the Script-layer Scene[] for the pilot's scenes so the
  //    Script tab renders the prose. Mirror what the existing import
  //    does: one Scene per written beat, linked via beatId, heading
  //    from the AI's "INT./EXT. …" slug.
  const scenes: Scene[] = pilotBeats
    .map((b, i): Scene | null => {
      if (b.status !== "written" || !b.sceneContent?.trim()) return null;
      const match = rawScenes.find((s: any) => Number(s?.beatIndex) === i);
      const heading = typeof match?.heading === "string" && match.heading.trim()
        ? match.heading.trim().toUpperCase()
        : `SCENE ${i + 1}`;
      return {
        id: `sc_${Math.random().toString(36).slice(2, 10)}`,
        beatId: b.id,
        heading,
        content: b.sceneContent ?? "",
        notes: "",
      };
    })
    .filter((s): s is Scene => s !== null);
  const scriptDraft = getActiveScriptDraft(next);
  if (scriptDraft) {
    next = updateScriptDraft(next, {
      script: { ...scriptDraft.script, scenes },
    });
  }
  return next;
}

export interface TVImportInput {
  scriptText?: string;
  notes?: string;
  episodeCount?: number;
  /** Admin-only diagnostic flag. When true, every step asks the model
   *  for the bare minimum output (2 characters, 2 arcs, 2 episodes,
   *  2 pilot beats + 2 pilot scenes) so a full pipeline run can be
   *  smoke-tested for a few cents instead of a few dollars. Gated by
   *  isAdmin(userEmail) in the UI — never exposed to end users. */
  testMode?: boolean;
}

export interface TVImportCallbacks {
  /** Fires with the NEXT step about to start so the UI can swap the
   *  caption / spinner. Called five times total. */
  onStep?: (step: TVImportStep) => void;
  /** Fires after each successful step with the evolving Story. The
   *  caller should call setStory() so the autosave queue picks up
   *  incremental writes even if a later step fails. */
  onPartialStory?: (s: Story) => void;
}

/** Top-level orchestrator. Runs the 5 steps sequentially against the
 *  same evolving Story, calls back per step, returns the final Story. */
export async function importTVProjectFromScript(
  initial: Story,
  input: TVImportInput,
  callbacks: TVImportCallbacks = {},
  profile?: WriterProfile | null,
): Promise<Story> {
  const { onStep, onPartialStory } = callbacks;
  // Test mode forces episodeCount=1 (just the pilot) — minimum
  // viable to validate the pipeline. Saves ~50% on the episodes
  // step vs. the previous 2-episode test cadence.
  const testMode = input.testMode === true;
  const episodeCount = testMode
    ? 1
    : Math.max(1, Math.min(30, Number(input.episodeCount) || 8));
  let story = initial;

  async function runStep<T = void>(
    step: TVImportStep,
    action: ActionRequest,
    apply: (parsed: any) => Story,
  ): Promise<void> {
    onStep?.(step);
    const raw = await callGenerate(story, action, profile);
    const parsed = extractJson(raw);
    if (!parsed) {
      throw new Error(`Step "${step}" returned unparseable JSON. The model output was probably truncated — try a shorter source document.`);
    }
    story = apply(parsed);
    onPartialStory?.(story);
  }

  // Common payload shared across every step so the prompts can read
  // testMode + the user's free-text inputs without each step having to
  // re-build its own bag.
  const basePayload = {
    scriptText: input.scriptText,
    notes: input.notes,
    testMode,
  };

  // Step 1 — Concept fill (no overwrite). Skipped entirely in test
  // mode — no API call, no progress label. The user can fill
  // concept separately via the Easy-mode "Create Logline" CTA.
  if (!testMode) {
    await runStep(
      "concept",
      { type: "tv_import_concept", payload: basePayload },
      parsed => applyTVImportConceptResult(story, parsed),
    );
  }

  // Step 2 — Characters.
  await runStep(
    "characters",
    { type: "tv_import_characters", payload: basePayload },
    parsed => applyTVImportCharactersResult(story, parsed),
  );

  // Persist the episodeCount setting BEFORE Step 3 so the arcs step
  // sees the right value in the bible (and so the AI's scores arrays
  // come back the right length).
  story = updateConceptDraft(story, {
    settings: { ...getActiveConceptDraft(story).settings, episodeCount },
  });
  onPartialStory?.(story);

  // Step 3 — Arcs (including 3-5 character arcs for the top mains).
  await runStep(
    "arcs",
    { type: "tv_import_arcs", payload: { ...basePayload, episodeCount } },
    parsed => applyTVImportArcsResult(story, parsed, episodeCount),
  );

  // Step 4 — Full slate of episodes.
  await runStep(
    "episodes",
    { type: "tv_import_episodes", payload: { ...basePayload, episodeCount } },
    parsed => applyTVImportEpisodesResult(story, parsed),
  );

  // Step 5 — Pilot screenplay.
  await runStep(
    "pilot",
    { type: "tv_import_pilot", payload: basePayload },
    parsed => applyTVImportPilotResult(story, parsed),
  );

  return story;
}
