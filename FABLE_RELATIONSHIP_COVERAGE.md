# FABLE_RELATIONSHIP_COVERAGE

Closes gauntlet finding **F2** (FABLE_GAUNTLET_NEXT_STEPS.md #2): the
"Relationships (FIXED FACTS)" render added in the gauntlet only
protects casts whose `relationships[]` is populated — and almost no
real project had data there. TV import hard-coded `relationships: []`,
and nothing backfilled existing projects. This pass makes the data
exist.

Branch: `fable-relationship-coverage` (off taste-alignment main
`100e404`). **Unmerged — awaiting user approval.**

## What changed

1. **`tv_import_characters` emits relationships** — schema addition in
   `lib/contextBuilder.ts` (per-character `relationships: [{ with:
   name, description }]`, ≤4 rows, extraction-precision rules: exact
   kinship wording, both directions for asymmetric bonds, empty over
   invented). `applyTVImportCharactersResult` (`lib/syncLayer.ts`) now
   resolves names → ids in a second pass after every character has an
   id.
2. **`derive_relationships` action** (new, Haiku tier, default 4k
   output cap) — reads the existing bible and emits the structural
   bonds as `{ character, with, description }` rows. For projects that
   predate #1. Prompt case in `contextBuilder.ts`; ActionType +
   routing comment in `prompt.ts`.
3. **Shared resolver** — `resolveRelationshipNames()` exported from
   `lib/syncLayer.ts`: lowercased name→id resolution; drops
   unresolvable names (e.g. a dead off-roster father), self-refs,
   duplicate targets, empty descriptions, bad shapes.
4. **Client path** — "Link Relationships" chip on the Characters tab
   (`components/Studio.tsx`, both v2 desktop action row and mobile
   bar), shown only when ≥2 named characters exist and someone's
   `relationships[]` is empty. **Fill-only:** characters that already
   have relationships (user-authored or imported) are never
   overwritten.
5. **Snapshot matrix** — two new rows in `scripts/engine-preview.mjs`:
   `tv-ongoing × tv_import_characters`,
   `developed-feature × derive_relationships`. Baseline set committed
   at `fixtures/engine/snapshots/relationship-coverage`.
6. **Fixture twin** — `fixtures/engine/developed-feature-rel.json`:
   Buck Mark with the live-derived relationships resolved to ids. The
   original `developed-feature.json` stays relationship-empty on
   purpose so both states remain testable.

## Evidence (live, 2026-07-05, total $0.1674)

| Call | Model | Cost | Result |
|---|---|---|---|
| `developed-feature × derive_relationships` | Haiku | $0.0035 | 5 rows, all grounded in fixture text ("forty grand", "weekend", chaperone) — zero invention; both directions on debtor/creditor; **Lena = "Target's daughter"**, never Coyle's kin |
| `developed-feature-rel × generate_scene` beat 4 "Lena's Price" | Opus | $0.1013 | **Parentage wobble dead**: Lena consistently Harlan's daughter ("my daddy's yard"), Coyle "the one suing my dad"; full leverage web reproduced; leverage-reversal on screen; known F3 markdown artifacts persist (separate item) |
| `tv-ongoing × tv_import_characters` | Sonnet | $0.0626 | New schema honored: per-character relationships with sided descriptions ("resents his decade of absence" vs "craves his approval"); included an off-roster name (dead father) — exactly what the resolver drops |

$0 checks:
- Dry-run snapshot diff vs `taste-alignment` baseline: all 17
  pre-existing surfaces **byte-identical** — zero prompt drift. In
  particular `relationship-trap` prompts are unchanged, so its
  gauntlet score cannot regress from this pass (no live re-spend —
  stop-rule discipline).
- Dry-run on the fixture twin confirmed all three cast members render
  "Relationships (FIXED FACTS)" lines into the scene prompt.
- `resolveRelationshipNames` unit-exercised via tsx against the live
  Sonnet output shape: unresolvable/self/duplicate/empty/malformed
  rows all dropped, valid row kept (PASS).
- `npx next build` clean.

## Residuals / caveats

- Single live sample per surface (program-wide known limitation).
- The "Link Relationships" chip compiles but hasn't been visually
  verified in a browser (needs an authed session with a real cast) —
  check placement before merge, especially mobile bar crowding
  (two chips now render in the mobile right slot where the design
  comment prefers one).
- `sync_concept_to_characters` (feature-side cast generation) still
  doesn't emit relationships — the derive action covers those
  projects post-hoc; folding the schema into that ask is a natural
  follow-up.
- F3 (markdown artifacts in Opus scene prose) reconfirmed in the Buck
  Mark run — still open, see NEXT_STEPS #4.
