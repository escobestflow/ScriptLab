# FABLE_SESSION_HANDOFF

Read this first in a fresh session. It replaces the prior
conversation. Deep detail lives in the `FABLE_*.md` docs referenced
throughout; `CLAUDE.md` carries the repo's standing rules (notably:
after `git push` on main, run `npx vercel --prod --yes` in the same
turn; never force-push; secrets never local).

## 1–3. Where things are

- **Production:** `main`, deployed via Vercel to
  https://script-lab-beta.vercel.app. Production commit = the commit
  containing this file (taste-alignment content baseline `495a4b8`;
  verify with `git log --oneline -3`).
- **Active branch:** `main` (all program branches merged except one).
- **Program branches (chronological):** `fable-engine-quality-tuning`
  → `fable-engine-phase2-logline` → `fable-engine-phase3-logline` →
  `fable-big-pass-plan` (plan doc, **branch-only, unmerged**) →
  `fable-quality-gauntlet` → `fable-logline-v5` →
  `fable-taste-alignment`. Backup tag `pre-fable-engine-backup` =
  pre-program main (`d582ec0`).

## 4–8. What each pass accomplished

- **Phase 1** (`FABLE_ENGINE_AUDIT.md`): the $0 iteration
  infrastructure — `dryRun: true` on `/api/generate` (full prompt
  preview, zero Anthropic contact), lazy Anthropic client (key-less
  local testing), `UNFOLD_AI_LIVE=false` kill switch, fixtures +
  snapshot harness (`scripts/engine-preview.mjs`), format-aware brain
  (features/shorts stopped receiving TV-only rules; identity renamed
  ScriptWriter→Unfold), six concept asks upgraded to craft prompts,
  `influencesBlock` (references/dials/notes restated in concept asks).
- **Phase 2** (`FABLE_ENGINE_LOGLINE_TUNING_NOTES.md`): the METHOD —
  ban failure CLASSES and mandate the positive alternative; teach by
  weak/strong CONTRASTIVE PAIRS; score with GATED RUBRICS calibrated
  to fail known-bad outputs; keep a regression fixture per failure.
  Applied to the logline final clause (insight-ending ban).
- **Phase 3** (`FABLE_ENGINE_LOGLINE_LIVE_RESULTS.md`): budgeted live
  protocol (rounds ≤3, hard caps, actual-cost logging, stop rules);
  killed menu endings ("choose between X and Y") + bible-priming
  override clause. 4 calls, $0.0106.
- **Quality Gauntlet** (`FABLE_GAUNTLET_*.md`, 7 docs): the big pass
  on beats→scene→script. Found + fixed: `Character.relationships`
  stored but NEVER rendered into any prompt (the fidelity smoking gun
  — now rendered in bible + scene cast block as "Relationships (FIXED
  FACTS)"); shared `BIBLE_FIDELITY_RULES`; craft contracts (beats:
  causality/escalation/obvious-version-ban/final-beat/≤40-word
  summaries after a live truncation find; scene: purpose-as-contract,
  decision-or-revelation, subtext, swap-test voices, stock-gesture
  class ban; script: compounding + continuity + voice stability).
  3 gated rubrics, 5 trap fixtures. Live: beats 3/3, scenes 3/3
  (best-ever output: Cold Calls 16/16), script 1/1, logline
  regression clean. 11 calls, $0.6402. Evidence: Haiku suffices for
  beats when the prompt carries the craft — no routing change needed.
- **Logline v5** (in `FABLE_ENGINE_LOGLINE_LIVE_RESULTS.md` +
  TEST_PLAN Calibration 2): imported-scaffolding ban — the model had
  invented a 72-hour clock + get-back mission on a clockless premise
  (partly self-inflicted: v4 demanded "a clock or a container").
  Pressure re-scoped to "the force already in the project's
  material"; banned shape (c); third contrastive pair. 2/2 live pass.
- **Taste alignment** (`FABLE_TASTE_ALIGNMENT_*.md`, 3 docs):
  character gen had sanitized an intentionally uncomfortable teacher
  subplot into a safe peer romance. Cause: instruction vacuum (no
  prompt said discomfort was deliberate) on surfaces the Style Lab
  profile never reaches. Fix: brain premise-sovereignty principle +
  shared `EDGE_PRESERVATION_RULES` (dual gate: anti-sanitization AND
  hard lines — never eroticize minors, never romance-normalize
  adult/minor dynamics, tension via discomfort/boundaries/consequence,
  never consummation) injected into 6 content-creating asks; cast
  corollary (teacher stays a teacher; impossible dynamics are NOT
  "love_interest"). Live 2/2 pass, $0.026.

## 9–10. Merged/deployed vs branch-only

- **Merged + deployed (all on prod):** Phases 1–3, gauntlet, logline
  v5, taste alignment.
- **Branch-only:** `fable-big-pass-plan` (strategy doc
  `FABLE_BIG_PASS_PLAN.md` only — merge optional, content historical);
  `fable-engine-lab` (**the Engine Lab** — account taste profile +
  project guardrails + humor dial, all conditionally injected;
  /engine-lab admin page with prompt preview, capped test runner,
  rubric scoring, run log, era history; $0.031 live of a $3 cap; see
  `FABLE_ENGINE_LAB_*.md` ×6. **Awaiting user approval to merge +
  deploy.**)
- `fable-relationship-coverage` (F2) was merged + deployed 2026-07-06
  ($0.17 live; `FABLE_RELATIONSHIP_COVERAGE.md`).
- Uncommitted working-tree items, deliberately preserved untouched:
  `tsconfig.tsbuildinfo` (build cache churn),
  `public/icon-button-upload.svg` (referenced by Studio.tsx, reaches
  prod via Vercel working-dir upload, was never git-added — should be
  committed on main someday).

## 11. Rollback

- Latest pass only: `git revert --no-edit 754b742..main && git push
  origin main && npx vercel --prod --yes`
- Any earlier boundary: revert to the relevant range (`93a87a3` =
  pre-v5, `a5a38a7` = pre-gauntlet, `ae6507d` = pre-P3, `31d6059` =
  pre-P2, tag `pre-fable-engine-backup` = pre-program). Never
  force-push; never `reset --hard` on pushed main.

## 12. Known risks / open items

1. **F2 — empty relationships in real projects:** ✅ closed on
   `fable-relationship-coverage` (TV import emits them; derive action
   backfills; see `FABLE_RELATIONSHIP_COVERAGE.md`). Residual:
   `sync_concept_to_characters` still doesn't emit relationships at
   creation time.
2. Single-sample evidence per surface (each fixture×surface ran live
   once; variance uncharacterized).
3. Minor logged issues: markdown artifacts in Opus scene prose (F3),
   climax scenes exceed the 100–400w target (F4), horror-comedy's
   comedy register thinner than its toneNote (P-B5),
   developed-feature logline still borderline (binary source
   material + empty relationships).
4. **GitHub Pages is enabled on the repo and erroring on every push**
   (spam emails; stale Jekyll site live at
   escobestflow.github.io/ScriptLab). Fix awaiting user approval:
   `gh api -X DELETE repos/escobestflow/ScriptLab/pages` (account
   settings change — needs explicit user OK) or Settings → Pages →
   Disable.
5. Live-testing runs through the local dev server (`npm run dev`,
   reads its own `.env.local`; agent never touches keys). Prod tests
   only via `dryRun: true` probes ($0).

## 13. Next recommended task

~~Relationship data coverage~~ **DONE + deployed 2026-07-06.**
~~Engine Lab~~ **DONE + deployed 2026-07-06.**
~~Arcs quality pass~~ **BUILT 2026-07-06** on branch
`fable-arcs-quality` (off engine-lab main) — pending merge approval:
tv_import_arcs rewritten around an arc-mechanics contract + curve
grammar + moments schema (arcs now emit 1-3 filmable hard moments
each); relationship arcs from FIXED-FACTS dyads; overload triage note
in the episode digest; no-pre-emption rule in the season-arcs bible
render; 3 new TV fixtures + arc-populated downstream twin; 4 new docs
(`FABLE_ARCS_{AUDIT,RUBRIC,TEST_RESULTS,DOWNSTREAM_CHECK}.md`).
Live $0.384 of $2. Next after merge: `FABLE_ENGINE_LAB_NEXT_STEPS.md`
items (L-1 guardrail wording, AI-judge — now that arcs have a rubric
too), heat-budget enforcement if it bites in practice, F3/F4
cosmetics, cost preview on scriptLoop/easyMode, relationships in
`sync_concept_to_characters`.

## 14. User taste (binding, program-wide)

- Preserve edgy, unexpected, morally awkward, darkly comic material —
  it is deliberate. NEVER sanitize or substitute safer conventional
  versions (that failure mode is named "sanitization" in the prompts).
- Handle sensitive dynamics responsibly: wrongness stays on the page
  AS wrong — discomfort, boundaries that hold, social danger,
  consequences, dark comedy from impossibility.
- Hard lines that coexist with the edge: never eroticize minors or a
  minor's body; never frame adult/minor dynamics as
  aspirational/mutual/normal romance; tension without consummation.
- Broader taste (Style Lab `BASE_STYLE_DNA`): A24 grit, Breaking Bad
  pacing, Succession wit/vulgarity (varied, purposeful), Chappelle/
  Louie CK dark humor, misdirection over cliché, cliffhangers over
  tidy bows.

## 15. Current test project (and its fixture twin)

Time-slip comedy: a 35-year-old AI founder's consciousness returns to
his 14-year-old body in 1996. Future knowledge is mostly USELESS —
no sports/stocks/history, only rap (Tupac/Biggie track-listings),
movie twists, pop culture. Friends become his terrible "management
team"; every scheme fails because they're fourteen. The teacher-crush
subplot (adult mind, impossibly mature rapport with young teacher
Ms. Vann) MUST be preserved as ethically uncomfortable dark comedy —
never replaced with a peer romance, never romanticized. Fixture twin:
`fixtures/engine/scaffolding-trap.json` ("Y2Kid"); its live outputs
passed both taste gates (see FABLE_TASTE_ALIGNMENT_RESULTS.md).

## 16. Suggested opening prompt for the next session

> Read FABLE_SESSION_HANDOFF.md and CLAUDE.md first. Continue the
> Fable engine program with the next recommended task: relationship
> data coverage (FABLE_GAUNTLET_NEXT_STEPS.md #2). Work branch-only
> off main, no merge/deploy without my approval, no image/video
> generation, dry-run first, live spend under $1 using the existing
> one-shot scripts (scripts/gauntlet-live.mjs) against the local dev
> server. Extend tv_import_characters to emit relationships[], add a
> derive-relationships path for existing projects, verify with the
> gauntlet fixtures (relationship-trap must stay 14/14; Buck Mark's
> parentage wobble should die once its cast has structured
> relationships), and update the gauntlet docs. Then report and stop.

## How to run the standing verification tools

```bash
npm run dev                                   # terminal 1, no secrets needed
node scripts/engine-preview.mjs <outdir>      # $0 snapshots, diff vs committed sets
node scripts/gauntlet-live.mjs <fixture> <action> [beatIndex]   # ONE live call, logged
```
Committed snapshot baselines: `fixtures/engine/snapshots/{before,after,
phase2-*,phase3-*,gauntlet-*,logline-v5,taste-alignment}`.
