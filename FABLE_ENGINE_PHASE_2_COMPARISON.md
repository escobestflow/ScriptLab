# FABLE_ENGINE_PHASE_2_COMPARISON

Prompt-package changes for the three logline fixtures, plus the $0
adversarial self-evaluation of each package. Snapshots:
`fixtures/engine/snapshots/phase2-{before,after}/`. Re-verify:
`diff -r` the two directories — only `*__generate_concept_logline.*`
rows differ (plus the two new fixtures existing only in phase2 dirs).

## Deltas

| Fixture | Before | After | What changed in the package |
|---|---:|---:|---|
| developed-feature (genre / external stakes) | 1,833 | 2,160 | ask v2 only |
| backseat-roadtrip (regression shape) | 1,544 | 1,871 | ask v2 only |
| quiet-drama (abstraction danger) | 1,483 | 1,810 | ask v2 only |

All other matrix rows byte-identical between phase2-before and
phase2-after — proof the change is scoped to the one ask.

## Per-fixture adversarial self-evaluation ($0 method)

For each package: what the model sees, the cheapest way it could
comply-but-fail, and whether the new ask closes that path.

### backseat-roadtrip (the regression case)

Sees: rich summary (rideshare, four days, three strangers, three
different cover stories, "three states left when the stories start
colliding"), Nell's want/need contradiction, Little Miss Sunshine
(container, ensemble warmth) + Lady Bird (voice, mother-daughter
friction), vibe, toneNote, unpredictability 7 / darkness 4.

- Cheapest failure under v1: exactly what happened live — keep the
  container, end on "admit/realize" in fresh words. **v1 had no rule
  against it.**
- Under v2: that ending now violates an explicit named rule AND
  contradicts the demonstrated strong example. The cheapest compliant
  path becomes an act-ending built from the summary's own material
  (the cover stories colliding, the sister's doorstep, choosing which
  version of herself survives the last state line). Residual risk:
  a mechanical "must decide whether to…" template — flagged in
  TUNING_NOTES, watched in the live test.
- Verdict: **likely better logline; the specific live failure is now
  rule-blocked and example-blocked.**

### quiet-drama (abstraction danger)

Sees: hardware-store inventory, Monday-buyer clock, forgiven-debts
ledger, brothers' opposed wants; Manchester by the Sea (restraint);
darkness 6, pace 3.

- Cheapest failure under v1: "…forces two brothers to reckon with the
  father they never really knew" — elegant, generic, insight-shaped.
- Under v2: the final-clause rule forces the ending onto the fixture's
  own concrete machinery — the count that must balance Monday, the
  ledger's forgiven debts, what Frank sells vs. what Charlie pockets.
  This fixture is precisely why the "clock or container" line names
  "the buyer takes the store Monday" as an example shape.
- Residual risk (highest of the three): choice-endings built from
  abstract nouns ("choose between the ledger and his brother" —
  choice-shaped but woolly). The ≥3-concrete-nouns rule pushes
  against it; live test will tell.
- Verdict: **most improved package on paper; also the one to live-test
  second if you want two data points.**

### developed-feature (genre / external stakes)

Sees: Buck Mark's debt/betrayal engine, Ray's contradiction, Coyle,
Lena's leverage; Breaking Bad + Hell or High Water textures; dials
7/7/6.

- Under v1 this fixture was already the safest — external stakes give
  the model somewhere concrete to land. Cheapest failure was a limp
  final clause ("…with everything on the line").
- Under v2 the ending must name the choice the whole fixture points
  at (which debt he can live with — the ledger or the kid). The trap
  requirement and the ending rule now reinforce each other.
- Verdict: **modest gain; mainly protected against regression.**

## What this comparison cannot claim

Prompt-package improvement is necessary, not sufficient. Whether Haiku
actually obeys the final-clause contract is an output question —
settled by the single approved live test in
`FABLE_ENGINE_LOGLINE_TEST_PLAN.md`, scored on the v2 rubric. No live
call was made in producing this document.
