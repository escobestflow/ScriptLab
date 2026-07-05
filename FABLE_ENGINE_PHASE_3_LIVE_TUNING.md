# FABLE_ENGINE_PHASE_3_LIVE_TUNING

Written BEFORE any edit, per instruction. Branch:
`fable-engine-phase3-logline` off `main` @ `ae6507d` (Phase 2).

## The new regression (Laughing Man, live, Phase-2 prompt)

> "…must keep performing to survive while the infection spreads beyond
> the theater, **forcing her to choose between her career and
> containing the outbreak**."

Phase 2 fixed insight endings and this output proves it (concrete
premise, outbreak consequence, real engine). The residual failure is
the **menu ending**: "choose between X and Y" — dramatically true but
cinematically empty. It names the axis of the choice instead of the
act the choice comes down to. This was predicted as a residual risk in
`FABLE_ENGINE_LOGLINE_TUNING_NOTES.md` ("choice-template monotony") —
Phase 2's rule said "end on a CHOICE" and the model took the cheapest
compliant form.

Target shape (user's example, adopted as in-prompt demonstration):
> "…until the only way to stop it is to **bomb the sold-out special
> that could finally make her famous**."

Concrete act · ironic cost inside the act · premise's own mechanism
("bomb" is comedy vocabulary) · filmable as a scene.

## Prompt v3 design (logline ask only)

1. **FINAL CLAUSE RULE v3** — the last clause must be a concrete ACT,
   COST, or COLLISION a camera could film as a scene. Two banned
   shapes, named:
   (a) *Insight endings* — "forces her to admit/realize/face…" (Phase-2
   ban, kept).
   (b) *Menu endings* — "must choose between X and Y." A choice may
   only appear as the single specific action it comes down to, cost
   visible inside the act.
2. **Second contrastive pair** teaching (b), built from the user's
   laugh-virus example (invented premise, safe to embed). The Phase-2
   wedding-band pair teaching (a) stays.
3. **Mechanism line:** "the strongest endings turn the premise's own
   machinery against the protagonist" — pushes toward story-world
   vocabulary (bomb the special / balance the ledger / the last state
   line).
4. Everything else in the ask unchanged; JSON contract unchanged; no
   other action touched.

## Rubric gate v3 (applied to all Phase-3 scoring)

Criterion 4 now scores: **2** = concrete act/image with ironic cost,
premise-specific · **1** = concrete act but generic (could end three
other movies) · **0 = GATE FAIL** = insight ending OR menu ending
("choose between X and Y" and equivalents). Other criteria unchanged.
`FABLE_ENGINE_LOGLINE_TEST_PLAN.md` gate line updated to match.

## Live protocol (per instruction, hard limits)

- Budget: **$1.00 absolute; expect ≈$0.01–0.02 total.** Model: Haiku
  (the production route for this action — signal must come from the
  model that will serve users; escalate to Sonnet only with a stated
  reason, none anticipated).
- Round 1: **3 calls max** — one logline per fixture:
  `backseat-roadtrip`, `quiet-drama`, `developed-feature`. (Fixtures,
  not real projects: deterministic, committed, no user-data writes.
  No comedian-premise fixture — the laugh-virus example now lives
  INSIDE the prompt; testing on it would contaminate the signal.)
- Score each against rubric v3. **≥2/3 pass → stop.**
- Else: diagnose, ONE dry-run revision (v4), round 2 of ≤3 calls.
- **Absolute max 8 calls.** Stop early once the pattern is clearly
  better. Stop immediately on any budget anomaly.
- Execution path: local dev server (prod must keep serving Phase 2 —
  no deploy). The server reads its own `.env.local`; the agent never
  reads or echoes the key. If the key is absent the route 503s cleanly
  → stop and report.
- Every call logged in `FABLE_ENGINE_LOGLINE_LIVE_RESULTS.md`
  (timestamp, fixture, model, ACTUAL cost from the route's usage
  report event, prompt version, full output, score, pass/fail,
  failure pattern, whether the prompt changed after).

## Stop conditions

≥2/3 pass in a round · 8 calls · $1.00 · or two consecutive rounds
failing the same way (⇒ the answer is model routing, not prompt
surgery — report, don't spend).

## Not in scope

Deploy · merge · any other ask · brain · routing · dials · UI · images.
