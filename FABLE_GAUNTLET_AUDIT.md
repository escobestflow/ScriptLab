# FABLE_GAUNTLET_AUDIT — the beats → scene → script chain

Phase A of the Creative Quality Gauntlet (`FABLE_BIG_PASS_PLAN.md`).
Verified against branch point `a5a38a7`. $0 spent.

## 1–4. Exact prompts, files, routes, state

| Surface | Prompt builder | Model (modelForAction) | Trigger | State read | State written |
|---|---|---|---|---|---|
| Beat sheet | `generate_beats` ask — `lib/contextBuilder.ts` `buildAsk` (~line 557) | **claude-haiku-4-5** (default bucket) | Story tab "Create With AI" / direction popup | concept settings, ingredients, snippets, TV episode ctx + arcs digest | `storyDrafts[].beats` (feature) / episode beats (TV) |
| Single beat | `generate_beat`, `rewrite_beat` (~702, ~608) | Haiku | beat card actions | beats list | one beat |
| Scene prose | `generate_scene` (~619) | **claude-opus-4-5** | per-beat "Write scene" + `lib/scriptLoop.ts` loop (payload `{beatIndex}`) | beat + cast (`characterIds`) + linked snippets (`momentIds`) + per-beat dials | `beat.sceneContent`, `status:"written"`, Script layer scenes |
| Full script | `syncPrompt_toScript` (concept/characters/story sources, ~1690) | Opus | "Update Other Layers → Script", easyMode step 4 alternative | bible + prior prose + beat sheet | entire Script draft (one JSON, all scenes) |
| (Adjacent, already passed in earlier work: `tv_import_pilot`; excluded: orchestrator control flow in `syncLayer.ts`/`easyMode.ts`/`scriptLoop.ts`) |

All calls flow through `app/api/generate/route.ts` (stream, caps:
generate_beats 4K / sync-to-script 32K / generate_scene 4K).

## 5. How bible/reference material enters each step

`buildPrompt` = brain (format-aware) → writer-profile block → locked
style-profile block (script-prose actions) → **story bible** → ask.
The bible renders: concept fields, settings (references one line,
writer voices one line, dials), characters (one line each), beats,
ingredients, snippets. The asks re-state task-relevant material
(scene: cast + linked moments + dials; script-sync: voice targets;
concept asks: influencesBlock from P1).

## 6. Where fidelity can break (ranked)

1. **`Character.relationships` is never rendered — anywhere.** The
   data model stores `relationships: { characterId, description }[]`;
   grep confirms no prompt builder reads it. The bible's character
   line renders want/need/flaws/voice/arc/backstory but NOT
   relationships; the scene cast block renders archetype/want/voice
   only. The model infers relationships from summary prose — this is
   the exact mechanism behind the Phase-3 "his creditor's daughter"
   garble, now found at the source. **Highest-value fidelity fix in
   the repo, and it's ~10 lines.**
2. No prose ask contains any fidelity instruction ("names, ages,
   relationships, established facts must match the bible") — nothing
   tells the model that bible facts are constraints rather than
   inspiration.
3. `generate_scene`'s fallback when `characterIds` is empty: cast
   block absent, model picks characters freely from the bible.
4. Long-source truncation (`scriptProseBlock` 12K cap) can silently
   drop late scenes from cohesion context. (Accept; note only.)

## 7. Where user intent can be lost

- Beat `purpose` is optional downstream: `generate_scene` includes it
  only if set, and nothing instructs the model that purpose is a
  CONTRACT (the scene must accomplish it). Scene-intent drift is
  unguarded.
- Per-beat dials (twist/weirdness) are explained in the scene ask but
  with no strength language (nothing says they OVERRIDE genre
  defaults; easy to flatten).
- Linked snippets: scene ask says "weave them in, do not drop" —
  good; script-sync says linked ideas MUST appear — good. Beats ask
  only says "weave in at least one snippet where it fits" — weaker.
- `direction` free-text reaches beats via `directionBlock` — good —
  but not the scene ask (a scene regenerated after direction was set
  never sees it). Note; low priority (direction is beat-scoped by
  design).

## 8. Where quality is under-specified

- **`generate_beats` (feature path) has almost no craft.** Its entire
  quality guidance: "use ingredients, weave a snippet, match dials,
  respect ending types." No causality requirement (nothing prevents
  "and then" lists), no escalation rule, no final-beat bar (TV gets
  the momentum rule; features get nothing), no purpose-quality spec,
  no anti-generic rule for names/summaries.
- **`generate_scene` lacks the craft rules its sibling has.** The
  tv_import_pilot ask (written later) requires: decision-or-
  revelation per scene, cold-open energy, no "we see", present-tense
  sensory action, distinct dialogue rhythms. `generate_scene` — the
  everyday path — has NONE of these. It also specifies no length
  target ("screenplay-adjacent format" only; script-sync says 100–400
  words; drift guaranteed).
- **`syncPrompt_toScript` treats scenes as independent units.** No
  compounding rule (each scene should raise the price of the next),
  no voice-distinctness, no subtext instruction, no anti-generic
  prose rules.

## 9. Where output gets generic

Root causes, per surface: beats — no causality/escalation contract +
Haiku doing structural work; scenes — no subtext/decision rules, no
anti-generic-prose classes (expect "a beat of silence", "something
shifts", trailing "neither of them speaks" endings); script — same
plus voice homogenization across characters (nothing demands distinct
rhythms). The P2 lesson applies: ban CLASSES with contrast pairs, not
word lists.

## 10. Where costs can increase

- `sync_*_to_script` = one 32K-capped Opus call (~$0.19–0.60 real).
  `scriptLoop` = one Opus call per beat (~$0.07–0.10 each; 22-beat
  feature ≈ $2). No pre-run cost preview (Phase-1 audit risk, still
  open — out of scope here, in NEXT_STEPS).
- Prompt-pass side effect: richer asks add ~200–400 tokens per call —
  cents on Opus, negligible on Haiku; quantified in the cost report.
- Routing flag: `generate_beats` on Haiku is the cheapest structural
  choice; if the live gauntlet shows structure failing WITH a strong
  prompt, the fix is Sonnet (~4×: still <$0.01/beat-sheet) — decision
  deferred to evidence, not changed now.

## 11. Safest to improve (this campaign's scope)

1. Render `relationships` in the bible character lines + scene cast
   block (pure prompt-side; data already exists).
2. A shared `BIBLE_FIDELITY_RULES` block injected into beats / scene /
   script asks.
3. Craft passes on the three asks (failure classes + contrastive
   pairs, per the P2/P3 method): causality+escalation+final-beat bar
   for beats; decision-or-revelation, subtext, voice-distinctness,
   length target, anti-generic classes for scene + script; scene-
   intent contract (purpose = contract; dials override defaults).
4. Rubrics + fixtures + harness extension (pure evaluation machinery).

## 12. Risky — do NOT touch in this campaign

Orchestrator control flow (`syncLayer`, `easyMode`, `scriptLoop`) ·
model routing (flag + evidence only) · `extractJson` · output-token
caps · TV import asks (already have scene rules; separate pass) ·
`rewrite_highlighted_range` (user-triggered rewrite semantics deserve
their own pass) · UI · images · Style Lab · storage/DB.
