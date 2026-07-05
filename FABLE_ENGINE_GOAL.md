# Fable Engine Work — Goal

**Goal:** Improve Unfold's creative output engine — quality, reference
faithfulness, tunability, and cost-safe testability — while protecting
the current working app and API budget.

**Workflow note:** No `/goal` skill exists in this session, so the
goal loop is simulated per the handoff: this file (goal), the task
tracker + checkpointed commits (progress), `FABLE_ENGINE_AUDIT.md`
§14 (plan), and the required docs (evaluation).

## Success criteria (from the handoff, made concrete)

1. `main` untouched; all work on `fable-engine-quality-tuning`,
   backup tag `pre-fable-engine-backup` exists. Easy diff + rollback.
2. Zero live API calls during development and testing. Prompt quality
   iterated via dry-run previews and fixtures only.
3. Output quality: the six short-creative concept asks (logline, title,
   summary, tone, themes, tagline) upgraded from 3–6 thin lines to
   expert craft prompts; references/dials/notes explicitly wired in.
4. Reference usage: selected references + writer voices + vibe + dials
   restated with recency weight in the concept asks (today they exist
   as one bible line only — script sync already restates them,
   concept asks don't).
5. Focus: feature/short generations stop carrying ~25 lines of
   TV-only brain rules.
6. Cost safety: dry-run mode on `/api/generate` (prompt preview +
   token/cost estimate, no Anthropic call), env kill switch for live
   calls, fixtures + snapshot script committed.
7. Image generation untouched and still default-off.
8. `npx next build` passes at every checkpoint.
9. All six required `FABLE_ENGINE_*.md` docs written, with a real
   before/after prompt comparison captured from the actual code.

## Stop condition

Stop after the smallest high-value reversible improvement (criteria
3–6) is implemented, tested via dry-run, documented, and pushed to the
branch. Larger ideas (model-tier flags, reference weights, per-project
engine profiles) go to `FABLE_ENGINE_NEXT_STEPS.md`, not into scope.
