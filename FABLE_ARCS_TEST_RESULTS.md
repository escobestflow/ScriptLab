# FABLE_ARCS_TEST_RESULTS

Phase D of the Arcs quality pass (branch `fable-arcs-quality`,
2026-07-06). Rubric: `FABLE_ARCS_RUBRIC.md`. Downstream:
`FABLE_ARCS_DOWNSTREAM_CHECK.md`. Cap $2.00 — total spend **$0.3843**.

## Fixtures (coverage map for the six asked-for categories)

| Fixture | Covers | Notes |
|---|---|---|
| `tv-prestige` (NEW) | prestige serialized drama + moral descent | Stockyard Kings with a full 5-character cast and relationship data (the original `tv-ongoing` has an empty cast — left untouched to preserve its snapshots); Jolene/Clay carry the descent material |
| `tv-mystery` (NEW) | mystery season + relationship-heavy | The Reservoir: a reopened claims file where every reveal re-prices a family bond; 4 characters, dense relationship web |
| `tv-timeslip` (NEW) | dark comedy + the time-slip project | Y2Kid as an 8-episode season: 5 characters incl. Ms. Vann, full guardrails carried over from `scaffolding-trap-guardrails`, humor dial 8 |
| `tv-prestige-arcs` (NEW) | downstream/digest testing | tv-prestige + the live AFTER arcs applied through the real `addArcToActiveDraft` path (43→33 moments after the 3-per-arc cap) |

## Live log (5 calls, all Sonnet via scripts/engine-lab-live.mjs, local dev server)

| # | Call | Cost | Rubric | Pass/fail | What changed after |
|---|---|---|---|---|---|
| 1 | tv-prestige × tv_import_arcs (OLD prompt — the "before" calibration) | $0.0298 | **3/16, gates A1/A2/A4 failed** | FAIL | Diagnosis fed the rubric + rewrite: staircase curves (literally 3,4,5,6,7,8,9,10), 10 arcs ≥6 at EP8, "learns that…" descriptions, 0 moments, 0 relationship arcs |
| 2 | tv-prestige × tv_import_arcs (NEW prompt) | $0.0940 | **15/16** (A3=1) | PASS | 0/11 monotonic curves; 43 filmable moments; Jolene ↔ Wade relationship arc with contract→reprice→new contract; theme carried by the red water-line mark; EP4 convergence designed (forgery + cipher trade). Residual: 10-11 arcs ≥6 in the back half → added the heat-budget line |
| 3 | tv-mystery × tv_import_arcs (heat budget added) | $0.1074 | **14/16** (A3=1, A6=2) | PASS | 2 relationship arcs; theme carried by NORA'S SIGNATURE; reveal ladder proper. Heat budget violated again (EP7-8 at 10-11 hot) — same class twice after revision → STOP per protocol; documented as known residual, mitigated by the digest overload note |
| 4 | tv-timeslip × tv_import_arcs + taste profile | $0.0950 | **14/16** (A3=2!, A6=1) | PASS | Heat budget essentially held (quiet EP7-8 — real valleys); ALL guardrails preserved: useless knowledge central, every scheme fails, crew shuts the business down themselves, Ms. Vann arc ends on a professionally-warm note with boundaries held, NO get-back-home arc. A6 ding: invented "Derek Huff" as a named principal → added the no-new-principals rule (verified in dry-run snapshot; not re-run live — same constraint class the fidelity rules already enforce elsewhere) |
| 5 | tv-prestige-arcs × generate_episode (downstream) | $0.0581 | — (see DOWNSTREAM_CHECK) | PASS w/ 1 find | All 5 EP1 hard moments landed as beats; find: EP4's reveal pre-empted in EP1's final beat → added the no-pre-emption rule to renderSeasonArcs |

## Time-slip guardrail scorecard (the ask's explicit checklist)

- useless future knowledge — ✅ the main plot IS its uselessness
- friends as bad co-conspirators — ✅ (Reggie doubles down, P-Dub
  invoices the crew for losses, Tone freezes on his one job)
- 1996 teenage limitations — ✅ (mall bans, parents, guidance
  counselor, no leverage anywhere)
- teacher subplot as ethically uncomfortable dark comedy — ✅
  relationship arc "Miles ↔ Ms. Vann" holds boundaries (declined
  invitation, professional final note), discomfort stays on the page
- no generic "get back home" arc — ✅ none (the only "timeline" in
  the output is Derek's evidence timeline)

## $0 verification

- `npx next build` clean (twice — after Phase C and after final rules).
- Snapshot regression: **all pre-existing rows byte-identical**
  across every capture; the committed `arcs-quality` baseline adds
  4 rows (3× tv_import_arcs incl. taste variant, 1× downstream
  generate_episode with populated arcs).
- Moments normalization exercised through the real
  `addArcToActiveDraft` path when building `tv-prestige-arcs`
  (11/11 arcs carry moments; 1-based episodes → 0-based positions;
  >3 moments truncated to the first 3).

## Iteration 2 (user-authorized self-iteration addendum, same $2 cap)

The heat residual was attacked with the full loop. **Design
conclusion: prompts teach design; code enforces grammar.**

| # | Step | Cost | Result |
|---|---|---|---|
| 6 | tv-mystery × tv_import_arcs with band-semantics prompt (per-arc season budget + self-check) | $0.0921 | Better raw design (9 arcs, no ramps) but per-arc budget held 0/9, max 9 hot/ep — THIRD prompt-only failure ⇒ design rethink |
| — | `enforceCurveBudget` (per-arc, downward-only: top-2 episodes untouched, next-4 cap 7, rest cap 3) + `enforceEpisodeHeat` (global: top-5 hot arcs keep their scores per episode, rest pressed to 5) in `applyTVImportArcsResult` | $0 | Measured on all three captured live sets via the real exported functions: **max hot = 5 on every episode of every fixture** (was 8–11); dominance ≤2/arc everywhere; **0 peaks moved across 30 arcs**; no curve flattened (all retain ≥4 range). Import-only — user-authored curves never touched |
| 7 | tv-prestige × tv_import_arcs (v2 grammar, fresh set for the downstream twin) | $0.0884 | Raw output improved unaided too: EP1-2 nearly silent (0-1 hot), 4/10 arcs hold budget before enforcement (was 0) |
| 8 | tv-timeslip × tv_import_arcs + taste (v2) | $0.0928 | **No invented principals** (Derek-class rule verified live); guardrails stronger than round 1: a colleague warns Ms. Vann it "LOOKS like something" and she pulls back horrified — social danger + boundaries + consequence; no get-back-home/fix-timeline machinery |
| — | Twin rebuilt from run 7 through the real two-phase path; digest re-check | $0 | **overloaded=false on every episode** (was true on EP4/EP6); episode identity grades: EP1 = 2-arc setup hour → EP8 = 5-dominant convergence finale |

Iteration-2 spend: $0.2733. **Cumulative pass total: $0.6576 of $2.00.**

## Known residuals

1. ~~Heat budget advisory-only~~ **CLOSED in iteration 2** — enforced
   deterministically in the apply path (see above). Residual within
   the residual: the model's RAW curves still exceed the budget on
   dense dramas; enforcement makes this invisible to users, and the
   band-semantics prompt measurably narrows the gap. A convergence
   finale may carry up to 5 dominant arcs — allowed by design.
2. Duplicate hard moments across arcs at a designed collision (the
   EP4 cipher trade appears from two arcs' moment lists) — harmless
   emphasis, arguably correct; noted.
3. Richer arcs make arc-carrying episode prompts heavier (the
   downstream generate_episode prompt is ~10k input tokens, most of
   it in the cached bible block; the uncached digest is ~2k). Cost
   impact ≈ $0.005-0.01 per episode call — accepted for the quality.
4. Model may emit >3 moments per arc; the normalizer keeps the first
   three (chronological in all observed outputs).
