# FABLE_ENGINE_PHASE_2_QUALITY_AUDIT

Prompted by the first live output from the Phase-1 engine (Backseat
project):

> "A seventeen-year-old escaping her hometown books a cross-country
> rideshare to reinvent herself, but four days trapped in a sedan with
> three strangers unraveling their own lives forces her to admit the
> person she's running from is the only honest thing she has."

User assessment (which this audit agrees with): the container is
strong ("four days trapped in a sedan with three strangers"); the
final clause is abstract self-realization dressed in good prose.

---

## 1. Was Phase 1 too conservative?

**In scope, no. In iteration depth, yes — in one specific, fixable
way.** The scope discipline (smallest reversible change, build the $0
harness first) was correct and is why Phase 2 can move fast now. The
under-iteration was in prompt *design method*: the Phase-1 logline ask
was written once, verified to assemble correctly, and shipped. It was
never adversarially attacked — "how will a model satisfy the letter of
these rules while violating their spirit?" The Backseat output is
exactly that attack succeeding:

- The kill list banned the *phrase* "discover who she really is."
- The model produced the same *failure class* in fresh words: "forces
  her to admit the person she's running from is the only honest thing
  she has" — a realization ending, paraphrased around the ban.

Lesson, stated as a rule: **ban failure classes and mandate the
positive alternative; phrase lists only teach the model which
paraphrases to reach for.**

## 2. Is dry-run-only limiting output-quality improvement?

Partly — and it's important to be precise about which part. Dry-run
validates prompt *assembly* (what the model sees) perfectly and output
*quality* not at all. But the Backseat failure was diagnosable
statically: a design-time adversarial pass over the Phase-1 ask would
have predicted "realization ending in new words" because the ask
demanded irony and banned phrases but never constrained the final
clause. The bottleneck was not missing live calls; it was a missing
self-evaluation step between "prompt written" and "prompt shipped."
Live calls remain the final arbiter — one per iteration cycle, not per
edit.

## 3. How can the engine self-evaluate without burning API money?

Four mechanisms, all $0, now adopted as the Phase-2 method:

1. **Adversarial prompt review (design-time).** For each rule in the
   ask, write down the cheapest way a model could comply while still
   failing the user. If one exists, the rule is under-specified.
   Documented per-fixture in `FABLE_ENGINE_PHASE_2_COMPARISON.md`.
2. **Contrastive examples inside the prompt.** A weak/strong pair on
   an invented premise defines the target by demonstration. Rules tell
   the model what to avoid; examples show it what "good" is — much
   harder to paraphrase around.
3. **A scored rubric applied to the assembled package.** The rubric in
   `FABLE_ENGINE_LOGLINE_TEST_PLAN.md` scores known outputs (Backseat
   fails it, correctly) and future live outputs the same way — one
   shared quality contract between design time and test time.
4. **Regression fixtures for known failures.** Backseat's shape is now
   a fixture; any future prompt edit re-snapshots it and asks "would
   this package still permit the abstract ending?"

(An automated Haiku-judge eval loop is possible atop the Style Lab
plumbing but costs live tokens per iteration — deferred; the manual
version above catches the current failure class for free.)

## 4. What should be dry-run only?

Prompt assembly and inclusion/exclusion (influences present, TV rules
absent on features), JSON-contract preservation, token/cost sizing,
prompt-text regression diffs, adversarial design review, rubric
scoring of *known* outputs. Everything iterated more than once.

## 5. What justifies one intentional live call?

Exactly one situation: a prompt-design cycle is complete, has passed
the $0 checks above, and the remaining question is "does the model
actually behave?" One call per fixture-case, judged against the
rubric, then back to dry-run iteration if it fails. Also acceptable: a
single A/B pair when two candidate prompts are genuinely undecidable
statically. Never loops, never per-edit.

## 6. Is the current logline prompt still too generic?

Yes — specifically at the ending. It demands "irony or a trap" and
bans six poster phrases, but says nothing about what the FINAL CLAUSE
must contain — and the final clause is where loglines die. It also
defines quality entirely by rules (prohibitions + virtues) with zero
demonstrations, and its uniqueness pressure ("concrete nouns") doesn't
require the story's one-of-a-kind container to appear. All three gaps
are what Phase 2 fixes.

## 7. Is the current rubric strong enough?

No. The Phase-1 rubric ("specific protagonist · irony/trap · concrete
nouns · no kill-list phrases · reference texture · authored feel")
would arguably PASS the Backseat output — it has a specific
protagonist, a trap, concrete nouns, no banned phrases. A rubric that
passes a known-bad output is broken. The Phase-2 rubric adds the
final-clause criterion as a hard gate (any realization/admission
ending = automatic fail) and scores abstraction directly. Backseat
scores 4/14 with a gate failure under the new rubric — see
`FABLE_ENGINE_LOGLINE_TEST_PLAN.md`.

## 8. Is the engine using references strongly enough?

The *mechanism* (influencesBlock) is sound: references with aspects
render adjacent to the task. Two real weaknesses: (a) the instruction
is directionally vague — "let these shape the flavor" doesn't tell the
model *what to extract* (kind of pressure? world detail? humor
register?); Phase 2 tightens this to "steal their TEXTURE — the kind
of pressure, world detail, and humor they'd use — never their plots or
names." (b) It cannot be confirmed whether the Backseat project had
references set at all; if it didn't, no prompt change fixes an empty
input — that's an input-richness UX question (Phase-1 audit risk #4,
still open, out of scope here).

## 9. Are tuning controls affecting the prompt clearly enough?

Presence: yes — moved dials render, defaults stay silent (correct).
Interpretation: thin. "darkness 7/10" states a number where an
instruction should be. Phase 1 only interpreted unpredictability ≥ 7.
This matters less for loglines than the final-clause fix, so Phase 2
leaves dial rendering alone rather than scope-creep — flagged for the
next pass, where per-dial interpretation lines ("darkness 7 → let real
harm be on the table; no cozy safety net") belong in `influencesBlock`
for all six concept asks at once.

## 10. Smallest safe Phase 2 plan

1. Branch `fable-engine-phase2-logline` (done).
2. This audit (commit 1).
3. Two new fixtures — `backseat-roadtrip` (regression shape) and
   `quiet-drama` (abstraction-danger case); `developed-feature`
   already covers the genre/external-stakes case. Extend the snapshot
   matrix; capture `phase2-before` with the deployed prompt (commit 2).
4. Rewrite `generate_concept_logline` ONLY: final-clause contract,
   weak/strong contrastive pair, container requirement, abstraction
   ban as a class, sharpened reference-texture line. JSON contract
   unchanged. Capture `phase2-after`; build (commit 3).
5. Tuning notes + logline test plan (scored rubric) + comparison with
   per-fixture adversarial self-evaluation (commit 4). Push branch.
6. Stop. One user-approved live test decides merge.

Not touched: every other ask, brain, routing, dials rendering, UI,
images, deploy.
