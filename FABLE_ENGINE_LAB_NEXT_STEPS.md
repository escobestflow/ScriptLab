# FABLE_ENGINE_LAB_NEXT_STEPS

Ranked continuations after the Engine Lab MVP (branch
`fable-engine-lab`). Deferred-by-design list in
`FABLE_ENGINE_LAB_PRD.md` §7.

1. **Merge + deploy this branch** (user approval; then verify
   /engine-lab on prod from the admin account — the fixtures API
   depends on the new `outputFileTracingIncludes`, worth one prod
   check).
2. **Guardrail wording fix for finding L-1** (see TEST_RESULTS): the
   model enforced "never reciprocates romantically" as a behavior
   rule, not an interior-state rule. Candidate: phrase sensitive-
   handling guardrails behaviorally ("her interest reads as
   flattered confusion, never romantic pursuit; she initiates
   nothing") — either as user guidance in the Lab's field placeholder
   or as a render-time hint line. One dry-run + one $0.01 beats
   retry to verify.
3. **Wire the Lab's rubric scores into the gauntlet docs flow** —
   after a scored run, an "export as markdown row" button so live
   results tables in FABLE_*.md stop being hand-transcribed.
4. **AI-judge scoring** (gauntlet NEXT_STEPS #9) — now materially
   more attractive: the Lab makes runs one click, a Haiku judge
   (~$0.02/output) scoring against the embedded rubrics would make
   the whole gauntlet re-runnable unattended from the Runner tab.
5. **Taste profile on more surfaces check** — the taste block injects
   into ALL actions today (like the writer profile). Verify on one
   Opus scene ($0.10) that prose surfaces benefit rather than
   over-steer; if over-steering, scope the block to content-creating
   asks only (same set as EDGE_PRESERVATION_RULES).
6. **Guardrails in the main app** (separate UX approval) — surface
   read-only guardrail chips on the Concept tab so the writer sees
   what's binding; editing stays in the Lab until the UX is designed.
7. **Remaining gauntlet items** carried forward: register-balance
   micro-pass can now be A/B-tested with the humor dial (P-B5 —
   partially addressed: dial exists, one live sample positive);
   cosmetic format rule F3; climax length F4; variance
   characterization; cost preview on scriptLoop/easyMode.
8. **Snapshot-era differ in the Lab** — History tab links the era
   manifest to snapshot dirs; a two-era text diff view would replace
   the CLI `diff -r` for prompt archaeology. Low urgency.
