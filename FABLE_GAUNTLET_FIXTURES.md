# FABLE_GAUNTLET_FIXTURES

Ten fixtures (5 pre-existing + 5 new), mapped to the eight required
trap shapes. Every fixture is a complete layered-draft `Story` under
`fixtures/engine/`; snapshot rows live in `scripts/engine-preview.mjs`.

| Fixture | Trap shape (required list #) | Surfaces exercised | The trap, specifically |
|---|---|---|---|
| `backseat-roadtrip` | 1 — contained road-trip / character pressure | logline (regression), beats | Strong container premise whose obvious ending is abstract self-realization |
| `developed-feature` (Buck Mark) | 2 — genre feature, external stakes | logline, beats, **scene** (beat 4 "Lena's Price"), script-sync | Bible frames the story as a two-option dilemma (menu-priming); Ray/Lena/Coyle relationship web garbles easily |
| `quiet-drama` (The Inventory) | 3 — quiet character drama | logline (regression) | No external stakes to lean on → generic-phrasing gravity |
| `horror-comedy` (Quorum) | 4 — comedy/horror-comedy | **beats** | Dual-register test: does the sheet keep BOTH the dread and the procedural comedy, or flatten to one? toneNote forbids camera-winking |
| `relationship-trap` (Second Wedding) | 5 — garble-able relationships | **scene** (beat 2, three principals), **script-sync** (4 beats) | Maximal web: ex-husband marrying the half-sister; stepfather who is ALSO the groom's business partner; a former stepdaughter who isn't the bride's relative at all. Every `relationships[]` array is populated — the surface the audit proved invisible to prompts |
| `reference-adjacency` (Comfort Measures) | 6 — references shape texture, not plot | **beats** | Premise sits one door from Breaking Bad, and BB is the listed reference. Fail = BB furniture appears (RV/lab/DEA-in-law analogs, empire arc); pass = descent + pressure texture on hospice-world nouns |
| `anti-generic-trap` (Homestead) | 7 — obvious generic version must be avoided | **beats** | Haunted-farmhouse premise whose default beat sheet writes itself (creaks → kid sees it first → skeptic dad → basement finale). The fixture's OWN twist (the house helps) + unpredictability 8 demand subversion; fail = the template anyway |
| `scene-intent` (Cold Calls) | 8 — script must preserve scene intent | **scene** (beat 2 "Account Closed") | Beat carries a precise purpose ("the audience learns Louise is dead WHILE hearing her voice — through the screen, not Mac saying it"), twist 9 / weirdness 3 dials, and a linked snippet whose dialogue must be woven in. Every intent channel loaded at once |
| `fresh-feature` | — baseline | logline/summary | Zero-signal input floor |
| `tv-ongoing` | — TV baseline | logline | TV-brain inclusion check |

## Fidelity tripwires (checked at scoring time)

- `relationship-trap`: Piper is Ruth's **half-sister** (same mother);
  Sadie is **Marcus's** daughter, NOT Piper's relative; Gene is
  stepfather to **Ruth only**. Any output that says "sister-in-law,"
  makes Sadie the bride's stepdaughter-already, or calls Gene Piper's
  stepfather = S7/B6/C5 gate fail.
- `developed-feature`: Lena is **Harlan's** daughter (the target), not
  Coyle's. Both P3 live outputs garbled this — the standing regression
  tripwire.
- `reference-adjacency`: Walter is Noor's **mentor and patient**, not a
  cop/investigator analog.
- `scene-intent`: the DECEASED 03/14 reveal must arrive via the
  audit-software screen during the call — a character announcing it in
  dialogue fails S2.

## Live-round assignments (Phase D)

- Beats (Haiku ×3): `horror-comedy`, `reference-adjacency`,
  `anti-generic-trap`
- Scene (Opus ×3): `developed-feature` b4, `relationship-trap` b2,
  `scene-intent` b2
- Script-sync (Opus ×1): `relationship-trap` (4 beats — cohesion +
  fidelity under the densest web)
- Logline regression (Haiku ×3): `backseat-roadtrip`, `quiet-drama`,
  `developed-feature`
