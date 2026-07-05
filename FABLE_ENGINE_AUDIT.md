# FABLE_ENGINE_AUDIT — Unfold Creative Output Engine

Audited at tag `pre-fable-engine-backup` (= `main` @ `d582ec0`).
Every claim below was verified against the code during this audit, not
recalled from prior sessions. File references are clickable paths.

---

## 1. Architecture summary

Unfold is a Next.js 14 App Router app (TypeScript, React 18, Supabase,
Vercel). The AI engine is four files:

| File | Role |
|---|---|
| `lib/prompt.ts` | `SYSTEM_BRAIN` (the fixed system prompt), `ActionType` union (~60 actions), `modelForAction` 3-tier routing, `PRICING` table |
| `lib/contextBuilder.ts` | `buildPrompt(story, action, profile)` — assembles cached system blocks + per-action "ask"; ~60 ask builders live here |
| `lib/story.ts` | The `Story` JSON — single source of truth the UI edits and every prompt reads (layered drafts: Concept/Characters/Story/Script/Episodes/Arcs) |
| `app/api/generate/route.ts` | The single streaming text endpoint — beta gate, model routing, token caps, cost logging |

Supporting: `lib/syncLayer.ts` (multi-step orchestrators: layer syncs,
5-step TV import), `lib/easyMode.ts` (one-tap full-project chain),
`lib/scriptLoop.ts` (per-beat scene loop), `lib/writerProfile.ts` +
`lib/styleProfile.ts` (taste systems, §7), `lib/usageLog.ts` (cost
telemetry to the `usage_log` table + admin dashboard).

## 2. Creative generation flow

1. UI handler builds `{ story, action: { type, payload }, profile }`
   and POSTs to `/api/generate` (e.g. `generateConcept()` in
   `components/Studio.tsx:8047`).
2. Route: beta gate → `modelForAction(type)` → `buildPrompt(...)` →
   `client.messages.stream(...)` → NDJSON text chunks back to client →
   final cost report logged to console + `usage_log`.
3. Client concatenates chunks, extracts strict-JSON payload, writes the
   result into the active layer draft via `lib/story.ts` helpers;
   debounced autosave persists to Supabase.

Multi-step flows (`easyMode`, `syncLayers`, TV import, `scriptLoop`)
chain this same endpoint sequentially, feeding each step's output into
the next step's `story`.

## 3. Where prompts live

- **System prompt:** `SYSTEM_BRAIN` in `lib/prompt.ts:4` — one fixed
  46-line block for every action and every format.
- **Per-action asks:** `buildAsk()` switch in `lib/contextBuilder.ts`
  (~line 481 onward) + dedicated builders (`syncPrompt_toScript` etc.).
  The six short-creative concept asks are at
  `lib/contextBuilder.ts:713–757`.
- **Story bible:** `storyBible()` in `lib/contextBuilder.ts` — project
  snapshot injected as its own cached block.
- **Taste blocks:** `renderProfileForPrompt` (writer profile) and
  `renderStyleProfileForPrompt` (locked Style Lab profile, gated to a
  `STYLE_PROFILE_ACTIONS` set).
- **Image prompts:** `lib/thumbnailPrompt.ts` + inline builders in the
  `generate-*-image` routes (out of scope, untouched).

## 4. Where model/API calls happen

Anthropic (3 sites): `app/api/generate/route.ts:18`,
`app/api/convert-notes/route.ts:18` (dev-only notes→prompts helper),
`lib/thumbnailPrompt.ts:111` (Haiku call that writes the cover-image
prompt). OpenAI images: `app/api/generate-{character,scene,episode}-image`
+ `generate-thumbnail` via `lib/imageGenWithFallback.ts`. OpenAI TTS:
`app/api/tts`.

⚠️ Both Anthropic routes construct the SDK client at **module scope**
(`new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`). The SDK
throws at construction when the key is absent — so the route 500s even
for requests that would never call the API. This blocks zero-secret
local testing and is fixed on this branch (lazy init).

## 5. Where creative state lives

All in the `Story` JSON (`lib/story.ts`): `conceptDrafts[]`
(logline/summary/tone/themes + `settings`), `charactersDrafts[]`,
`storyDrafts[]` (beats/ingredients/snippets/direction),
`scriptDrafts[]`, `episodesDrafts[]` (TV canonical),
`arcsDrafts[]`. `projectDrafts[]` holds the active layer-draft pointer
combination (`getActiveProjectDraft`, `lib/story.ts:1269`). Persisted
as one JSONB row per project; `usage_log` and `writer_profiles` are
the other engine-relevant tables.

## 6. How selected references are represented

- `settings.references: { id, title, aspects[] }[]` — "make it similar
  to X" titles, each tagged with craft aspects to borrow (pacing,
  humor…). `settings.writerStyles: string[]` — writer voices.
  Plus `vibe` (free text), dials (`unpredictability`/`darkness`/`pace`
  1–10), `endingTypes`, and per-picker free-text notes
  (`toneNote`/`themesNote`/`frameworkNote`/`endingNote`).
- Rendering today: **one line each in the story bible**
  (`lib/contextBuilder.ts:253`) for all actions; **restated with
  recency weight only in script sync** (`syncPrompt_toScript`,
  `lib/contextBuilder.ts:1735–1740`, comment: "restated here so they
  actually shape the prose").
- **Gap:** the six concept asks (logline/title/summary/tone/themes/
  tagline) never restate references, writer voices, vibe, dials, or
  notes — the model sees them only as distant bible lines and
  reliably underweights them. This is the reference-faithfulness gap
  the handoff describes.

## 7. How output quality is controlled today

- Project dials: `unpredictability`/`darkness`/`pace` (Concept tab) —
  interpreted in `SYSTEM_BRAIN`'s "How to use settings," but no ask
  references them explicitly.
- Free-text notes per picker + story-layer `direction` field.
- **Writer Profile** (`lib/writerProfile.ts`) — passive, per-user,
  cumulative: categorical signals (genres/tones/themes clicked), prose
  metrics (dialogue density, sentence length…), exemplars. Ships with
  every request; injected when meaningful.
- **Style Lab** (`lib/styleProfile.ts` + `app/admin/style-lab`) —
  active preference elicitation (admin-gated): 6 taste axes (darkly
  funny / gritty / vulgar / unpredictable / witty / cliffhanger),
  pick-3-of-15 rounds across output forms, locked profile (rubric +
  axis targets + exemplars) injected into `STYLE_PROFILE_ACTIONS`
  (script prose + concept prose). Schema already supports
  `scope: "global" | { projectId }` — per-project overrides have a
  data model but no UI yet.
- Model routing as a quality tier (Opus = screenplay prose only).

## 8. Existing cost controls

3-tier `modelForAction` routing (Opus ~5× Sonnet ~4× Haiku); prompt
caching (brain/profile/bible as separate `cache_control` blocks —
repeat calls bill cached input at ~10%); output caps in the route
(32K script-heavy / 8K sync JSON-prefill / 4K default); TV-import
admin **test mode** (1-of-each, skips concept, ~cents per smoke test);
`usage_log` cost telemetry + `/admin/usage` dashboard; live `PRICING`
table for per-call cost reports.

## 9. Existing image-generation controls

Auto image gen is **default OFF** (`loadAutoImageGenPref`,
`lib/prefs.ts:328` — unset localStorage ⇒ `false`). DALL·E 3 is the
server default; `gpt-image-2` only when the client explicitly sends it
("Premium Image Quality" toggle). `imageGenAttempted` stamps prevent
refresh double-spend; the flag clears only on transient failures.
Buck Mark projects use a pinned static cover ($0). **This branch does
not touch any image code.**

## 10. Current testing strategy

`npx next build` (full type-check) is the only automated gate. No unit
tests, no prompt regression tests, no fixtures, no dry-run mode — every
prompt iteration to date has been validated by spending live tokens.
Admin test mode (TV import) is the one cost-safe harness.

## 11. Top 10 quality risks

1. The six concept asks are 3–6 thin lines with no craft depth →
   generic loglines/titles/taglines (the most user-visible outputs).
2. `SYSTEM_BRAIN` is ~54% TV-only rules (series types + momentum),
   sent on every feature/short call — dilutes focus; and the brain
   still introduces itself as "ScriptWriter" (name drift).
3. References/writer voices restated only in script sync; concept and
   beat generations rely on one distant bible line each.
4. Fresh projects carry near-zero signal (title + genre) — no prompt
   can conjure specificity from two words; the UX never nudges the
   user to seed a premise first.
5. No prompt regression harness — any `contextBuilder` edit silently
   changes every generation with no diffable artifact.
6. Haiku ceiling on all concept fields (routing choice, not a bug).
7. Style profile steers only when locked; per-project scope has no UI.
8. `extractJson` truncation-recovery can silently accept a cut-off
   array as valid (lost tail).
9. Dials are defined in the brain but never echoed in asks — weak
   coupling between user settings and actual instructions.
10. No evaluation rubric — quality judgments are unstructured.

## 12. Top 10 cost/API risks

1. No dry-run mode — prompt iteration burns live tokens (fixed here).
2. Module-scope Anthropic client blocks zero-secret local testing
   (fixed here).
3. `scriptLoop` = one Opus call per unwritten beat, sequential
   (`lib/scriptLoop.ts:132`); a 22-beat feature ≈ $3–6 per full run,
   with no cost preview before starting.
4. `easyMode` chains 3 syncs + the full script loop from one tap —
   the largest single-tap spend in the app, no estimate shown.
5. No server-side kill switch to refuse live AI calls in an
   emergency (fixed here: `UNFOLD_AI_LIVE=false`).
6. 32K output cap on script-heavy Opus actions bounds worst-case at
   ~$2.40/call — bounded, but worth knowing.
7. Prompt-cache TTL (~5 min) means idle-gapped sessions re-pay cache
   writes; inherent to the pricing model.
8. TV import chains 5 calls (4 Sonnet + 1 Opus); mid-chain failure
   wastes prior spend (test mode mitigates).
9. Image cost controls are client-pref + per-route; no single
   env-level image kill switch (documented, not changed — image code
   untouched per handoff).
10. `usage_log` inserts fail silently (by design, never throws) — a
    schema mismatch could create cost-visibility gaps.

## 13. Top 5 highest-leverage improvements

1. **Dry-run prompt preview + fixtures + snapshot script** — makes all
   current and future engine iteration $0; prerequisite for everything.
2. **Expert-grade concept asks + an influences block** — directly
   attacks generic output and reference underweighting at the exact
   point of maximum user visibility; zero architectural change.
3. **Format-aware brain** — feature/short calls drop ~25 irrelevant TV
   lines; TV calls unchanged; fixes name drift.
4. (Deferred) Sonnet routing flag for logline/summary; per-project
   engine-profile UI on the existing `scope` schema.
5. (Deferred) Reference weights (must-follow / strong / inspiration-
   only) on `settings.references`.

## 14. Smallest safe implementation plan (this branch)

1. **Commit 1 (docs only):** this audit + goal file.
2. **Commit 2 (cost-safe testing):** `dryRun` flag on `/api/generate`
   returning `{ model, system blocks, userMessage, token/cost
   estimate }` with zero Anthropic contact; lazy-init the Anthropic
   client; `UNFOLD_AI_LIVE=false` env guard; 3 fixture stories +
   `scripts/engine-preview.sh`; capture BEFORE prompt snapshots.
3. **Commit 3 (quality):** `systemBrainFor(projectType)` (CORE + TV
   module, TV text moved verbatim; identity renamed to Unfold);
   `influencesBlock(story)` helper; rewrite the six concept asks to
   expert craft level — **strict-JSON keys preserved exactly**
   (`title`/`logline`/`summary`/`tone`/`themes`/`tagline`/`ending`,
   parsed at `components/Studio.tsx:8083–8123`); capture AFTER
   snapshots.
4. **Commit 4 (docs):** implementation notes, test plan, comparison
   (real before/after diffs), cost safety, next steps. Push branch.

Build must pass at every commit. No live API call at any point.

## 15. Files expected to change

- `app/api/generate/route.ts` (dry-run + lazy client + env guard)
- `lib/prompt.ts` (brain split; export back-compat preserved)
- `lib/contextBuilder.ts` (brain selection, influences block, 6 asks)
- New: `fixtures/engine/*.json`, `scripts/engine-preview.sh`,
  `fixtures/engine/snapshots/{before,after}/*`, 7 `FABLE_ENGINE_*.md`
- Untouched: all UI components, image routes, `syncLayer`, `easyMode`,
  `scriptLoop`, `storage`, Style Lab, model routing, DB schema.

## 16. Rollback plan

`main` is untouched and tagged. Options, safest first:
- Ignore the branch entirely — prod continues from `main`.
- `git diff pre-fable-engine-backup..fable-engine-quality-tuning` to
  review; cherry-pick individual checkpoint commits onto `main`.
- Discard everything:
  `git checkout main && git branch -D fable-engine-quality-tuning`.
- The tag itself: `git tag -d pre-fable-engine-backup` when done.
Deploys: none performed from this branch, so production cannot have
regressed regardless.

## 17. Intentionally NOT changed

- Any main-app UI surface (handoff constraint).
- Image-generation routes, prefs, or defaults (already default-off).
- `modelForAction` routing (Sonnet-for-concept is a flagged next step,
  not a silent change).
- The TV brain content itself — moved verbatim, not rewritten.
- `syncLayer` / `easyMode` / `scriptLoop` orchestration and loop
  behavior (cost previews for them are designed in NEXT_STEPS).
- `extractJson` leniency (risky to tighten without fixtures in place —
  now that fixtures exist, a next-step candidate).
- Uncommitted working-tree items preserved untouched:
  `tsconfig.tsbuildinfo` (build cache) and
  `public/icon-button-upload.svg` (⚠️ referenced by `Studio.tsx` but
  never git-added — reached prod only via Vercel working-dir upload;
  flagged for the user to commit on `main`, deliberately not smuggled
  into this engine branch).
