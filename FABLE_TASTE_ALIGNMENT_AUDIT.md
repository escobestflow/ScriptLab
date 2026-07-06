# FABLE_TASTE_ALIGNMENT_AUDIT

Trigger: a live character-generation pass replaced a concept's central
edgy subplot (adult consciousness in a fourteen-year-old body,
impossibly mature rapport with a young teacher he once had a crush on
— intentionally uncomfortable dark comedy) with a safe, conventional
fourteen-year-old peer love interest. The user's taste was sanitized.

## 1. Where prompts encourage safe substitutions

**Nowhere explicitly — that's the finding.** Grep confirms no
"appropriate/safe/wholesome" steering exists in any ask. The cause is
an instruction VACUUM: `sync_concept_to_characters` says "invent a
small but specific cast that would power this concept";
`generate_character` says "fill a clear narrative gap." Nothing says
the premise's uncomfortable elements are deliberate and must survive.
Models default-sanitize morally awkward material when given no signal
that the awkwardness is the point — the engine inherited that default
unchallenged.

## 2. Where user taste is currently represented

- Project dials (`darkness`/`unpredictability`) + free-text notes →
  one bible line each; never framed as instructions to character gen.
- `influencesBlock` (references/voices/vibe/notes/moved dials) →
  **concept asks only** (logline/title/summary/tone/themes/tagline).
- **Style Lab locked profile** (the user's strongest taste artifact —
  dark humor, unpredictability, "never goofy") → injected only into
  `STYLE_PROFILE_ACTIONS`: script prose + concept prose. **Character
  generation and beats never see it.**
- WriterProfile (passive) → all asks when meaningful, but carries
  genre/metric signals, not edge intent.

## 3. Do "avoid / must-preserve / edge / taste" instructions reach character generation?

**No.** Zero edge-preservation language exists anywhere in the
pipeline — not in `SYSTEM_BRAIN`, not in any ask, not in the fidelity
rules (which protect FACTS, not INTENT). The gauntlet's
`BIBLE_FIDELITY_RULES` would preserve the teacher's name if she
existed in the character list — but nothing preserves her existence
when a layer is generated from concept.

## 4. Does the app distinguish responsible handling from sanitization?

**No — the distinction exists nowhere in the codebase.** With no
guidance, the model conflates "handle responsibly" with "replace with
something safe." These are opposite failures: sanitization removes
the user's story; irresponsible handling mistreats it. The correct
target is a dual gate — keep the element, AND handle it as exactly as
fraught as it is (discomfort, boundaries, social danger, consequence,
dark comedy; never eroticization, never romance-normalization of an
adult/minor dynamic).

## 5. Do taste settings exist and are they used?

They exist at both levels (project: dials/notes/references;
account: Style Lab + WriterProfile) and are genuinely used — but
none encodes edge-preservation, and the strongest channel (Style Lab)
skips the exact surfaces where the sanitization occurred. Coverage
gap, not absence.

## Smallest useful fix (implemented on this branch)

1. One universal principle in `BRAIN_CORE` (premise sovereignty).
2. A shared `EDGE_PRESERVATION_RULES` block — the dual gate,
   verbatim-injectable — added to the six content-creating asks:
   `sync_*_to_characters`, `generate_character`,
   `tv_import_characters`, `generate_beats`, `generate_scene`,
   `syncPrompt_toScript`.
3. Fixture: the Y2Kid time-slip comedy gains its teacher subplot
   (stated as central in the summary, with NO handling instructions —
   supplying those is the engine's job now).
4. Live verification that character generation preserves the teacher
   as ethically uncomfortable dark comedy, and that beats carry the
   thread with consequence framing.

Out of scope (flagged): adding character/beats surfaces to
`STYLE_PROFILE_ACTIONS`; rendering dials as instructions in character
asks; both are follow-ups if the shared block proves insufficient.
