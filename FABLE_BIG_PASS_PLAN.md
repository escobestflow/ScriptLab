# FABLE_BIG_PASS_PLAN — the next high-leverage Fable task for Unfold

Strategy document. No code changed with this file; no deploy, no
merge, no live calls. Branch: `fable-big-pass-plan`.

---

## 1. What Phases 1–3 actually accomplished

**Phase 1 (infrastructure + first quality surface).** Dry-run mode on
`/api/generate` (prompt preview at $0), lazy Anthropic client (zero-
secret local testing), `UNFOLD_AI_LIVE` kill switch, fixture bank (3
stories), snapshot harness + committed baselines, format-aware brain
(features stopped carrying ~25 lines of TV rules; "ScriptWriter" →
Unfold), six concept asks upgraded from 3-line stubs to craft prompts,
`influencesBlock` (references/dials/notes restated with recency
weight). 38 files, $0 spent.

**Phase 2 (method upgrade).** The real deliverable wasn't the prompt —
it was the *method*: ban failure **classes** and mandate the positive
alternative (phrase lists just teach paraphrase); teach by
**contrastive example**; score with a **gated rubric** calibrated so
known-bad outputs fail; keep **regression fixtures** for every live
failure. Applied to one field (logline final clause).

**Phase 3 (closing the loop live).** A budgeted live-test protocol
(rounds of ≤3, hard caps, actual-cost logging, stop conditions) that
converted a real failure (menu endings) into a pass in one iteration:
4 Haiku calls, $0.0106, each output scored, each failure diagnosed to
a mechanism (bible-priming), the fix verified live.

**Net:** Unfold now has an engine-quality *practice*: $0 iteration,
evidence-based revision, honest scoring, cheap live gates. Deployed
through logline v4.

## 2. What they did NOT accomplish

- **The artifact users actually read is untouched.** Loglines are 40
  words; the product is *screenplays*. `generate_beats`,
  `generate_scene`, and the `sync_*_to_script` prompts have had zero
  passes of the Phase-2/3 method — and script prose runs on **Opus**,
  so its quality-per-dollar matters most.
- **No fidelity guarantees.** Two of four live outputs garbled a
  bible relationship ("his creditor's daughter"). Nothing in any
  prompt or rubric currently enforces factual consistency with the
  bible — a defect that compounds at scene/script scale.
- **No cross-surface evaluation system.** Fixtures cover 5 stories ×
  mostly 1 surface (logline). There is no beats rubric, no scene
  rubric, no script-cohesion rubric, no gauntlet across project types.
- **No cost preview on the expensive paths** (`scriptLoop` ≈ one Opus
  call per beat; `easyMode` chains it) — flagged in Phase 1, unbuilt.
- Reference *weighting* (must-follow vs inspiration-only), prompt/
  profile versioning, the user-facing taste configurator, and CI
  automation of snapshot diffs: all designed or partially plumbed,
  none built.

## 3. Are we using Fable to its full potential yet?

**No.** The work so far is disciplined micro-iteration — the right
way to *start*, and it built the rails. But each pass touched one
field with human-in-the-loop at every step. Fable's distinctive value
is **long-running, goal-directed campaigns**: hold a large scope in
one plan, inspect a whole subsystem, build the evaluation machinery,
iterate across many surfaces against explicit success criteria, and
self-check without a person driving every step. The logline work was
a proof of method. The full-potential version applies that method to
the entire creative pipeline in one campaign — which is precisely the
kind of task the transcript's framing (audit workflows, agentic
systems, large scoped goals from a strong plan) points at.

## 4. The biggest opportunities Fable is well-suited for here

(a) The **beats → scene → script chain** — many coupled prompt
surfaces, long outputs, subjective quality needing rubric discipline;
tedious for a human, ideal for a methodical agent. (b) **Evaluation
infrastructure** — fixture banks, rubrics, harnesses, regression
gates: pure leverage, all $0. (c) **Whole-repo audits** (code health,
cost/routing) — Fable-shaped but lower product value right now.
(d) **Agentic internal tools** (quality gauntlet runner) — force
multiplier for every future pass.

## 5–6. Ranked top 10 next improvements

| # | Improvement | Impact | Risk | Cost/API risk | Scope | UI? | Dry-run testable? | When |
|---|---|---|---|---|---|---|---|---|
| 1 | **Creative Quality Gauntlet + scene/script quality pass** (build the per-surface rubrics/fixtures/harness, then run the Phase-2/3 method over beats, scene, and story→script asks) | Very high — the product IS the script | Low-med (prompt-only; orchestrators untouched) | Budgeted live gates; Opus scenes ≈ $0.09/call | ~2–4 sessions | No | Yes — prompts 100%; outputs via budgeted gates | **Now** |
| 2 | Bible-fidelity enforcement (accuracy clause across prose asks + fidelity rubric criterion + fixture traps) | High — trust; compounds at script length | Low | ~$0.02 live to verify | Small; folds into #1 Phase B | No | Mostly | **Now, inside #1** |
| 3 | Cost preview + confirm on scriptLoop/easyMode (estimate before N-beat Opus runs) | High UX/cost hygiene | Low | $0 (reuses dry-run) | Small-med | Minimal (one confirm dialog) | Yes | Next |
| 4 | Reference weighting (must-follow / strong / light / inspiration-only) + context-selection audit | Med-high | Med (data model + normalize + prompts) | $0 build; small live to verify | Medium | Small (chip selector) | Yes | Next |
| 5 | Snapshot-diff regression in CI | Medium (protects everything) | Low | $0 | Small | No | Yes | Next |
| 6 | Prompt/profile versioning system (PROMPT_VERSION constants, per-output provenance in usage_log) | Medium | Low | $0 | Small-med | No | Yes | Later |
| 7 | Taste configurator surfacing (Style Lab → per-project voice UI, ungating path) | Med-high eventually | Med | Style-Lab rounds cost pennies | Medium | **Yes** — user deferred UI | Later |
| 8 | Full code review / bug audit (Studio.tsx monolith, extractJson strictness, dead code) | Medium | Low (read-mostly) | $0 | 1–2 sessions | No | Yes | Later |
| 9 | Cost & model-routing audit (Sonnet-for-concept flag experiment, cache-hit analysis from usage_log) | Medium | Low | Tiny flagged experiments | Small | No | Partly | Later |
| 10 | Story-to-script pipeline overhaul (orchestrator redesign, per-scene revision loops) | High ceiling | **High** — touches the money path and control flow | Highest live risk | Large | Maybe | Partly | Later — only after #1 defines what "good scene" means |

(Mobile/desktop UI recommendation audit: explicitly deferred per your
instruction — belongs after engine work; noted, unranked.)

## 7. The single best next big task

**#1 + #2 together: the Creative Quality Gauntlet — build Unfold's
evaluation system for the beats → scene → script chain, then run the
proven method across those prompts, with fidelity enforcement folded
in.**

## 8. Why this is the best use of Fable

- **It attacks the product's actual value.** Every phase so far
  sharpened the 40-word front door; this pass sharpens the thing
  people open Unfold to make. Script prose is Opus-priced — quality
  per dollar improves where dollars are largest.
- **It is Fable-shaped.** One campaign holding many coupled surfaces:
  taxonomy → rubrics → fixtures → harness → prompt passes → budgeted
  live gauntlet → regression protection. Long-running, self-
  evaluating, mostly $0, with explicit gates — micro-tweaks can't
  reach it, and a human doing it manually would take weeks.
- **Everything built so far feeds it.** Dry-run, fixtures, snapshot
  matrix, live-test script, rubric discipline, budget protocol — all
  reused, extended, not rebuilt.
- **It leaves permanent machinery**, not just better prompts: the
  gauntlet becomes the standing quality gate for every future engine
  change (including the later pipeline overhaul, #10, which is unsafe
  to attempt before "good scene" is defined and measurable).

## 9. Safe implementation plan

Branch `fable-quality-gauntlet` off `main`. Checkpoint commits per
phase; each independently revertable; `npx next build` green at every
checkpoint.

- **Phase A — Audit + machinery ($0).** Read the full beats/scene/
  script prompt surface (`generate_beats`, `generate_scene`,
  `rewrite_beat`, `sync_*_to_script`, TV episode/pilot asks). Write
  the failure-mode taxonomy (from existing snapshots, the Backseat/
  Laughing Man lineage, and PRINCIPLES.md's authentic-vs-formulaic
  framework). Write three gated rubrics: BEATS (structure/causality/
  momentum), SCENE (decision-or-revelation, subtext, voice
  distinctness, fidelity), SCRIPT-COHESION (cross-scene continuity,
  voice stability). Extend the fixture bank to ~8 (add: short film,
  TV episode with prior-episode canon, an ensemble piece — fidelity
  traps built in: named relationships that garble easily). Extend the
  harness to multi-surface capture.
- **Phase B — Prompt passes ($0).** Apply the method (failure classes
  + contrastive pairs + fidelity clause) to `generate_beats`,
  `generate_scene`, and the three `sync_*_to_script` asks. Snapshot
  before/after; adversarial self-review documented per surface.
- **Phase C — Live gauntlet (budgeted, gated).** Round structure per
  surface, cheapest first: beats on Haiku (≤6 calls ≈ $0.02), scenes
  on Opus (≤6 calls ≈ $0.55), one story→script run on the developed
  fixture (≈ $0.35, replaces ~22-scene full runs with a 5-beat
  fixture). Score everything against the rubrics; iterate a surface
  only on diagnosed failure (one revision + ≤3 retries, as in P3).
  Logline fixtures re-run once as regression (≈ $0.01).
- **Phase D — Docs + verdict.** Gauntlet results, comparison,
  remaining risks, merge recommendation. Stop.

## 10. Success criteria

1. Rubrics exist for beats/scene/script-cohesion, each calibrated on
   at least one known-weak example (a rubric that passes known-bad is
   rejected).
2. ≥8 fixtures spanning feature/short/TV, with fidelity traps.
3. Beats and scene outputs pass their rubrics on ≥2/3 of gauntlet
   fixtures; zero fidelity gate-failures un-diagnosed.
4. Logline regression suite still passes (no collateral damage).
5. All prompt changes visible as snapshot diffs; build green; every
   live call logged with actual cost.
6. The gauntlet is re-runnable by one command per layer
   (`engine-preview.mjs` extension + a `gauntlet-live` script with the
   same one-call-per-invocation discipline).

## 11. Cost limits

**Hard cap: $2.50 for the whole campaign** (expected ≈ $1.00–1.50).
Sub-caps: ≤$0.10 beats · ≤$0.80 scene rounds · ≤$0.50 script-sync ·
≤$0.05 regression · reserve for diagnosed retries. Haiku/Sonnet for
everything except the scene/script calls where Opus IS the production
route (testing the model that serves users). Stop immediately on any
anomaly; stop on meaningful progress, not budget exhaustion. No image
generation, no video, no unrelated actions.

## 12. Rollback strategy

Branch-only until approval (no deploy, no merge — same discipline as
P2/P3). Checkpoints revertable individually; full rollback =
`git checkout main && git branch -D fable-quality-gauntlet`. `main`
remains at `a5a38a7` throughout. Existing tags preserved.

## 13. Live tests allowed

Only within Phase C's gates and sub-caps above; every call through the
one-shot script pattern (no loops); every call logged (timestamp,
fixture, model, actual cost, output, score, verdict); user gets the
full log. Nothing live in Phases A/B/D.

## 14. What not to touch

Deploy/merge (until approval) · any UI surface · image/video routes ·
`syncLayer`/`easyMode`/`scriptLoop` **control flow** (prompt text they
send is in scope; orchestration is not) · model routing (except as a
documented flagged experiment, off by default) · Style Lab · storage/
DB schema · the two pre-existing working-tree items.

---

## The one recommended next action

**Approve the Creative Quality Gauntlet campaign as scoped above**
(reply "run the gauntlet" — Phases A and B proceed immediately at $0;
Phase C's live rounds start only inside the $2.50 cap and its gates,
with results logged like Phase 3). If you'd rather split the decision:
approve Phases A+B alone first — the machinery and prompt passes are
fully verifiable dry-run, and you can green-light Phase C after
reading the snapshots.
