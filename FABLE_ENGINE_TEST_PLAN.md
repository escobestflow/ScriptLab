# FABLE_ENGINE_TEST_PLAN

Layered, cheapest-first. Layers 1–3 cost $0 and cover everything this
branch changed. Layer 4 is one deliberate live call.

## Layer 1 — Build gate ($0)

```bash
npx next build
```
Full type-check. Passed at every checkpoint commit.

## Layer 2 — Prompt preview / snapshot diff ($0)

The core harness. No secrets required (the lazy client + dry-run make
the endpoint fully functional key-less).

```bash
# terminal 1
npm run dev

# terminal 2 — regenerate current snapshots
node scripts/engine-preview.mjs fixtures/engine/snapshots/current

# compare against the committed baselines
diff -r fixtures/engine/snapshots/after fixtures/engine/snapshots/current
```

If the local env's beta allowlist differs, prefix with
`EMAIL=<allowlisted email>`. Point at another environment with
`BASE=https://…`.

**What to check in a snapshot (`.txt` files are human-readable):**
1. Feature/short prompts contain NO "# TV series types" section;
   TV prompts DO.
2. Brain opens "You are Unfold".
3. A project with references/vibe/notes/moved dials shows the
   "Influences the writer chose" block in concept asks; a fresh
   default project shows none.
4. Every concept ask still ends with its exact
   `Return STRICT JSON: { … }` line.
5. Model routing unchanged (`model` field per action).

## Layer 3 — Fixture assertions ($0, manual for now)

The three fixtures encode the important cases: zero-signal fresh
feature, fully-developed feature (references + dials + cast + beats),
ongoing TV. Adding a case = add a fixture + a MATRIX row in
`scripts/engine-preview.mjs`. (Automated snapshot-diff CI is a next
step, not built here.)

## Layer 4 — One intentional live test (~$0.005, cheap model)

Only after Layers 1–3 pass, and only deliberately:

```bash
curl -sS -X POST https://<deploy-url>/api/generate \
  -H 'Content-Type: application/json' \
  -H 'x-user-email: <allowlisted email>' \
  --data "$(node -e 'const fs=require("fs");process.stdout.write(JSON.stringify({story:JSON.parse(fs.readFileSync("fixtures/engine/developed-feature.json")),action:{type:"generate_concept_logline",payload:{}},profile:null}))')"
```

One Haiku call (~1.8K input / ~50 output tokens ≈ half a cent).
Evaluate the streamed logline against the rubric below. Do NOT loop
this; one call answers the question.

**Rubric (from the handoff + PRINCIPLES.md):** specific protagonist
with a contradiction · irony/trap in the conflict · concrete nouns
from the story's world · no kill-list phrases · reference texture
present without naming titles · reads authored, not templated.

## Rollback verification

```bash
git diff --stat pre-fable-engine-backup..fable-engine-quality-tuning
git checkout main   # prod state, untouched
```

## Explicitly NOT tested (unchanged surfaces)

Image generation (no code touched, default-off preserved), TTS,
Style Lab flows, TV import pipeline, autosave/storage — all outside
this branch's blast radius.
