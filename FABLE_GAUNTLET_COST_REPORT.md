# FABLE_GAUNTLET_COST_REPORT

## This campaign (Phases A–E)

| Round | Calls | Models | Actual cost |
|---|---|---|---|
| Phases A–C (audit, rubrics, fixtures, prompt passes, snapshots) | 0 | — | **$0** |
| D1 logline regression | 3 | Haiku | $0.007737 |
| D2 beats (incl. 1 diagnosed retry after the truncation finding) | 4 | Haiku | $0.049214 |
| D3 scenes | 3 | Opus | $0.259500 |
| D4 script-sync | 1 | Opus | $0.323925 |
| **Total** | **11** | 7 Haiku · 4 Opus | **$0.640376** |

Budget: $2.50 · utilization **25.6%** · stopped on evidence, not
exhaustion. Zero image/video calls. Every call logged individually in
`FABLE_GAUNTLET_LIVE_RESULTS.md` with actual per-call cost from the
route's usage reports.

## Whole engine program to date (Phases 1→Gauntlet)

| Pass | Live spend |
|---|---|
| Phase 1 (infra + concept asks) | $0 |
| Phase 2 (logline method) | $0 |
| Phase 3 (logline live tuning, incl. v4) | $0.010564 |
| Quality Gauntlet | $0.640376 |
| **Program total** | **$0.650940** |

## Cost side-effects of the gauntlet changes

- Beats calls got CHEAPER live: the length constraint cut output
  ~2.3× (4,096-cap hit → 1,810 tokens; $0.0225 → $0.0111 on the same
  fixture) while fixing a truncation defect. Richer input (+~600 tok)
  is pennies on Haiku.
- Scene/script calls carry +~600–900 input tokens of craft + fidelity
  + relationship lines ≈ +$0.010–0.014 per Opus call at cold cache —
  bought: zero garbles, purpose-as-contract, and the swap-test voice
  quality documented in the comparison. Cached repeats re-bill at ~10%.
- No routing changes: the gauntlet produced positive evidence that
  **Haiku suffices for beats when the prompt carries the craft** —
  avoiding a ~4× routing upgrade that looked tempting pre-evidence.

## Standing protections (unchanged)

Dry-run mode, `UNFOLD_AI_LIVE` kill switch, image auto-gen default-off,
one-shot live scripts (no loops), per-call cost logging to `usage_log`.
