# FABLE_ENGINE_PHASE_3_COMPARISON

## The trajectory, one output per phase (same engine surface)

| Phase | Live output ending | Failure class |
|---|---|---|
| 1 (Backseat) | "…forces her to admit the person she's running from is the only honest thing she has." | Insight ending |
| 2 (Laughing Man) | "…forcing her to choose between her career and containing the outbreak." | Menu ending |
| 3, call 2 (quiet-drama fixture) | "…Frank has to decide whether to list them or let them disappear." | **None — target shape** (single filmable act, premise machinery, cost inside the act) |

Each phase eliminated the previous phase's failure class. Phase 3's
live round: 2/3 pass, and the pass on the abstraction-danger fixture
is the strongest logline the engine has produced.

## Prompt v2 → v3 (the only code change)

- Final-clause rule rewritten: "concrete ACT, COST, or COLLISION from
  this story's world… filmable as a scene… the strongest endings turn
  the premise's own machinery against the protagonist," with two
  banned shapes named — (a) insight endings (kept from v2),
  (b) **menu endings** ("must choose between X and Y") with the
  replacement operation (show the single action the choice comes down
  to, cost visible inside it).
- Second contrastive pair added, built from the Phase-2 live failure
  (laugh-virus premise): menu-weak vs "…bomb the sold-out special
  that could finally make her famous."
- Package delta: +~128 est input tokens (backseat 1,871 → 1,999).
  All non-logline prompts byte-identical (phase3-after snapshots).

## What the live round proved

1. **The contrast-pair method transfers.** The wedding-band pair
   killed insight endings in all 3 outputs; the laugh-virus pair
   killed menu endings on both clean-input fixtures.
2. **Haiku is sufficient** for this ask when the prompt carries the
   craft — 13/14 on the hardest fixture at $0.0024/call. No routing
   escalation warranted on this evidence.
3. **The remaining failure has a specific mechanism** (call 3):
   *bible-priming beats ask-banning.* When the project's own summary/
   beats frame the story as "a choice between X and Y," the model
   reproduces that frame in the logline despite the ban — project
   faithfulness and shape rules collide, faithfulness wins. Clean
   projects don't trigger it.

## Deferred v4 (one line, ready when you want it)

Append to the menu-ending ban:
> "Even when the project's own summary or beats describe the story as
> a choice between two things, do NOT reproduce that framing — render
> the single concrete act that choice comes down to."

Plus (separate, cheap): add a fidelity criterion to the rubric —
call 3 also garbled a relationship ("his creditor's daughter" for the
target's daughter), which the craft rubric doesn't currently catch.
Both deferred because the stop condition (2/3) was met; each is one
$0 dry-run iteration + ≤3 live calls under the existing protocol.

## Cost

Whole phase: $0.0077 live + $0 dry-run. Budget utilization: 0.77%.
