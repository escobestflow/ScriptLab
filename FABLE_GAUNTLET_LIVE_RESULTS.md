# FABLE_GAUNTLET_LIVE_RESULTS

Phase D log. All calls: local dev server, committed fixtures, prompt
version = Gauntlet C (`8c932c6`) unless noted. Costs are ACTUAL (route
usage reports). Rubrics: `FABLE_GAUNTLET_RUBRICS.md`. Full outputs
preserved in the session scratchpad; key excerpts quoted in
`FABLE_GAUNTLET_COMPARISON.md`.

**Verdict: beats 3/3 pass · scenes 3/3 pass · script-sync 1/1 pass ·
logline regression clean. 11 live calls, $0.6402 of $2.50 (25.6%).
Stopped on stop-condition 4 (clear improvement across all priority
surfaces). One prompt revision mid-round (beats length constraint
after a diagnosed output-cap truncation).**

## Round 1 — logline regression (3 × Haiku, 20:15 EDT)

| Fixture | Cost | Verdict | Note |
|---|---|---|---|
| backseat-roadtrip | $0.002477 | PASS ~11/14 | "…forces her to stop lying first" — act-shaped, competitive-liar irony |
| quiet-drama | $0.002380 | PASS ~13/14 | Best yet: "counted everything but forgiven nothing" (the fixture's flaw, surfaced); reveal-ending on ledger machinery |
| developed-feature | $0.002880 | borderline (same as v4) | Binary construction + the familiar parentage wobble — **NOT a regression**: identical residual to Phase 3; root cause isolated (see finding F2) |

No collateral from Phase C's shared changes. Logline suite: **no regression.**

## Round 2 — beats (4 × Haiku: 3 fixtures + 1 diagnosed retry)

| Call | Fixture | Cost | Verdict |
|---|---|---|---|
| 20:16 | horror-comedy | $0.022461 | **FAIL — output-cap truncation** (finding F1): output = 4,096 tokens exactly; the craft prompt made Haiku write 60–80-word beat summaries; sheet no longer fit the 4K tier. Content visibly strong; JSON cut mid-array |
| — | *prompt revision* | $0 | Schema line added: name 2–5 words / summary ≤40 words / purpose 1 sentence ("a beat is a promise, not the scene itself") |
| 20:18 | horror-comedy (retry) | $0.011091 | PASS 9/12 scored-visible — causality chained, purposes as audience effects; dings: one template beat name, comedy register thinner than toneNote demands (P-B5 partially confirmed) |
| 20:19 | reference-adjacency | $0.007538 | **PASS 14/14** — zero Breaking Bad furniture (the "DEA count sheets" are Walter's in-world audit artifacts); hospice-world pressure throughout; tragic final act specific ("she names the buyer; she does not ask for forgiveness") |
| 20:19 | anti-generic-trap | $0.008124 | **PASS 14/14** — zero haunted-house template (0 scan hits); the fixture's helpful-horror premise drives structure; final image "Theo locks the front door from inside" |

## Round 3 — scenes (3 × Opus)

| Call | Fixture / beat | Cost | Verdict |
|---|---|---|---|
| 20:20 | relationship-trap b2 (Seating Chart Summit) | $0.097395 | **PASS 14/14** — ZERO relationship errors on the maximal trap; purpose landed on screen ("Photographed both versions. Time-stamped."); voices pass the swap test; settlement-pen business |
| 20:20 | scene-intent b2 (Account Closed) | $0.083730 | **PASS 16/16 — best output the engine has produced.** DECEASED banner lands mid-sentence while Louise keeps talking (purpose delivered through the screen, exactly as contracted); gravy snippet woven verbatim; twist 9 sprung, weirdness 3 grounded. Cosmetic: markdown artifacts in headers (finding F3) |
| 20:21 | developed-feature b4 (Lena's Price) | $0.078375 | PASS ~13/14 — leverage reversal on screen ("Keep going"); parentage CORRECT this time despite no structured relationships (fidelity rules alone; single sample, claimed cautiously) |

## Round 4 — script-sync (1 × Opus)

| Call | Fixture | Cost | Verdict |
|---|---|---|---|
| 20:22 | relationship-trap (4 beats → 4 scenes, 3,711 out tok) | $0.323925 | **PASS 11/14** — compounding across cuts (settlement drawer → vows/divorce callback; empty chair travels scene 2 → 4); fidelity bullseyes ("my almost-granddaughter" = the exact asymmetric step-relation the trap planted; timestamped-deposition voice held); dings: climax scene 526w vs 400 target (finding F4); the voiced break staged but not spoken; one stock trace ("the room holds its breath") |

## Findings

- **F1 (fixed in-round):** craft-rich beats prompt + 4K output cap =
  truncation. Fixed prompt-side with schema length limits; retry
  passed at 1,810 tokens. Also cuts beat-sheet cost ~2×.
- **F2 (root cause isolated):** the remaining developed-feature
  parentage wobble happens where `relationships[]` is EMPTY — the
  render-fix works only where data exists. Real projects (incl. TV
  import output) mostly have empty relationship arrays. → NEXT_STEPS:
  auto-derive relationships at import + nudge UI (later).
- **F3 (cosmetic):** Opus sometimes emits markdown artifacts (`#`,
  `**`) in scene prose. Display-side tolerable; a one-line format rule
  is a next-pass candidate.
- **F4 (minor):** climax scenes overrun the 100–400 word target under
  sync; acceptable (climaxes earn length) or fixable with "climaxes
  may run to 500" language — flagged, not fixed.

## Prediction scorecard (vs FABLE_GAUNTLET_DRY_RUN_RESULTS.md)

Refuted by the new prompts: P-B1 (and-then), P-B3 (haunted template),
P-B4 (BB furniture), P-S1 (trap garble), P-S2 (on-the-nose), P-S4
(announced reveal / name-checked snippet), P-C1 (reset scenes), P-C2
(script garble), P-C3 (voice convergence). Partially confirmed: P-B5
(register lean — horror-comedy comedy register thin), P-S5-adjacent
(F4 length overrun at climax). Confirmed-but-out-of-fixture-scope:
none. New, unpredicted: F1 (truncation), F3 (markdown).

## Budget

| | |
|---|---|
| Live calls | **11** (3 + 4 + 3 + 1) |
| Actual spend | **$0.6402** of $2.50 (25.6%) |
| Models | Haiku ×7, Opus ×4 — production routes only; no escalation needed (Haiku passed beats decisively) |
| Prompt revisions from live evidence | 1 (beats length constraint) |
| Image/video calls | 0 |
