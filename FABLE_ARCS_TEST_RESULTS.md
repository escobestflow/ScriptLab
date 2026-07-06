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

## Known residuals

1. **Heat budget (A3)** is advisory, not enforced: Sonnet still
   over-heats back halves on dense dramas (held on the comedy). The
   digest overload note now instructs triage downstream, which is the
   real mitigation. If it matters more later: post-generation curve
   validation, or surface the overload flag in the Arcs tab UI
   (deliberately not done — no UI changes in this pass).
2. Duplicate hard moments across arcs at a designed collision (the
   EP4 cipher trade appears from two arcs' moment lists) — harmless
   emphasis, arguably correct; noted.
3. Richer arcs make arc-carrying episode prompts heavier (the
   downstream generate_episode prompt is ~10k input tokens, most of
   it in the cached bible block; the uncached digest is ~2k). Cost
   impact ≈ $0.005-0.01 per episode call — accepted for the quality.
4. Model may emit >3 moments per arc; the normalizer keeps the first
   three (chronological in all observed outputs).
