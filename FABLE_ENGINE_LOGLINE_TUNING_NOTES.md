# FABLE_ENGINE_LOGLINE_TUNING_NOTES

Phase 2. One prompt changed: `generate_concept_logline` in
`lib/contextBuilder.ts`. Nothing else touched (other asks, brain,
routing, dials, UI, images all unchanged). JSON contract identical.

## The regression that drove this

Backseat (first live output of the Phase-1 engine): strong container,
abstract ending — "forces her to admit the person she's running from
is the only honest thing she has." It passed every Phase-1 rule. The
Phase-1 ask banned cliché *phrases*; the model produced the banned
*shape* in fresh words. Full analysis:
`FABLE_ENGINE_PHASE_2_QUALITY_AUDIT.md` §1, §6.

## The user's 10 requirements → the exact prompt lines that carry them

| # | Requirement | Where it landed in the new ask |
|---|---|---|
| 1 | Concrete protagonist contradiction | "a defining trait or CONTRADICTION, not a demographic — 'a fixer who can make anything disappear except his own debts'" |
| 2 | Specific external pressure | "one concrete, filmable external force with a clock or a container (a debt due Friday, four days in one sedan, the buyer takes the store Monday)" |
| 3 | Clear ironic trap | "getting what they want must threaten what they need — build it into the situation itself, not into commentary about it" |
| 4 | Final clause = choice/consequence/irreversible pressure | **FINAL CLAUSE RULE** — "end on a dramatic CHOICE, a PRICE, or an IRREVERSIBLE COLLISION — something a camera could film. NEVER end on a realization, admission, acceptance, or inner truth… If your draft ends on an insight, delete it and end on the concrete act or cost that would FORCE that insight." |
| 5 | Less abstract emotional language | "No abstract emotional vocabulary ('honest', 'truth', 'healing', 'belonging', 'who she really is') — if a word names a feeling instead of showing a situation, cut it." |
| 6 | Less elegant-but-generic phrasing | The weak/strong contrastive pair — the weak example IS elegant-generic; the model is shown the difference rather than told. |
| 7 | More story-specific nouns/situations | "At least three concrete nouns from THIS story's world." |
| 8 | Stronger references without name-drops | "steal their TEXTURE — the kind of pressure, world detail, and humor they'd reach for — never their plots or their names." |
| 9 | What makes the project unique | "Name THIS story's container or mechanism — the thing no other project has." |
| 10 | Poster-cliché avoidance incl. new entries | Kill list extended with "confront her past", "discover who she really is", closing with "— and every paraphrase of them. Banning the phrase bans the shape." |

## The two design-method changes (why this iteration is different)

1. **Class ban + mandated positive alternative**, not phrase ban. The
   final-clause rule names the failure class (insight endings) and
   prescribes the replacement operation (delete the insight; end on
   the act/cost that would force it).
2. **Contrast teaching.** A weak/strong pair on an invented premise
   (wedding-band van — road-trip-adjacent on purpose, so it teaches
   the Backseat case without leaking its content). Examples define
   the target by demonstration; rules alone invite paraphrase.

## Cost effect

+~330 est input tokens per logline call (e.g. backseat fixture
1,544 → 1,871). At Haiku pricing ≈ +$0.0003 per tap, and the block is
inside the cached prompt structure. Negligible against the value of
the field.

## Residual risks (honest)

- **Choice-template monotony:** the model may over-produce "must
  decide whether to X" endings. The rule offers three ending types
  (choice / price / collision) to spread the distribution; watch this
  in the live test.
- **Structure-mimicry of the example:** em-dash + "decide, X by X"
  constructions may echo. Structure imitation is acceptable (that's
  the teaching); verbatim reuse is not — the prompt forbids content
  reuse explicitly.
- **Compression pressure:** 40 words + more requirements may squeeze
  the protagonist-contradiction slot on Haiku. If the live test shows
  demographic protagonists, the next $0 iteration reweights.
