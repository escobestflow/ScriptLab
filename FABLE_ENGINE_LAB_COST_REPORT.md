# FABLE_ENGINE_LAB_COST_REPORT

Engine Lab build (branch `fable-engine-lab`, 2026-07-06).
Authorized cap: **$3.00**. Actual live spend: **$0.031007** (1.0% of
cap). Everything else ran at $0 via dry-run.

## Live calls (complete log — 3 calls, all via scripts/engine-lab-live.mjs against the local dev server)

| # | Fixture × action | Profile | Model | In tok | Out tok | Cost |
|---|---|---|---|---|---|---|
| 1 | scaffolding-trap-guardrails × generate_concept_logline | taste-profile | claude-haiku-4-5 | 3,522 | 99 | $0.004017 |
| 2 | scaffolding-trap-guardrails × generate_beats | taste-profile | claude-haiku-4-5 | 3,386 | 2,208 | $0.014426 |
| 3 | scaffolding-trap-guardrails × sync_concept_to_characters | taste-profile | claude-haiku-4-5 | 3,074 | 1,898 | $0.012564 |
| | | | | | **Total** | **$0.031007** |

No Opus/Sonnet calls were needed: all three validation questions
(guardrail adherence, humor-dial register, taste×edge composition)
were answerable on Haiku surfaces. No image, video, or TTS generation
of any kind.

## $0 work

- 22-row dry-run snapshot matrix (×2 full runs: capture + verify),
  inclusion-marker checks, auth-gate checks, normalize round-trip,
  `npx next build` — all via `dryRun: true` / local tooling; zero
  Anthropic contact.

## Ongoing cost profile of the feature itself

- Taste block: ~466 tok, its own cached system block → ~$0.0005 cold /
  ~$0.00005 cached per call on Haiku; proportionally more on
  Sonnet/Opus. Only paid by accounts that author a taste profile.
- Guardrails: ~200–400 tok inside the (already cached) bible block,
  only on projects that set them.
- The Lab UI itself spends nothing without the typed `LIVE` confirm;
  its default session cap is $0.50.
