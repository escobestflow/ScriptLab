# FABLE_ENGINE_LAB_AUDIT

Phase A of the Engine Lab build (branch `fable-engine-lab`). What the
engine already has, where the Lab's concepts can live without inventing
a parallel system, and the safest shape for the build. Companion:
`FABLE_ENGINE_LAB_PRD.md` (what we're building and in what order).

## 1. Current engine surfaces (what already exists)

The program's core insight holds: **the engine is `lib/prompt.ts` +
`lib/contextBuilder.ts` + `/api/generate`**, and everything the Lab
needs to inspect already flows through them.

| Capability the Lab needs | What exists today | Gap |
|---|---|---|
| Prompt preview | `dryRun: true` on `/api/generate` returns every system block (with cache flags), user message, routed model, output cap, cost estimate — $0, never touches Anthropic (Phase 1) | No UI; CLI-only (`scripts/engine-preview.mjs`); no annotation of WHICH concepts (relationships, taste, guardrails, references) are present in the blocks |
| Model routing + pricing | `modelForAction` three-tier + live `PRICING` table in `prompt.ts` | Visible only in code |
| Cost logging | `/api/generate` streams a usage `report` event with model/tokens/cost | Not aggregated anywhere client-side; `/admin/usage` exists for API-level usage |
| Fixtures | 11 curated fixtures in `fixtures/engine/` incl. trap fixtures + the relationship twin | Server-only files; no UI listing |
| Snapshot regression | `scripts/engine-preview.mjs` writes per-surface prompt captures; committed baselines per era in `fixtures/engine/snapshots/` | CLI-only; era history implicit in dir names |
| Rubrics | 4 gated rubrics (logline v2, beats, scene, script-cohesion) in `FABLE_ENGINE_LOGLINE_TEST_PLAN.md` + `FABLE_GAUNTLET_RUBRICS.md` | Markdown-only; scoring happens in the human's head + gets transcribed into results docs |
| Live test discipline | `scripts/gauntlet-live.mjs` — ONE logged call per invocation, cost printed | CLI-only; no cap enforcement; no run history |
| Kill switches | `UNFOLD_AI_LIVE=false` env (text), auto-image-gen pref kill switch | Adequate — the Lab must simply never call image routes |
| Admin gating | `isAdmin` (`lib/adminEmails.ts`) checked against `x-user-email`; existing pattern in `/api/admin/*` routes + `/admin/usage`, `/admin/style-lab` pages | Reusable as-is |

## 2. Where taste and guardrails can live (no parallel system)

**Account-level taste → `WriterProfile.tasteProfile`.** The
WriterProfile already: persists per-user (Supabase `writer_profiles` +
localStorage mirror, debounced upsert in `writerProfileStore.ts`),
ships to the server in the same `profile` request param every prompt
already reads, and has precedent for a nested authored artifact —
`styleProfile` from the Style Lab rides exactly this way. Adding an
optional `tasteProfile` field is schema-version-safe (optional field,
`PROFILE_SCHEMA_VERSION` stays 1; old blobs still validate).
Injection: a new dedicated system block in `buildPrompt` when
non-empty — same conditional pattern as the profile/style blocks, so
**absent taste = byte-identical prompts** (fixtures pass
`profile: null`; all committed snapshots stay stable).

**Project-level guardrails → `Story.guardrails`** (top-level, not
per-draft — guardrails are project identity, like `title`; they must
survive draft forking/switching). Rendered inside `storyBible()` as a
new section when any field is non-empty; absent = byte-identical
bible. Persistence is free (the whole `Story` JSON round-trips through
`lib/storage.ts`); the normalizer must pass the field through.

**Engine dials — mostly already exist.** `StorySettings` already
carries `vibe` (free text), `unpredictability`/10, `darkness`/10,
`pace`/10 — all rendered into every bible today. The gauntlet's craft
contracts already encode anti-generic and anti-sanitization pressure
as binding rules (not dials). So the Lab should EXPOSE the existing
four, and add at most ONE new optional dial: `humor?: 0–10` — chosen
because register balance is a real logged issue (P-B5: horror-comedy's
comedy register came out thin), and an optional field renders only
when set (snapshot-safe). Everything else on the wish list (dialogue
naturalism, structural strictness, rewrite aggressiveness, creativity,
specificity, anti-*) is either already a binding contract in the
prompts, already covered (Style Lab owns voice/dialogue), or premature
— documented as later candidates in the PRD, not built.

## 3. How to avoid bloating the main UI

Everything new is admin-gated and separate: an `/engine-lab` page
(pattern: `/admin/*` pages) plus small `/api/engine-lab/*` admin
routes. **Zero changes to any main-app screen.** Guardrails and taste
are edited in the Lab, not in Studio; the main app merely benefits at
generation time because the engine reads them. If/when guardrails
should surface to real users, that's a separately-approved UX task
(PRD "later").

## 4. Prompt-injection risk map (what must stay true)

1. **Snapshot stability:** every injection is conditional on data
   presence. Fixtures carry no taste/guardrails → all 19 existing
   snapshot rows must stay byte-identical. This is the merge gate.
2. **Token cost:** guardrail fields are short free-text (bounded by UI
   maxLength); the taste block is bounded (≤ ~10 principles + notes);
   both are stable text → prompt-cacheable within a session.
3. **Contract collisions:** taste/guardrails must not FIGHT the
   existing craft contracts (`EDGE_PRESERVATION_RULES`,
   `BIBLE_FIDELITY_RULES`). The taste block therefore *reinforces*
   (same vocabulary: "sanitization", "FIXED FACTS") rather than
   restating differently; guardrails render as bible facts, and the
   bible-fidelity rules already declare bible content binding.

## 5. Safest implementation plan (summary — detail in PRD)

Order of construction, each step independently verifiable at $0:
1. Data layer: `lib/engineLab.ts` types + renderers; `WriterProfile.
   tasteProfile`; `Story.guardrails`; `StorySettings.humor`;
   `storage.ts` normalize pass-through; `buildPrompt`/`storyBible`
   conditional injection.
2. Snapshot proof: run `engine-preview.mjs`, diff — existing rows
   byte-identical; add new matrix rows exercising a guardrails twin
   fixture so the new surface is captured forever.
3. Lab page `/engine-lab` (admin-gated): taste editor, guardrails
   editor (per project), prompt preview with annotations, test runner
   (dry-run default, explicit live confirm + cap), run log +
   comparison, version history.
4. Live validation: ≤4 logged calls, ≪ $3.

## 6. Exact files expected to change

| File | Change |
|---|---|
| `lib/engineLab.ts` | **NEW** — TasteProfile/ProjectGuardrails types, render functions, run-log types, version manifest loader |
| `lib/writerProfile.ts` | `tasteProfile?` field on WriterProfile |
| `lib/contextBuilder.ts` | taste system block in `buildPrompt`; guardrails section in `storyBible()` ; humor dial line (conditional) |
| `lib/story.ts` | `Story.guardrails?`, `StorySettings.humor?` |
| `lib/storage.ts` | normalize pass-through for `guardrails` |
| `app/engine-lab/page.tsx` | **NEW** — the Lab UI |
| `app/api/engine-lab/fixtures/route.ts` | **NEW** — admin-gated fixture list/read |
| `fixtures/engine/PROMPT_VERSIONS.json` | **NEW** — era manifest (version history) |
| `fixtures/engine/scaffolding-trap-guardrails.json` | **NEW** — twin fixture with guardrails + humor dial |
| `scripts/engine-preview.mjs` | new matrix rows |
| `scripts/engine-lab-live.mjs` | **NEW** — one-shot live runner accepting a profile file (taste testing from CLI) |
| `FABLE_ENGINE_LAB_*.md` | docs |

NOT changed: `components/Studio.tsx`, `app/page.tsx`, any main-app
component, any image route, model routing, `SYSTEM_BRAIN`.

## 7. Risk assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Prompt drift on existing surfaces | HIGH (quality regression) | Conditional injection + byte-identical snapshot gate before any live call |
| Accidental spend from the Lab | HIGH (real money) | Dry-run is the default and only one-click path; live requires typed `LIVE` confirm + per-session cap with hard client stop; every live call logged; image/video routes never called by the Lab |
| WriterProfile blob rejected by old clients | MED | Optional field, schema version unchanged — verified by the store's validation logic (checks `preferences` + version only) |
| Guardrails stripped by `normalizeStory` on load | MED | Explicit pass-through + test (save→load round trip via normalize) |
| Story JSON saved by Lab code, opened by prod code before merge | LOW | Old normalizers that strip unknown fields would drop guardrails — acceptable branch-window risk; noted for merge timing |
| Taste block fights craft contracts | MED | Shared vocabulary; live calibration check on the trap fixture (Ms. Vann must survive WITH taste block active) |
| localStorage run-log loss | LOW | Export/import JSON buttons; the durable record remains the FABLE_*.md docs + committed snapshots |

## 8. Test plan

$0 layer (all must pass before any live call):
- `npx next build` (type gate).
- `engine-preview.mjs` → diff vs `relationship-coverage` baseline: all
  19 existing rows byte-identical.
- New rows (guardrails twin × logline/beats/scene) show guardrails +
  humor dial + taste block (via profile file) rendering correctly.
- Normalize round-trip: story with guardrails survives
  `normalizeStory` (script check).
- Lab page loads for admin, 403/redirect for non-admin; preview and
  runner work end-to-end in dry-run against fixtures.

Live layer (≤ $3 cap, aim ≪ $1, every call logged):
- 1× logline on guardrails twin (Haiku ~$0.003) — guardrail adherence
  + logline rubric.
- 1× beats on guardrails twin (Haiku ~$0.01) — humor dial audible?
  beats rubric; register-balance check (P-B5 interest).
- Optional 1× scene (Opus ~$0.10) only if beats suggest the dial needs
  scene-level verification.
- 1× taste-block calibration: `sync_concept_to_characters` on
  scaffolding-trap WITH tasteProfile active (Haiku ~$0.01) — Ms. Vann
  edge preserved, no fight with EDGE_PRESERVATION_RULES.

## 9. Rollback plan

- Whole build: `git revert` the branch's commit range on main (if ever
  merged); no DB migration exists to unwind.
- Data written meanwhile: `tasteProfile` in writer_profiles and
  `guardrails` in project JSON are optional fields old code ignores
  (normalizer pass-through means at worst they're dropped on next save
  by old code) — no corruption mode identified.
- Partial rollback: the injection points are two small conditionals —
  reverting `lib/contextBuilder.ts` alone silences the whole feature
  while leaving data + UI intact.

## 10. Build now vs later

**Now (MVP slice):** everything in §6.
**Later (documented in PRD §7, deliberately not built):** AI-judge
rubric scoring (NEXT_STEPS #9 — becomes attractive the moment the Lab
makes runs cheap to trigger); Supabase table for run history; guardrail
editing in the main app; per-action dial overrides; more dials
(dialogue naturalism, rewrite aggressiveness…); prompt A/B tournaments;
Style-Lab × gauntlet composition run (NEXT_STEPS #10); snapshot-dir
diff viewer in the Lab (CLI `diff -r` stays the tool).
