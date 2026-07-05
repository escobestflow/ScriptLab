# FABLE_ENGINE_LOGLINE_TEST_PLAN

The logline-specific quality contract. Complements (doesn't replace)
`FABLE_ENGINE_TEST_PLAN.md`.

## The scored rubric (v2)

Score each 0–2 (0 = absent/violated · 1 = present but weak · 2 = fully
landed). **Criterion 4 is a hard gate: any score of 0 = automatic
FAIL regardless of total.** Pass = no gate failure AND total ≥ 10/14
(≥ 9/12 when criterion 6 is n/a because the project has no references).

| # | Criterion | 2 looks like |
|---|---|---|
| 1 | Protagonist contradiction | A trait/contradiction you could cast, not a demographic |
| 2 | External pressure | Filmable force with a clock or container |
| 3 | Ironic trap | Goal and obstacle feed each other inside the situation |
| 4 | **Final clause (GATE)** | Ends on a choice, price, or irreversible collision — filmable. Realization/admission/acceptance ending = 0 |
| 5 | Concrete language | ≥3 story-specific nouns; zero abstract-emotion words; zero poster phrases or paraphrases |
| 6 | Reference texture | The influences' kind of pressure/detail/humor is felt; no titles named (n/a if project has no references) |
| 7 | Uniqueness | This story's one-of-a-kind container/mechanism is visible |

## Calibration: the Backseat regression output, scored

> "A seventeen-year-old escaping her hometown books a cross-country
> rideshare to reinvent herself, but four days trapped in a sedan with
> three strangers unraveling their own lives forces her to admit the
> person she's running from is the only honest thing she has."

| # | Score | Note |
|---|---|---|
| 1 | 1 | "escaping her hometown… to reinvent herself" — motive, not contradiction |
| 2 | 2 | "four days trapped in a sedan with three strangers" — excellent |
| 3 | 1 | reinvention vs forced intimacy is implicit, half commentary |
| 4 | **0 — GATE** | "forces her to admit… the only honest thing she has" — insight ending |
| 5 | 1 | good nouns, but "the only honest thing she has" is abstract-emotional |
| 6 | n/a | can't verify references were set on the live project |
| 7 | 2 | the container is the logline's best asset |

**Total: 7/12, gate failed → FAIL.** The v1 rubric passed this output;
a rubric that passes a known-bad output is broken. This one doesn't.

## Dry-run checks ($0) — run before any live call

```bash
npm run dev   # terminal 1, no secrets needed
node scripts/engine-preview.mjs fixtures/engine/snapshots/current   # terminal 2
diff -r fixtures/engine/snapshots/phase2-after fixtures/engine/snapshots/current
```

Then, per logline snapshot (`*__generate_concept_logline.txt`):
1. FINAL CLAUSE RULE present; weak/strong pair present.
2. Influences block renders for backseat-roadtrip (2 refs + vibe +
   toneNote + unpredictability 7 + darkness 4) and quiet-drama (1 ref +
   writer voice + vibe + darkness 6 + pace 3); absent for fresh-feature.
3. `Return STRICT JSON: { "logline": string }` is the final line.
4. No TV rules on the three feature fixtures.

## The one live test (after user approval — never automatic)

**In the app UI (preferred):** open the real **Backseat** project →
Concept → clear/ignore the old logline → tap ⚡ on Logline. One Haiku
call (~$0.002). Score the result against the rubric above. The single
most important check: **does the final clause name an act, cost, or
collision instead of an admission?**

Optional second data point (same approval): repeat on a quiet-drama-
like project — abstraction risk is highest there.

If it fails: score it, note which criterion failed, iterate the ask at
$0 (the failure becomes the next contrastive example), re-snapshot,
one more live call. Two failed live iterations in a row = stop and
rethink the approach (consider the Sonnet flag from
FABLE_ENGINE_NEXT_STEPS #4) rather than burning more calls.
