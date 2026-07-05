# FABLE_ENGINE_NEXT_STEPS

Ranked by leverage-per-risk. Everything here was deliberately kept out
of the current branch to honor "smallest reversible improvement."

## 1. Merge + judge (the immediate step)

Review `git diff pre-fable-engine-backup..fable-engine-quality-tuning`,
merge to `main`, deploy, then run ONE live logline generation on a
real project (Test Plan Layer 4) and judge it against the rubric. If
the voice is off, the fix is a prompt edit + dry-run diff — cheap to
iterate now.

## 2. Reference weights (reference-handling, phase 2)

`settings.references` today = title + aspects, uniform influence. Add
a per-reference weight the prompts render differently:
`must-follow · strong · light · inspiration-only`. Data model is a
one-field addition; `influencesBlock` already centralizes the
rendering, so the prompt side is one function. UI: a small selector on
the existing reference chips (Concept tab) — minor, contained.

## 3. Per-project engine profile (tuning, phase 2)

The Style Lab's `StyleProfile.scope` already supports
`{ projectId }` overrides — there's just no UI to create one. A
"Project voice" panel (fork the account profile, retrain 2–3 rounds on
this project's premise) gives per-project taste without new schema.
Combined with the existing dials + notes + references, that's the full
tuning stack: account voice → project override → per-field
regeneration.

## 4. Sonnet flag for logline/summary (quality ceiling)

Haiku executes the new asks; Sonnet would execute them better
(~4× cost on those two actions — still fractions of a cent). Suggest
an env-driven override (`UNFOLD_CONCEPT_MODEL=sonnet`) so it's an
experiment, not a silent default change. Judge with the same one-call
rubric before adopting.

## 5. Snapshot diff in CI (testing, phase 2)

`scripts/engine-preview.mjs` + fixtures already produce deterministic
prompt snapshots. A CI job that boots `next dev`, regenerates
snapshots, and fails on unexpected diff would catch accidental prompt
regressions in any future PR. (Local-only today by design — no CI
exists in this repo yet.)

## 6. Cost preview before the big runs

`scriptLoop` (per-beat Opus) and `easyMode` are the two spend-heavy
taps. Before starting, call the existing dry-run once for the first
beat, multiply by beat count, and show "~$X for N scenes — continue?"
Reuses this branch's plumbing; UI touch is one confirm dialog.

## 7. Extract-JSON strictness (reliability)

`extractJson`'s truncation recovery can silently accept a cut-off
array. With fixtures now in place, tightening it (fail + surface a
retry instead of partial-accept) is testable. Low urgency since the
32K caps landed.

## 8. Beat/scene ask pass (quality, next surface)

The same craft treatment applied here to concept asks, applied to
`generate_beats` / `generate_scene` / `rewrite_beat` — with
PRINCIPLES.md (Corey Mandell: authentic over formulaic) folded into
the craft bars. Bigger blast radius (structural outputs feed
downstream layers), so do it after #1 confirms the approach on the
smaller surface.

## Explicitly not recommended

- A large settings UI for engine knobs — the dials + notes +
  references + Style Lab already cover the space; more knobs before
  evidence of need is bloat (handoff's own warning).
- Fine-tuning or RLHF-style training — the paste-the-profile
  architecture is doing the job at zero training cost.
- Re-enabling any image auto-generation as part of engine work.
