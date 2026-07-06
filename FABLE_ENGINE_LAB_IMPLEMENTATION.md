# FABLE_ENGINE_LAB_IMPLEMENTATION

What was actually built on branch `fable-engine-lab`, and how to use
it. Design rationale: `FABLE_ENGINE_LAB_AUDIT.md` +
`FABLE_ENGINE_LAB_PRD.md`. Results: `FABLE_ENGINE_LAB_TEST_RESULTS.md`.

## The three data concepts

1. **Account taste profile** — `WriterProfile.tasteProfile`
   (`lib/engineLab.ts` `TasteProfile`): 9 curated principle chips +
   free-text customs + notes, versioned on every save. Rides the
   existing writer-profile persistence (Supabase `writer_profiles` +
   localStorage mirror) and the `profile` request param — the exact
   channel `styleProfile` already uses. Injected by `buildPrompt` as
   its own cached system block (`# ACCOUNT TASTE PROFILE (binding)`)
   ONLY when non-empty.
2. **Project guardrails** — `Story.guardrails`
   (`ProjectGuardrails`): 8 free-text fields (must-preserve, avoid,
   do-not-turn-into, tone, edge notes, sensitive handling, uniqueness,
   reference priorities) defined once in `GUARDRAIL_FIELDS` (single
   registry drives both the bible render and the editor UI). Rendered
   inside `storyBible()` as `## Project guardrails (BINDING…)` after
   Settings, ONLY when any field is non-empty. Persisted inside the
   project JSON; `lib/storage.ts` normalizers pass it through
   (`normalizeGuardrails` — drops junk shapes, trims, empty→undefined).
3. **Humor dial** — `StorySettings.humor?: 0–10`, the one new engine
   dial (register balance is logged issue P-B5). Renders a
   `- Humor: N/10` line in the bible ONLY when set. The other dials
   (vibe, unpredictability, darkness, pace) already existed — the Lab
   exposes rather than duplicates them.

**The invariant:** all three render conditionally. No taste, no
guardrails, no humor ⇒ byte-identical prompts (verified: all 19
pre-Lab snapshot rows unchanged).

## The Lab (`/engine-lab`)

Admin-gated page (`isAdmin` client redirect + the same check on its
API), five tabs:

- **Taste** — principle chips + custom principles + notes; live
  preview of the EXACT prompt block; saves to the writer profile
  (version bump each save).
- **Guardrails** — pick one of your projects (editable, saves through
  `saveProjectToDB`) or a fixture (read-only; fixtures are committed
  test assets, edited in git); live preview of the exact bible
  section.
- **Preview** — fixture/project × action → `/api/generate`
  `dryRun:true` → routed model, output cap, est input tokens/cost,
  every system block with cache badge, the user message, and an
  inclusion checklist (taste? guardrails? relationships FIXED FACTS?
  references? writer profile? style profile? humor dial?). Always $0;
  a DRY-RUN badge makes the mode unmistakable.
- **Runner** — same picker; **Dry-run ($0)** is the one-click path.
  LIVE requires: typing `LIVE` into the arm field AND headroom under
  the session cost cap (default $0.50; editable deliberately). Pre-
  flight: the runner dry-runs the exact request and refuses when
  `input cost + 25% × max-output cost` would cross the cap; actual
  spend accumulates from the route's usage report. Every run logs to
  localStorage (`ws:engine-lab:runs`, capped 200): mode, model, cost,
  tokens, output, taste version, guardrails on/off. Rubric scoring
  panel per surface (logline/beats/scene/script rubrics transcribed
  from the committed rubric docs — 0/1/2/n-a per criterion, gate
  detection, auto total) + PASS/FAIL + notes.
- **History** — the era manifest (`fixtures/engine/
  PROMPT_VERSIONS.json`: one entry per engine pass, before→engine-lab)
  + run log grouped by fixture×action (regression tracking) + a
  two-run side-by-side comparison (scores, notes, outputs) + run-log
  JSON export/import.

## Server pieces

- `app/api/engine-lab/fixtures/route.ts` — admin-gated (403
  otherwise) fixture list/read + era manifest. Fixture names are
  allowlist-validated (`^[a-z0-9-]+$`) — no path traversal.
  `next.config.js` gains `outputFileTracingIncludes` so the fixtures
  ship inside the Vercel function if this ever deploys.
- No other server change beyond the two injection conditionals in
  `lib/contextBuilder.ts`.

## CLI siblings (the program's standing tools, extended)

```bash
node scripts/engine-preview.mjs <outdir>    # $0 snapshots; matrix now
                                            # includes guardrails-twin +
                                            # taste-profile rows
node scripts/engine-lab-live.mjs <fixture> <action> [beatIndex] [--profile taste-profile]
                                            # ONE live call, logged, with
                                            # optional taste injection
```

New fixtures: `scaffolding-trap-guardrails.json` (Y2Kid + full
guardrails + humor 8/10), `taste-profile.json` (a WriterProfile
carrying only the taste profile — excluded from the Lab's story
picker).

## Integration honesty (PRD non-goal check)

The Lab invents no parallel engine. Preview and Runner call
`/api/generate` — the production endpoint — so what you inspect is
what generations send. Taste/guardrails read/write the real
WriterProfile and Story objects through the existing stores. Rubrics
are transcriptions of the committed rubric docs (which remain the
source of truth). The only new prompt text in the engine is the two
conditional blocks and one conditional dial line.

## Safety posture

- The Lab has no code path to any image/video/TTS route.
- Live calls: typed `LIVE` + cap headroom + logged; dry-run is the
  default everywhere; `UNFOLD_AI_LIVE=false` still kills live text
  generation globally.
- Writes are limited to: writer profile (taste), selected project's
  `guardrails` field, localStorage run log.

## Files changed / added

| File | What |
|---|---|
| `lib/engineLab.ts` | NEW — types, principle/field registries, renderers, normalizer, rubrics, run-log types |
| `lib/writerProfile.ts` | `tasteProfile?` on WriterProfile |
| `lib/story.ts` | `Story.guardrails?`, `StorySettings.humor?` |
| `lib/contextBuilder.ts` | taste system block; guardrails bible section; humor line (all conditional) |
| `lib/storage.ts` | guardrails pass-through (3 normalize shapes) + humor clamp |
| `app/engine-lab/page.tsx` | NEW — the Lab |
| `app/api/engine-lab/fixtures/route.ts` | NEW — gated fixture/manifest reads |
| `next.config.js` | fixture file tracing for Vercel |
| `fixtures/engine/PROMPT_VERSIONS.json` | NEW — era manifest |
| `fixtures/engine/scaffolding-trap-guardrails.json` | NEW — guardrails twin |
| `fixtures/engine/taste-profile.json` | NEW — CLI taste profile |
| `scripts/engine-preview.mjs` | per-row profile support + 3 matrix rows |
| `scripts/engine-lab-live.mjs` | NEW — one-shot live runner with `--profile` |
| `fixtures/engine/snapshots/engine-lab/` | NEW — baseline snapshot set |

NOT changed: `components/Studio.tsx`, `app/page.tsx`, any main-app
surface, model routing, `SYSTEM_BRAIN`, any image route.
