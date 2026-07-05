# FABLE_ENGINE_IMPLEMENTATION_NOTES

Branch: `fable-engine-quality-tuning` (from `main` @ `d582ec0`,
tagged `pre-fable-engine-backup`). This file doubles as the progress
log for the simulated goal workflow (see `FABLE_ENGINE_GOAL.md`).

## Checkpoint commits (cherry-pickable independently)

1. **Audit** — `FABLE_ENGINE_AUDIT.md` + `FABLE_ENGINE_GOAL.md`. Docs only.
2. **Cost-safe testing** — dry-run mode, lazy Anthropic client, live-call
   kill switch, fixtures, snapshot script, BEFORE snapshots.
3. **Quality** — format-aware brain, influences block, six expert
   concept asks, AFTER snapshots.
4. **Docs** — this file + test plan + comparison + cost safety + next steps.

## What changed, file by file

### `app/api/generate/route.ts` (checkpoint 2)
- `dryRun: true` in the POST body returns `{ model, maxTokens,
  jsonPrefill, system[] (per-block text + cache flag + token est),
  userMessage, estimate }` — and never contacts Anthropic.
- The Anthropic client is now lazily constructed (`getClient()`).
  Before: module-scope `new Anthropic(...)` threw at import when the
  key was absent, crashing every request including previews. After:
  key-less environments can dry-run; live calls without a key get a
  clear 503.
- `UNFOLD_AI_LIVE=false` refuses live generation with a 503 while
  dry-run keeps working. Unset (default everywhere) = no behavior
  change.
- **Live-path behavior is byte-identical** when `dryRun` is absent and
  the flag is unset: same routing, caps, prefill, streaming, logging.

### `lib/prompt.ts` (checkpoint 3)
- `SYSTEM_BRAIN` split into `BRAIN_CORE` + `BRAIN_TV` (TV text moved
  verbatim). New export `systemBrainFor(projectType)`: TV projects →
  CORE+TV (unchanged content), features/shorts → CORE only.
- Identity line: "You are ScriptWriter" → "You are Unfold" (name-drift
  fix; `CLAUDE.md` says prefer Unfold).
- `SYSTEM_BRAIN` still exported (full text) for back-compat.

### `lib/contextBuilder.ts` (checkpoint 3)
- `buildPrompt` block 1 now uses `systemBrainFor(story.projectType)`.
- New `influencesBlock(story)`: references (with per-title aspects),
  writer voices, vibe, tone/theme notes, and deliberately-moved dials
  (value ≠ 5) rendered as a recency-weighted block. Returns `""` when
  nothing is set. Mirrors the precedent in `syncPrompt_toScript`,
  which already restates voice targets "so they actually shape the
  prose."
- The six short-creative asks (`generate_concept_title` / `_logline` /
  `_summary` / `_tagline` / `_tone` / `_themes`) rewritten to
  craft-dense prompts with explicit anti-cliché kill lists, each
  ending with `influencesBlock(story)` + the **unchanged** STRICT JSON
  contract. `generate_concept_ending` untouched (it's a selector).

### New files
- `fixtures/engine/{fresh-feature,developed-feature,tv-ongoing}.json`
  — hand-built layered-draft `Story` fixtures.
- `scripts/engine-preview.mjs` — zero-dependency Node script; POSTs
  the fixture×action matrix to the dry-run endpoint and writes
  `.json` + readable `.txt` snapshots.
- `fixtures/engine/snapshots/{before,after}/` — committed prompt
  snapshots bracketing checkpoint 3.
- The seven `FABLE_ENGINE_*.md` docs.

## Compatibility notes

- Client JSON contracts preserved exactly: `{ "title" }`,
  `{ "logline" }`, `{ "summary" }`, `{ "tone" }`, `{ "themes": [] }`,
  `{ "tagline" }` — parsing in `components/Studio.tsx` `generateConcept`
  is untouched.
- Cache impact: the brain block now has two variants (CORE vs
  CORE+TV). Any brain edit invalidates the prompt cache once anyway;
  steady-state caching behavior is identical.
- Zero UI changes. Zero image-path changes. Zero routing changes.
- Working-tree items deliberately left alone: `tsconfig.tsbuildinfo`
  (build cache), `public/icon-button-upload.svg` (pre-existing
  untracked asset — flagged in the audit for a separate commit on
  `main`).

## Deviation from the repo's standing deploy rule

`CLAUDE.md` says "deploy after every push." That rule exists so the
user can verify `main` on their phone. This branch was **pushed but
NOT deployed** — deploying experimental engine work to production
would violate the handoff's prime directive (protect the current
app). Deploy happens only after the user merges to `main`.
