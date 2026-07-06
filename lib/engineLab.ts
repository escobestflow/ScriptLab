// Engine Lab — account-level taste profile + project-level creative
// guardrails, and the render functions that inject them into prompts.
//
// This module is PURE (no React, no I/O, safe on server and client) —
// the same discipline as lib/writerProfile.ts. Persistence rides
// existing channels:
//   - TasteProfile lives at WriterProfile.tasteProfile (same ride as
//     styleProfile: writer_profiles table + localStorage mirror, ships
//     to the server in the `profile` request param every prompt reads).
//   - ProjectGuardrails lives at Story.guardrails (inside the project
//     JSON; lib/storage.ts normalizer passes it through).
//
// Injection contract (the regression gate the whole engine program
// lives by): EVERYTHING here renders conditionally. Absent taste,
// absent guardrails ⇒ byte-identical prompts to the pre-Lab engine.
// See FABLE_ENGINE_LAB_PRD.md.

// ─── Account-level taste profile ──────────────────────────────────────

export interface TasteProfile {
  /** Ids from TASTE_PRINCIPLES plus free-text custom principles.
   *  Customs are stored verbatim and rendered as their own lines. */
  principles: string[];
  /** Free-text elaboration in the user's own words. */
  notes: string;
  updatedAt: string;
  /** Bumped on every save — cheap provenance for run logs. */
  version: number;
}

/** Curated principles. Each `promptLine` is written in the same
 *  vocabulary as the engine's craft contracts (sanitization, safe
 *  conventional substitute, FIXED FACTS) so the taste block REINFORCES
 *  those contracts instead of paraphrasing them into a second voice.
 *  Hard lines (never eroticize minors, etc.) are deliberately NOT
 *  taste options — they live unconditionally in
 *  EDGE_PRESERVATION_RULES and cannot be toggled here. */
export const TASTE_PRINCIPLES: ReadonlyArray<{
  id: string;
  label: string;
  promptLine: string;
}> = [
  {
    id: "edgy-grounded",
    label: "Edgy but grounded",
    promptLine: "Prefer edge that grows out of the material's own reality — danger, transgression, and moral risk rendered with grounded, specific detail, never shock for its own sake.",
  },
  {
    id: "darkly-funny",
    label: "Darkly funny",
    promptLine: "Dark comedy is a feature, not an accident: mine the gap between how bad things are and how people behave about them. Laughs and dread can share a scene.",
  },
  {
    id: "morally-awkward",
    label: "Morally awkward",
    promptLine: "Let characters want things they shouldn't and be right about things for wrong reasons. Do not resolve moral awkwardness into clean lessons.",
  },
  {
    id: "unexpected",
    label: "Unexpected over familiar",
    promptLine: "When a choice point has an expected version, look for the truthful unexpected version first. Misdirection over cliché; cliffhangers over tidy bows.",
  },
  {
    id: "not-sanitized",
    label: "Never sanitized",
    promptLine: "Never sanitize. Replacing uncomfortable material with a safer conventional substitute is a failure mode (named 'sanitization' in this engine), not a courtesy.",
  },
  {
    id: "emotionally-messy",
    label: "Emotionally messy",
    promptLine: "People contradict themselves mid-scene. Prefer emotional mess rendered precisely over feelings stated cleanly.",
  },
  {
    id: "specific-over-generic",
    label: "Specific over generic",
    promptLine: "This story's nouns, this world's machinery. A line that could appear in three other projects is a draft note, not a keeper.",
  },
  {
    id: "preserve-discomfort-responsibly",
    label: "Preserve discomfort responsibly",
    promptLine: "When the material is deliberately uncomfortable, keep the discomfort ON the page as discomfort — wrongness stays wrong, boundaries hold, consequences are real.",
  },
  {
    id: "no-safe-substitutions",
    label: "No safe substitutions",
    promptLine: "Never swap a difficult dynamic for an age-appropriate, lower-stakes, or more conventional stand-in. The difficult version IS the project.",
  },
];

const PRINCIPLE_BY_ID = new Map(TASTE_PRINCIPLES.map(p => [p.id, p]));

export function emptyTasteProfile(): TasteProfile {
  return { principles: [], notes: "", updatedAt: new Date().toISOString(), version: 0 };
}

export function hasTasteContent(t: TasteProfile | null | undefined): boolean {
  if (!t) return false;
  return (t.principles?.length ?? 0) > 0 || !!t.notes?.trim();
}

/** Compile the taste profile into its prompt block. Returns "" when
 *  empty — the caller must then omit the block entirely (byte-identical
 *  prompts for users without a taste profile). */
export function renderTasteForPrompt(t: TasteProfile | null | undefined): string {
  if (!hasTasteContent(t)) return "";
  const lines: string[] = [];
  lines.push("# ACCOUNT TASTE PROFILE (binding)");
  lines.push("The writer's standing creative taste, authored deliberately. These are working principles for every generation — not a mood board. Where a principle names a failure mode, treat producing that failure mode as an error. Hard safety lines defined elsewhere in this prompt always take precedence and are never relaxed by taste.");
  lines.push("");
  for (const raw of t!.principles) {
    const known = PRINCIPLE_BY_ID.get(raw);
    lines.push(`- ${known ? known.promptLine : raw}`);
  }
  if (t!.notes?.trim()) {
    lines.push("");
    lines.push("In the writer's own words:");
    lines.push(t!.notes.trim());
  }
  return lines.join("\n");
}

// ─── Project-level guardrails ─────────────────────────────────────────

export interface ProjectGuardrails {
  /** Elements that may never be sanitized away or written around. */
  mustPreserve?: string;
  /** Clichés, shapes, and content to steer around. */
  avoid?: string;
  /** Known failure substitutions — "do not turn this into…". */
  doNotTurnInto?: string;
  /** Register boundaries — where the tone may and may not go. */
  toneGuardrails?: string;
  /** Why the discomfort is deliberate and how to carry it. */
  edgeNotes?: string;
  /** Premise-specific responsible-handling notes. */
  sensitiveHandling?: string;
  /** What makes this project one-of-a-kind — protect it. */
  uniqueness?: string;
  /** Which references outrank which, and for what aspects. */
  referencePriorities?: string;
}

/** Field registry — single source for the bible render AND the Lab's
 *  editor UI, so a new guardrail field added here appears in both. */
export const GUARDRAIL_FIELDS: ReadonlyArray<{
  key: keyof ProjectGuardrails;
  label: string;
  promptLabel: string;
  placeholder: string;
}> = [
  { key: "mustPreserve", label: "Must preserve", promptLabel: "MUST PRESERVE", placeholder: "Elements that may never be sanitized away, softened, or written around…" },
  { key: "avoid", label: "Avoid", promptLabel: "AVOID", placeholder: "Clichés, story shapes, imagery, or content to steer around…" },
  { key: "doNotTurnInto", label: "Do not turn this into", promptLabel: "DO NOT TURN THIS INTO", placeholder: "The safe conventional versions this project must never collapse into…" },
  { key: "toneGuardrails", label: "Tone guardrails", promptLabel: "TONE GUARDRAILS", placeholder: "Where the register may and may not go…" },
  { key: "edgeNotes", label: "Edge / discomfort notes", promptLabel: "EDGE / DISCOMFORT (deliberate)", placeholder: "Why the uncomfortable material is intentional and how to carry it…" },
  { key: "sensitiveHandling", label: "Sensitive premise handling", promptLabel: "SENSITIVE-PREMISE HANDLING", placeholder: "Premise-specific rules for handling difficult dynamics responsibly…" },
  { key: "uniqueness", label: "What makes this unique", promptLabel: "WHAT MAKES THIS PROJECT UNIQUE", placeholder: "The one-of-a-kind mechanism/container/voice to protect…" },
  { key: "referencePriorities", label: "Reference priorities", promptLabel: "REFERENCE PRIORITIES", placeholder: "Which references outrank which, and for what aspects…" },
];

export function hasGuardrails(g: ProjectGuardrails | null | undefined): boolean {
  if (!g) return false;
  return GUARDRAIL_FIELDS.some(f => !!g[f.key]?.trim());
}

/** Render the guardrails section of the story bible. Returns "" when
 *  every field is empty — the bible must omit the section entirely.
 *  Rendered INSIDE the bible so BIBLE_FIDELITY_RULES' "bible facts are
 *  binding" contract already covers it on every content-creating ask. */
export function renderGuardrailsForBible(g: ProjectGuardrails | null | undefined): string {
  if (!hasGuardrails(g)) return "";
  const lines: string[] = [];
  lines.push("## Project guardrails (BINDING — authored by the writer)");
  lines.push("These are constraints, not suggestions. A generation that violates a guardrail is wrong even if it is otherwise excellent.");
  for (const f of GUARDRAIL_FIELDS) {
    const v = g![f.key]?.trim();
    if (v) lines.push(`- ${f.promptLabel}: ${v}`);
  }
  return lines.join("\n");
}

/** Defensive normalization for guardrails coming out of storage.
 *  Unknown keys are dropped; known keys are coerced to trimmed strings;
 *  a guardrails object with no content normalizes to undefined so
 *  empty saves don't grow the story JSON. */
export function normalizeGuardrails(raw: any): ProjectGuardrails | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: ProjectGuardrails = {};
  let any = false;
  for (const f of GUARDRAIL_FIELDS) {
    const v = raw[f.key];
    if (typeof v === "string" && v.trim()) {
      out[f.key] = v;
      any = true;
    }
  }
  return any ? out : undefined;
}

// ─── Run log (Test Runner history) ───────────────────────────────────
// Stored client-side (localStorage) in the Lab. Deliberately NOT a
// database: one admin user, and the durable record of engine quality
// remains the committed FABLE_*.md docs + snapshot baselines. The Lab
// offers JSON export/import for anything worth keeping.

export interface EngineLabRun {
  id: string;
  at: string;                    // ISO timestamp
  fixture: string;               // fixture name or "project:<id>"
  action: string;
  payload?: Record<string, any>;
  mode: "dry" | "live";
  model: string;
  /** Dry runs: estimated input cost. Live runs: actual total cost. */
  costUsd: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  /** Live runs only — the generated text. Dry runs store nothing big;
   *  the prompt is reproducible from the fixture at $0. */
  output?: string;
  /** Rubric scoring — criterion id → 0 | 1 | 2 (or -1 for n/a). */
  scores?: Record<string, number>;
  passFail?: "pass" | "fail" | null;
  notes?: string;
  /** Taste/guardrail provenance so regressions are attributable. */
  tasteVersion?: number | null;
  hadGuardrails?: boolean;
}

export const ENGINE_LAB_RUNS_KEY = "ws:engine-lab:runs";
export const ENGINE_LAB_MAX_RUNS = 200;

// ─── Rubrics (embedded from the committed rubric docs) ───────────────
// Source of truth remains FABLE_GAUNTLET_RUBRICS.md +
// FABLE_ENGINE_LOGLINE_TEST_PLAN.md — these are transcriptions so the
// Lab can score without leaving the page. `gate: true` criteria at 0
// force FAIL regardless of total.

export interface RubricCriterion {
  id: string;
  label: string;
  gate?: boolean;
  naAble?: boolean;
}

export interface Rubric {
  id: string;
  title: string;
  passNote: string;
  criteria: RubricCriterion[];
}

export const ENGINE_LAB_RUBRICS: ReadonlyArray<Rubric> = [
  {
    id: "logline",
    title: "Logline (v2 rubric, v5-era gate)",
    passNote: "Pass = no gate 0 AND total ≥ 10/14 (≥ 9/12 when reference texture is n/a).",
    criteria: [
      { id: "L1", label: "Protagonist contradiction (castable, not demographic)" },
      { id: "L2", label: "External pressure (filmable force w/ clock or container FROM the material)" },
      { id: "L3", label: "Ironic trap (goal and obstacle feed each other)" },
      { id: "L4", label: "Final clause — concrete act/cost/collision; NO insight/menu/imported-scaffolding endings", gate: true },
      { id: "L5", label: "Concrete language (≥3 story nouns, no abstract-emotion words)" },
      { id: "L6", label: "Reference texture (felt, no titles named)", naAble: true },
      { id: "L7", label: "Uniqueness (the one-of-a-kind container visible)" },
    ],
  },
  {
    id: "beats",
    title: "Beats (pass ≥ 10/14, no gate 0)",
    passNote: "Any GATE at 0 = FAIL.",
    criteria: [
      { id: "B1", label: "Causality — but/therefore chain, no 'and then' joints", gate: true },
      { id: "B2", label: "Escalation — a mid-sheet turn changes the problem's NATURE" },
      { id: "B3", label: "Final beat lands the ending-type contract with a specific image/act" },
      { id: "B4", label: "Purpose quality — names an audience effect, not a plot restatement" },
      { id: "B5", label: "Specificity — THIS story's nouns, no template beat names" },
      { id: "B6", label: "Fidelity — characters/relationships/facts match the bible exactly", gate: true },
      { id: "B7", label: "Intent — dials, locked ingredients, snippets, user direction honored" },
    ],
  },
  {
    id: "scene",
    title: "Scene (pass ≥ 11/16; gates S1, S2 when purpose set, S7)",
    passNote: "Gates: S1 always, S2 when the beat has a purpose, S7 always.",
    criteria: [
      { id: "S1", label: "Decision or revelation ON SCREEN", gate: true },
      { id: "S2", label: "Purpose contract — the beat's purpose demonstrably happens", gate: true, naAble: true },
      { id: "S3", label: "Subtext — nobody states the theme or their need out loud" },
      { id: "S4", label: "Voice distinctness — swap test passes" },
      { id: "S5", label: "Concrete staging — filmable, specific objects, no camera directions" },
      { id: "S6", label: "Anti-generic prose — no stock gestures or paraphrases of them" },
      { id: "S7", label: "Fidelity — names/relationships/ages/facts match the bible", gate: true },
      { id: "S8", label: "Dials + linked moments genuinely expressed", naAble: true },
    ],
  },
  {
    id: "script",
    title: "Script cohesion (pass ≥ 10/14, no gate 0)",
    passNote: "Any GATE at 0 = FAIL.",
    criteria: [
      { id: "C1", label: "Compounding — each scene raises the price of the next", gate: true },
      { id: "C2", label: "Continuity — facts/objects/time survive across scenes" },
      { id: "C3", label: "Voice stability — consistent AND distinct throughout" },
      { id: "C4", label: "Beat coverage — every purpose landed (score the weakest)" },
      { id: "C5", label: "Fidelity in every scene", gate: true },
      { id: "C6", label: "Prose quality — weakest scene clears S3–S6 at ≥1 each" },
      { id: "C7", label: "Format — sluglines/action/CAPS cues consistent; lengths in bounds" },
    ],
  },
];

/** Which rubric applies to which runner action. Actions without a
 *  rubric (characters, relationships) get free-form pass/fail + notes. */
export const RUBRIC_FOR_ACTION: Record<string, string> = {
  generate_concept_logline: "logline",
  generate_beats: "beats",
  generate_scene: "scene",
  sync_story_to_script: "script",
};
