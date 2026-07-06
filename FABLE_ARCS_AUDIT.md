# FABLE_ARCS_AUDIT

Phase A of the Arcs quality pass (branch `fable-arcs-quality`).
Rubric: `FABLE_ARCS_RUBRIC.md`. Results: `FABLE_ARCS_TEST_RESULTS.md`.
Downstream: `FABLE_ARCS_DOWNSTREAM_CHECK.md`.

## 1. Files implementing the Arcs system

| File | Role |
|---|---|
| `lib/story.ts` | `Arc`, `ArcMoment`, `ArcsLayerDraft` types; `ARC_TYPES` (20), `ARC_TYPE_MODIFIERS`, `ARC_TYPE_LABELS`, `ARC_COLORS`; CRUD helpers (`addArcToActiveDraft`, `updateArcInActiveDraft`, …); `digestArcsForEpisode` + `formatArcDigest` (episode-level injection); `normalizeArcScoresToCount` |
| `lib/contextBuilder.ts` | `renderSeasonArcs` (season-level bible section); `tv_import_arcs` prompt; episode-scoped prompts embed the digest (`tvEpisodeContext` ~line 593, `generate_episode` ~line 1340) |
| `lib/syncLayer.ts` | `applyTVImportArcsResult` (parse + normalize the AI's arcs) |
| `components/Studio.tsx` | Arcs tab UI: `ArcGraph` SVG timeline, add/edit popup, character-popup arc editor (alt editor for character arcs) |

## 2. Arc data model

`Arc { id, type (20-value union), title, description, color, scores:
number[] (1–10 per episode), moments?: ArcMoment[] (position: fractional
episode; text or linked Moment id), characterId? (character-type only),
intensitySet? }`. Character arcs stay invisible to graph AND prompts
until `intensitySet` — by design, so scaffolds aren't treated as plans.

## 3. tv_import_arcs prompt + schema (the "before" state)

Schema: `{ type, title ("short, evocative"), description ("1-2
sentences"), scores (N ints 1-10), characterName (character type only) }`.
Rules: one main-plot; 1-2 subplots; 1 theme; mystery/world "if genre
supports"; 3-5 character arcs; score semantics one line ("1=quiet,
10=dominant"); honor series-type rules. **That's all.** No craft
contract of any kind: no mechanics requirement, no curve-shape rules,
no peak-stagger/collision logic, no anti-generic bans, no contrastive
teaching, no moments, no relationship-arc guidance, and the description
budget (1-2 sentences) is too small to hold machinery even if asked.

## 4. Manual arc creation flow

Fully manual — there is NO single-arc AI generation action (the only
AI path is the import pipeline's bulk step). Popup collects type,
title, description, scores row (forced at creation for non-character
arcs); first-ever arc is coerced to main-plot; character arcs are
also creatable from the character popup (default `intensitySet=false`).

## 5. Type system + per-type modifiers

20 types; each has ONE imperative (`ARC_TYPE_MODIFIERS`) injected at
episode level when the arc is active there (≥4). The modifiers are
good — direct and actionable ("A scene between the named characters
should measurably shift their dynamic"). But: `relationship` /
`love-romance` modifiers say "the named characters" while NOTHING in
the schema names them (no pair field; only prose description might).
Character arcs with unresolvable names keep type=character with no
characterId → modifier degrades to "the relevant character".

## 6. Season-level injection

`renderSeasonArcs` → "## Season arcs (HIGH PRIORITY)" in every TV
bible: per arc — title, type label, linked character, description,
full intensity strip (`EP1:3 EP2:5 …`), moments list; states hard
moments are NOT optional. Solid. Quality of what it carries is
entirely bounded by what generation put in `description`/`scores`.

## 7. Episode-level injection

`digestArcsForEpisode(story, [], idx)`: arcs scoring ≥4 at the
episode, capped at top-8 by intensity, ≥8 → DOMINANT tier; per-type
modifier with character name substituted; hard moments =
`floor(position) === idx`, rendered under "MUST land". Computes
`overloaded` (>8 arcs ≥6)… **which no caller reads** — not the UI,
not the prompts. Also the season-level `moments` and episode-level
digest both resolve linked Moments — but prompt call sites pass `[]`
as the user-moments pool, so ONLY inline-text moments reach prompts
(linked-idea diamonds render as "(empty moment)"). Second latent gap.

## 8. Intensity curve generation

One line of guidance ("show the arc's prominence"). Live "before"
sample (tv-prestige, $0.0298, full output in TEST_RESULTS): curves
are near-monotonic staircases — `3,4,5,6,7,8,9,10` appears literally;
6 of 10 arcs peak 9–10 at EP8; **10 arcs are ≥6 at EP8**, which trips
the engine's own overload threshold. Model default = "everything
ramps to the finale," which flattens episode identity (every episode
is "all arcs slightly more").

## 9. Moment generation

None. The schema has no moments field; `applyTVImportArcsResult`
stores none; diamonds exist only if the user clicks curves by hand.
The single strongest downstream lever ("MUST land in this episode")
is empty for every AI-generated season.

## 10. Character-arc ↔ character-data link

Import resolves `characterName` → id (exact, case-insensitive);
unresolvable → linked-character-less arc. A resolved characterId
force-coerces type to "character" (so the model can't emit e.g. a
moral-descent arc FOR a named character without it being re-typed —
minor but real expressiveness loss; not changed in this pass, noted).

## 11. What context reaches arc generation

Everything in the bible: concept (summary/tone/themes/seriesArc),
settings + dials, series-type structural rules, full cast INCLUDING
`Relationships (FIXED FACTS)` (since the gauntlet), project guardrails
(since engine-lab), episode list/beats if present; plus the taste
block (engine-lab) when the account has one; plus uploaded
scriptText/notes from the payload.

## 12. What context is missing

Nothing material is missing from the CONTEXT — the gap is the ASK:
the prompt never tells the model to USE relationships as arc raw
material, to stagger peaks, to anchor moments, or what a good arc
description contains.

## 13. Do taste profile / guardrails reach arc generation?

Yes, both (verified by dry-run marker check on tv-prestige /
tv-timeslip). Guardrails render in the bible; taste as its own block.
Again: present but unleveraged by the ask.

## 14. Does relationship data reach arc generation?

Yes — cast lines carry `Relationships (FIXED FACTS)` (verified). The
"before" live sample still produced ZERO relationship arcs on a
fixture deliberately built around loaded dyads (ex-marriage,
debtor/creditor-with-a-badge, sibling triangles) — because the
prompt's arc menu never mentions them.

## 15. Rubric?

None existed for arcs. Loglines/beats/scenes/script have gated
rubrics; arcs — the layer that STEERS episodes — had no definition of
good. Fixed in Phase B (`FABLE_ARCS_RUBRIC.md`).

## 16. Why the output felt weak (root causes, ranked)

1. **No craft contract in the ask.** "1-2 sentences, short evocative
   title" produces loglines-for-threads: theme statements ("refusing
   to choose is itself a choice"), inner-growth clichés ("learns that
   reform requires power"), zero mechanics — nothing an episode
   generator can EXECUTE.
2. **No curve grammar.** Nothing bans monotonic ramps or synchronized
   finale peaks, so the model produces both, erasing the very
   episode-to-episode differentiation the intensity system exists to
   create.
3. **No moments.** The digest's only hard, non-negotiable lever is
   never populated by generation.
4. **Relationship arcs structurally absent** from the menu despite a
   dedicated type + modifier + relationship data sitting in context.
5. **Theme arcs invited to be essays** ("include 1 thematic arc" with
   no carrier requirement).
6. **Overload signal computed then dropped** — the one guard against
   "everything peaks at once" never reaches the writer or the model.
7. Latent: linked-Moment diamonds render as "(empty moment)" in
   prompts (call sites pass an empty pool).

Fix surface chosen (Phase C): prompt + schema-lite (per-arc moments,
optional relationship pair naming) + normalization + digest overload
line. No UI change required by this audit.
