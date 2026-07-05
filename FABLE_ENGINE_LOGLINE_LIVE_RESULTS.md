# FABLE_ENGINE_LOGLINE_LIVE_RESULTS

Live-call log for Phase 3 (protocol: `FABLE_ENGINE_PHASE_3_LIVE_TUNING.md`).
Rubric: v3 (`FABLE_ENGINE_LOGLINE_TEST_PLAN.md`). All calls ran the
**v3 prompt** through the local dev server against committed fixtures.
Costs are ACTUAL, from the route's usage-report event.

**Round 1 verdict: 2/3 PASS → stop condition met. 3 calls total,
$0.0077 spent (budget $1.00). Prompt NOT changed afterward — v4
direction documented below and in PHASE_3_COMPARISON, deliberately
deferred per the stop rule.**

---

## Call 1

- **Timestamp:** 2026-07-05 19:35:40 EDT
- **Fixture:** backseat-roadtrip (regression shape)
- **Model:** claude-haiku-4-5 · **Cost:** $0.002441 (2,031 in / 82 out) · 1.5s
- **Prompt version:** v3
- **Output:**
  > "A serial liar fleeing Ohio books a four-day rideshare with a
  > driver running unlicensed, a widow smuggling her ex-husband's
  > ashes, and a drifter whose destination keeps changing — and by
  > Nebraska, the stories she told each of them start colliding into
  > the truth."
- **Score:** 12/14 — 1: 2 · 2: 2 · 3: 2 · **4 (gate): 1** · 5: 1 · 6: 2 · 7: 2
- **Pass/fail: PASS** (no gate fail, ≥10)
- **Failure pattern (residual wart):** final clause is an external
  event (good — not insight, not menu) but lands on "the truth", a
  word from the banned abstract list, and the collision is an event
  that happens TO her rather than an act she takes. Passable; not the
  full target shape.

## Call 2

- **Timestamp:** 2026-07-05 19:36:09 EDT
- **Fixture:** quiet-drama (abstraction-danger case)
- **Model:** claude-haiku-4-5 · **Cost:** $0.002374 (1,954 in / 84 out) · 1.6s
- **Prompt version:** v3
- **Output:**
  > "A man who spent twenty years running his father's hardware store
  > must inventory it before Monday's sale, but each item his brother
  > finds—a repair ledger, a shoebox of keys, a layaway card—rewrites
  > what his father was worth, and Frank has to decide whether to list
  > them or let them disappear."
- **Score:** 13/14 — 1: 1 · 2: 2 · 3: 2 · **4 (gate): 2** · 5: 2 · 6: 2 · 7: 2
- **Pass/fail: PASS** — the strongest result. "Decide whether to list
  them or let them disappear" is the target shape: a single filmable
  act (pen over the ledger line), the premise's own machinery, cost
  visible inside it. On the fixture designed to tempt abstraction.
- **Notes:** protagonist slot is the weak point ("A man who…" — history
  instead of contradiction; the fixture's "counts everything, values
  almost nothing" went unused). Minor: "Frank" introduced after
  "a man who…".

## Call 3

- **Timestamp:** 2026-07-05 19:36:39 EDT
- **Fixture:** developed-feature (genre / external stakes)
- **Model:** claude-haiku-4-5 · **Cost:** $0.002839 (2,434 in / 81 out) · 1.4s
- **Prompt version:** v3
- **Output:**
  > "A washed-up rodeo fixer agrees to babysit his creditor's daughter
  > for one weekend while the creditor dismantles her father's
  > business — but the sixteen-year-old figures out the con by Friday
  > and forces Ray to choose between clearing his debt and burning it
  > to the ground."
- **Score:** FAIL (gate) — 1: 2 · 2: 2 · 3: 2 · **4 (gate): 0** · 5: 1 · 6: 1 · 7: 2
- **Pass/fail: FAIL** — "forces Ray to **choose between** clearing his
  debt and burning it to the ground" is the banned menu shape (b),
  verbatim construction.
- **Failure pattern (diagnosed):** *bible-priming beats ask-banning.*
  This fixture's own content frames the story as a menu — the summary
  ends "…choose which debt he can live with" and beat 5 is titled
  "Which Debt." The model resolved the conflict between the project's
  own framing and the ask's ban in favor of the project (which the
  prompt elsewhere tells it to stay faithful to). The two clean-input
  fixtures didn't trigger the shape. Bonus finding: relationship
  garble ("his creditor's daughter" — she's the target's daughter),
  a fidelity miss the craft rubric doesn't currently score.
- **Prompt changed afterward:** NO — stop condition already met (2/3).
  v4 direction recorded in `FABLE_ENGINE_PHASE_3_COMPARISON.md`.

---

## Totals

| | |
|---|---|
| Live calls | **3** (of 8 allowed) |
| Actual spend | **$0.007654** (of $1.00) |
| Passes | 2/3, including the hardest (abstraction-danger) case |
| Models | Haiku only — it IS giving useful signal; no escalation warranted |
| Prompt revisions after live data | 0 (deferred v4 documented) |
