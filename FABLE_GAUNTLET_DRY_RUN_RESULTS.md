# FABLE_GAUNTLET_DRY_RUN_RESULTS

Baseline ($0) analysis of the CURRENT prompt packages
(`fixtures/engine/snapshots/gauntlet-before/`), with adversarial
predictions per surface. Each prediction is a testable claim — Phase D
scores live outputs against them; Phase C's edits are judged by
whether the predicted failures stop appearing.

## Package facts (verified in the snapshots)

1. **Relationships absent.** `relationship-trap__generate_scene`: the
   cast block lists Ruth/Gene/Sadie with archetype/want/voice only.
   The five-person web ("half-sister", "Marcus's daughter from his
   FIRST marriage", "stepfather to Ruth only") appears nowhere except
   two summary sentences. The model must infer the family tree from
   prose — the audit's smoking gun, confirmed in the artifact.
2. **`generate_beats` ask = 5 thin rules** (ingredients, snippet,
   dials, ending types + TV-only extras). No causality, escalation,
   final-beat, specificity, or fidelity language reaches the model.
3. **`generate_scene` has no craft rules.** The entire quality
   instruction is "Honor the project bible above — vibe, genres, tone,
   themes… apply." No decision/revelation, no subtext, no voice
   distinctness, no length target, no anti-generic classes, no
   fidelity clause. (Its sibling `tv_import_pilot` has most of these —
   the everyday path never got them.)
4. **`sync_story_to_script` treats scenes as parallel units** — format
   + per-beat dials rules exist; nothing about scenes compounding,
   continuity of fact, or cross-scene voice stability.
5. Package sizes (est tokens): beats fixtures ~1.3K (Haiku); scene
   fixtures 1.6–2.2K (Opus); relationship-trap script-sync 2.1K (Opus).

## Adversarial predictions (what the CURRENT prompts will produce)

**Beats (all three fixtures):**
- P-B1: ≥2 "and then" joints per sheet (no causality contract).
- P-B2: template beat names ("The Discovery", "Things Escalate") on
  at least one fixture.
- P-B3 (`anti-generic-trap`): the haunted-house default template
  appears (child-sees-first / skeptic-parent / basement-climax)
  DESPITE the premise's own subversion, because nothing instructs
  against the genre default and unpredictability 8 is one bible line.
- P-B4 (`reference-adjacency`): at least one Breaking Bad furniture
  beat (buyer-empire escalation, law-enforcement-close-to-home analog)
  rather than hospice-world pressure.
- P-B5 (`horror-comedy`): register collapse — the sheet plays it
  straight horror (or straight sitcom) instead of deadpan-procedural
  both.

**Scene (all three fixtures):**
- P-S1 (`relationship-trap`): at least one relationship error or
  hedge (Sadie's parentage and Gene's asymmetric stepfather-hood are
  the likely casualties).
- P-S2: on-the-nose thesis line (a character states the theme/need
  aloud) in at least one scene — no subtext rule exists.
- P-S3: stock gestures ("a beat of silence", "something shifts") in
  at least one scene.
- P-S4 (`scene-intent`): the DECEASED reveal gets spoken aloud or
  pre-announced rather than landing through the screen mid-call; the
  linked gravy snippet gets name-checked, not woven.
- P-S5: scene lengths drift (no target specified).

**Script-sync (`relationship-trap`, 4 beats):**
- P-C1: at least one scene resets to neutral (no compounding rule).
- P-C2: relationship garble at least once across 4 scenes (denser
  exposure than a single scene).
- P-C3: Ruth/Piper/Sadie voices converge by scene 3 (no distinctness
  rule at script scale).

**Logline regression:** no change predicted — the ask is untouched by
Phase C. Any regression = collateral from shared blocks (bible
rendering change is the one shared edit; watched explicitly).

## What Phase C must therefore add (traceability)

Relationships rendered in bible + cast block (→ P-S1, P-C2) · shared
fidelity rules on all three asks (→ P-S1, P-B/C gates) · causality/
escalation/final-beat/specificity contract for beats (→ P-B1–B3) ·
reference-texture rule at the beats level (→ P-B4) · dual-register
instruction honoring toneNote (→ P-B5) · decision-or-revelation,
subtext, voice-distinctness, anti-generic classes, length target for
scenes (→ P-S2–S5) · purpose-as-contract (→ P-S4) · compounding +
continuity + voice-stability for script-sync (→ P-C1–C3).
