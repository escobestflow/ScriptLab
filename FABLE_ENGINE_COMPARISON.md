# FABLE_ENGINE_COMPARISON — before vs after

All numbers and text below come from the committed snapshots
(`fixtures/engine/snapshots/{before,after}/`), captured with the same
tooling against the same fixtures at $0 API cost. To re-verify:
`diff -r fixtures/engine/snapshots/before fixtures/engine/snapshots/after`.

## Input-size deltas (est tokens, chars/4)

| Prompt | Model | Before | After | Δ |
|---|---|---:|---:|---|
| fresh-feature · logline | haiku | 1,496 | 928 | **−38%** — TV rules dropped, even with the richer ask |
| fresh-feature · summary | haiku | 1,495 | 908 | −39% |
| developed-feature · logline | haiku | 2,250 | 1,833 | −19% (brain drop − ask growth − influences) |
| developed-feature · beats | haiku | 2,284 | 1,538 | −33% (pure brain drop; beats ask untouched) |
| developed-feature · story→script | **opus** | 2,478 | 1,732 | **−30% on the expensive model** |
| tv-ongoing · logline | haiku | 1,949 | 2,199 | +13% — intended: TV brain unchanged, ask + influences added |

Quality was the goal; the feature-side token drop is a side effect of
removing instructions that could never apply.

## What the model no longer sees (features/shorts)

Before, every feature call's system prompt included the full TV
module — "# TV series types … obey it absolutely", five series-type
definitions, and the five-rule episode-momentum principle — ~25 lines
of imperative instructions that cannot apply to a feature. After:
gone. The brain also now introduces itself as **Unfold** (was
"ScriptWriter", the app's dead name). TV projects receive the exact
same TV text as before, moved verbatim.

## The logline ask — full before/after (developed-feature fixture)

**BEFORE (the entire user message, 3 lines):**

> Write ONE logline for this project in 1–2 sentences, max 40 words.
> Use the existing concept (format, genre, title, summary, tone, themes, ending) above as the brief. A great logline contains: protagonist, inciting event, goal, central conflict, and stakes. Specificity beats abstraction. No adjective-stuffing.
>
> Return STRICT JSON: { "logline": string }

**AFTER (the entire user message):**

> Write ONE logline for this project in 1–2 sentences, max 40 words.
>
> Ground it in everything above — title, genre, concept, characters, and any influences below. A logline is the story's ENGINE stated as a proposition: a specific protagonist + the destabilizing event + what they must do + what makes that hard + what it costs if they fail.
>
> Craft bar:
> - SPECIFIC protagonist with a defining trait or contradiction — "a washed-up rodeo fixer", never "a man".
> - Build in irony or a trap: the strongest loglines make the goal and the obstacle feed each other (getting what they want costs what they need).
> - Active voice, present tense. The protagonist DOES something; things don't merely happen to them.
> - Concrete nouns from this story's world. Zero adjective-stuffing.
> - Kill list: "must learn to…", "discovers the true meaning of…", "will stop at nothing", "everything changes", "a race against time", "dark secret" — any phrase you have read on a thousand posters.
> - The reader should feel the genre without it being named.
>
> Influences the writer chose — let them genuinely shape the result:
> - References to echo: "Breaking Bad" — borrow its pacing, grit; "Hell or High Water" — borrow its tone, setting. Let these shape the flavor; do NOT copy their plots or name them in the output.
> - Writer voices to study (their craft, not pastiche): Taylor Sheridan.
> - Vibe: sun-rotted americana, quiet menace.
> - The writer's own words on tone: "dark humor under everything — find the funny in the bleak, never goofy".
> - Dials the writer moved on purpose: unpredictability 7/10 — subvert the expected version · darkness 7/10 · pace 6/10.
>
> Return STRICT JSON: { "logline": string }

The before-version's only reference signal was one line buried
mid-bible ("References (titles to mirror…)"). The after-version puts
the writer's choices immediately adjacent to the task with explicit
usage instructions — the same recency-weighting pattern the script
sync prompt has always used.

On a **fresh default project**, the influences block renders nothing:
zero added noise where there's zero signal.

## What did NOT change

- STRICT JSON output contracts (all six keys byte-identical).
- Model routing, output caps, streaming protocol, cost logging.
- All structural asks (beats, characters, syncs, TV import, episodes).
- TV brain content. Style Lab / writer-profile blocks. Image paths.

## Judging output quality (requires one live call each, by design)

Prompt-side improvements are verified above at $0. Output-side
judgment needs generation: run the single live test in
`FABLE_ENGINE_TEST_PLAN.md` Layer 4 once on `main` and once on this
branch (or just once post-merge, judged against the rubric). The
rubric: specific protagonist with a contradiction · irony/trap ·
concrete world-nouns · zero kill-list phrases · reference texture
without name-dropping · reads authored, not templated.
