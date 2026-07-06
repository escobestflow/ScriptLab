# FABLE_ARCS_DOWNSTREAM_CHECK

Phase E of the Arcs quality pass: arcs only matter if they improve
EPISODE generation. Method: apply the live "after" arc set to
`tv-prestige` through the real helpers (→ `tv-prestige-arcs.json`),
inspect the actual episode digests at $0, then one live
`generate_episode` ($0.0581) to prove the model executes them.

## The seven checks

1. **Are dominant arcs clear?** ✅ Digest ranks by intensity with
   explicit tiers — EP4 leads with `[DOMINANT, intensity 10/10]
   Dray's Page`; EP1 correctly has NO dominants (setup hour).
2. **Are background arcs restrained?** ✅ Below-threshold arcs (<4)
   don't appear at all; the mystery arc is absent from EP1's digest
   (intensity 3). NEW: when the writer's plan overstacks an episode,
   the previously-dropped `overloaded` flag now renders a triage
   instruction ("give the DOMINANT arcs the scenes… depth over
   coverage") — verified firing on EP4/EP6.
3. **Are hard moments treated as required?** ✅ Rendered under "MUST
   land in the beats/scenes you write" — and in the live episode run,
   **all five** EP1-anchored moments landed as actual beats, several
   near-verbatim (the red water-line mark opens beat 1; "Jolene takes
   it from his hands and walks out without a word" closes beat 2).
4. **Are character arcs tied to behavior?** ✅ Arc notes now carry
   acts, not adjectives — Clay's digest entry names the abstention
   strategy, the EP4 forced verification, the first signature, the
   EP7 audit burial. The generated episode staged the EP1 end of
   exactly that ladder ("He chooses nothing" as an explicit paralysis
   beat).
5. **Are relationship arcs preserved?** ✅ "Jolene ↔ Wade: The
   Ex-Marriage" flows through with pair, starting contract, reprice
   event, end state; the type modifier ("a scene between the named
   characters should measurably shift their dynamic") finally has
   named characters to bind to. The live episode gave them the
   fence-line scene.
6. **Does the digest avoid generic story instructions?** ✅ Every arc
   note is mechanics in this story's nouns (pages, ciphers, feed
   credit, water line). Nothing in the EP1/EP4/EP6 digests could be
   pasted into another show.
7. **Does it tell the model what must happen in the episode?** ✅
   EP4's digest is effectively a build sheet: the forged page, the
   cipher trade, the audit's beginning — each as a must, plus the
   collision the arcs designed for that hour.

## The find (and fix)

The live episode run surfaced one real leak: the model **pre-empted
a later reveal** — Jolene's ledger authorship is anchored as the EP4
first reveal, but EP1's generated final beat showed it outright
("a page in her own handwriting… the audience realizes"). Cause: the
season-level bible carries every arc's full ladder, and nothing said
"don't cash later reveals early." Fix: `renderSeasonArcs` now states
hard moments must not be PRE-EMPTED (foreshadow allowed; the reveal
itself is locked to its anchored episode). Captured in the committed
`tv-prestige-arcs__generate_episode` snapshot.

## Cost note

Arc-carrying episode prompts are heavier (~10k input tokens on the
downstream fixture, most in the cached bible; the per-episode digest
adds ~2k uncached). ≈$0.005–0.01 per episode call on Sonnet —
accepted: the digest is doing the steering work the layer exists for.

## Verdict

The improved arcs measurably change episode generation: hard moments
become beats, dominant arcs own the hour, relationship scenes are
named requirements, and the digest reads as a per-episode build sheet
instead of a mood board. With the pre-emption rule in place, the
remaining risk is the advisory heat budget (see TEST_RESULTS residual
1).
