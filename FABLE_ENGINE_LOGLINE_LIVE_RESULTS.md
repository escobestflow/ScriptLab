# FABLE_ENGINE_LOGLINE_LIVE_RESULTS

## v5 micro-pass — imported-scaffolding ban (branch `fable-logline-v5`)

**Trigger:** live output on a real time-slip comedy invented a
"seventy-two hours" deadline and a "figures out how to get back"
mission — neither in the project. Root cause was partly the v4 ask
itself ("pressure with a clock or a container" taught the model to
install one). Scored as Calibration 2 in the test plan: gate fail.

**Change (logline ask only):** pressure re-scoped to "the force
already in the project's material… never install one it doesn't
have"; banned shape (c) Imported scaffolding (invented deadlines,
get-back-home, fix-the-timeline, save-the-world); third contrastive
pair (time-slip premise, scaffolding-weak vs own-pressure-strong).
Rubric gate updated to v5. New fixture: `scaffolding-trap` (Y2Kid —
the regression's shape, deliberately clockless and missionless).

### Call v5-1 — 2026-07-05 21:35:00 EDT
- **Fixture:** scaffolding-trap · **Model:** claude-haiku-4-5 ·
  **Cost:** $0.002864 · **Prompt:** v5
- **Output:** "A founder who built an empire on prediction wakes up as
  his fourteen-year-old self in 1996 with only useless future
  knowledge — track-listings and movie twists — and when his best
  friends believe him, they become his managers, launching schemes
  that require cars, fake IDs, and competence they don't possess."
- **Score: 14/14 PASS.** Zero imported scaffolding; the comic engine
  (prediction-empire founder who can't predict anything useful +
  friends-as-management) IS the logline; ending = the premise's own
  machinery with the cost inside it.

### Call v5-2 — 2026-07-05 21:35:23 EDT (regression)
- **Fixture:** backseat-roadtrip · **Model:** claude-haiku-4-5 ·
  **Cost:** $0.002642 · **Prompt:** v5
- **Output:** "A runaway seventeen-year-old books a cross-country
  rideshare with three strangers who each believe a different lie
  about who she is — and four days trapped in one sedan, the stories
  start colliding before anyone reaches Portland."
- **Score: ~13/14 PASS.** The four-days/sedan container KEPT — it's in
  the material, which is precisely the v5 distinction (real pressure
  stays; invented pressure banned). Minor elliptical-grammar note.
- **Prompt changed afterward:** NO — 2/2 pass, fix clear, stopped at
  2 of 3 allowed calls. **v5 spend: $0.005506.**

---


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

## Call 4 (v4 — user-approved bible-priming fix)

- **Timestamp:** 2026-07-05 19:45:51 EDT
- **Fixture:** developed-feature (the v3 gate-failure, retried)
- **Model:** claude-haiku-4-5 · **Cost:** $0.002910 (2,475 in / 87 out) · 1.6s
- **Prompt version:** v4 — v3 plus one clause appended to the
  menu-ending ban: "This holds EVEN WHEN the project's own summary or
  beats describe the story as a choice between two things — do not
  reproduce that framing; translate it into the concrete act it comes
  down to."
- **Output:**
  > "A washed-up rodeo fixer agrees to babysit his creditor's daughter
  > for one weekend to clear a forty-grand debt—but the kid figures
  > out he's there to help strip her father's business, and by Sunday
  > he has to decide whether to finish the job or burn the only man
  > who still trusts him."
- **Score:** 11/14 — 1: 2 · 2: 2 · 3: 2 · **4 (gate): 1** · 5: 1 · 6: 1 · 7: 2
- **Pass/fail: PASS** (no gate fail, ≥10). Per protocol ("if it
  passes, stop"), no further calls.
- **Honest read:** clearly better, not fully nailed. The v3 verbatim
  menu ("choose between clearing his debt and burning it to the
  ground" — two abstract outcomes) became act-shaped options with a
  clock ("by Sunday… finish the job or burn the only man who still
  trusts him"). Gate scores 1, not 2: the construction is still
  binary and "burn" is idiom rather than a filmable act. Relevant
  nuance: this fixture's story IS a binary at its core — the residual
  binary framing is partly faithful rendering of genuinely binary
  source material. Single-sample caveat applies (one pass ≠ proven
  stability).
- **Prompt changed afterward:** NO — stop condition met.

## Totals (final)

| | |
|---|---|
| Live calls | **4** (of 8 allowed) — 3 in round 1 (v3), 1 in the v4 retry |
| Actual spend | **$0.010564** (1.06% of $1.00) |
| Passes | 3/4 overall; v4 retry converted the v3 failure to a pass |
| Models | Haiku only — sufficient signal at every step |
| Prompt revisions driven by live data | 1 (v3 → v4, one clause) |
