# FABLE_ENGINE_COST_SAFETY

## Spend during this branch's development: $0

Every change was designed, implemented, and verified through dry-run
prompt previews and build checks. No Anthropic call, no OpenAI call,
no image generation was made by this work.

## New cost-safety mechanisms (this branch)

1. **Dry-run mode** — `POST /api/generate` with `dryRun: true` returns
   the fully-assembled prompt, routed model, output cap, and a labeled
   cost estimate without contacting Anthropic. This is the default way
   to iterate on any prompt from now on.
2. **Live-call kill switch** — `UNFOLD_AI_LIVE=false` (env) makes the
   endpoint refuse live text generation with a clear 503 while dry-run
   keeps working. Unset = behavior unchanged. Set it on a Vercel
   preview environment to make an entire deployment spend-proof.
3. **Key-less operation** — the Anthropic client is lazily constructed,
   so a zero-secret local checkout can run the full preview pipeline
   (`npm run dev` + `scripts/engine-preview.mjs`). No secrets ever
   need to exist locally, which also honors the repo rule that local
   shells never hold real keys.
4. **Fixtures + snapshot script** — the regression harness runs the
   entire prompt surface at $0; committed snapshots make regressions
   diffable in review rather than discoverable in billing.

## Pre-existing controls (verified intact, none weakened)

- **Image generation**: auto-gen pref is default **OFF**; DALL·E 3 is
  the server default; `gpt-image-2` requires an explicit client
  opt-in; `imageGenAttempted` stamps block refresh double-spend.
  **No image code was touched by this branch.**
- **Three-tier model routing** (Opus only for screenplay prose;
  Sonnet structure; Haiku default) — unchanged.
- **Prompt caching** — brain/profile/bible blocks cached (~10% re-bill
  within TTL) — unchanged; the feature-brain variant is smaller now.
- **Output caps** — 4K / 8K / 32K tiers — unchanged.
- **TV-import admin test mode** — 1-of-each smoke test — unchanged.
- **usage_log + /admin/usage** — every live call still logged with
  cost — unchanged.

## Cost effect of the quality changes themselves

Feature/short prompts shrank 19–39% est input tokens (see
FABLE_ENGINE_COMPARISON.md); the story→script Opus call dropped ~30%.
TV concept asks grew ~13% (richer craft + influences) — pennies at
Haiku pricing, and deliberate.

## The expensive paths to stay conscious of (unchanged, documented)

- `lib/scriptLoop.ts`: one **Opus** call per unwritten beat,
  sequential — a 22-beat feature ≈ $3–6 per full run.
- `lib/easyMode.ts`: 3 sync calls + the full script loop from one tap.
- TV import: 4 Sonnet + 1 Opus chained.
These are product features working as designed; adding a pre-run cost
preview for them is in NEXT_STEPS, not silently changed here.

## Rules of engagement going forward

- Iterate on prompts via dry-run only; a live call needs a reason.
- One live validation call is a decision, not a loop — see
  FABLE_ENGINE_TEST_PLAN.md Layer 4 (~$0.005 on Haiku).
- Image generation stays off unless explicitly enabled by the user.
- Never introduce an unbounded generate-evaluate-regenerate loop
  against paid APIs.
