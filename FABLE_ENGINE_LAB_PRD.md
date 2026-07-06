# FABLE_ENGINE_LAB_PRD

What the Engine Lab is, exactly what the MVP builds, and what is
deliberately deferred. Companion: `FABLE_ENGINE_LAB_AUDIT.md` (current
state + risks). Branch `fable-engine-lab`, no deploy without approval.

## 1. Product statement

A private, admin-only control room for Unfold's creative engine: a
place to (a) author the account-level taste profile and per-project
guardrails the engine will honor, (b) see exactly what any generation
would send (blocks, model, cost) before it costs anything, (c) run
controlled, logged, capped tests against the real engine paths, and
(d) understand how the engine's prompts have changed over time.

**Non-goals:** no main-app redesign; no new generation capabilities;
no separate prompt system (the Lab reads/writes the REAL
`buildPrompt`/`storyBible`/`modelForAction` paths); no image/video
generation from the Lab, ever.

## 2. Data model

```ts
// lib/engineLab.ts
export interface TasteProfile {
  /** Chosen principle ids from TASTE_PRINCIPLES + free-text customs. */
  principles: string[];
  /** Free-text elaboration, the user's own words. */
  notes: string;
  updatedAt: string;
  /** Bumped on every save — cheap provenance for run logs. */
  version: number;
}

export interface ProjectGuardrails {
  mustPreserve?: string;      // "Must preserve" — elements that may never be sanitized away
  avoid?: string;             // "Avoid" — clichés, shapes, content to steer around
  doNotTurnInto?: string;     // "Do not turn this into…" — known failure substitutions
  toneGuardrails?: string;    // register boundaries
  edgeNotes?: string;         // why the discomfort is deliberate + how to handle it
  sensitiveHandling?: string; // premise-specific responsible-handling notes
  uniqueness?: string;        // what makes this project one-of-a-kind
  referencePriorities?: string; // which references outrank which, and for what
}
```

- `WriterProfile.tasteProfile?: TasteProfile | null` — persists via the
  existing writer_profiles round-trip; ships in the `profile` request
  param prompts already read (same ride as `styleProfile`).
- `Story.guardrails?: ProjectGuardrails` — travels inside the project
  JSON; normalizer passes it through.
- `StorySettings.humor?: number` (0–10, optional) — the ONE new dial;
  renders only when set.

TASTE_PRINCIPLES (curated ids, each with a prompt line — the user's
standing taste, aligned with handoff §14):
`edgy-grounded`, `darkly-funny`, `morally-awkward`, `unexpected`,
`not-sanitized`, `emotionally-messy`, `specific-over-generic`,
`preserve-discomfort-responsibly`, `no-safe-substitutions`.
Free-text customs allowed; hard lines (never eroticize minors, etc.)
are NOT taste options — they stay unconditionally in
`EDGE_PRESERVATION_RULES`.

## 3. Prompt integration (the only engine-path edits)

1. `buildPrompt`: after the writer-profile block, push a cached
   `# TASTE PROFILE (account-level, binding)` system block iff
   `profile?.tasteProfile` has ≥1 principle or non-empty notes.
   Vocabulary matches the craft contracts ("sanitization",
   "safe conventional substitute") so the blocks reinforce.
2. `storyBible()`: render `## Project guardrails (BINDING)` after the
   Settings section iff any guardrail field is non-empty. Bible
   placement means every action sees them and
   `BIBLE_FIDELITY_RULES`' "bible facts are binding" already applies.
3. `storyBible()` Settings: `- Humor: N/10` line iff `settings.humor`
   is set.

Absent data ⇒ byte-identical prompts (the regression gate).

## 4. The Lab (`/engine-lab`, admin-gated)

Single page, five panels (tabs). Server pieces:
`/api/engine-lab/fixtures` (GET list / GET one, admin-gated via
`x-user-email` + `isAdmin` — same pattern as `/api/admin/*`).

1. **Taste** — principle chips + notes editor; saves to
   `profile.tasteProfile` via the existing writer-profile store; shows
   the exact rendered prompt block (live preview of
   `renderTasteForPrompt`).
2. **Guardrails** — pick one of MY projects (loaded via existing
   storage list) or a fixture (read-only for fixtures); edit the 8
   fields; save writes `story.guardrails` through the normal save
   path; shows the rendered bible section.
3. **Preview** — pick fixture (or a project) × action (logline, beats,
   scene+beatIndex, characters-sync, derive_relationships,
   script-sync) → POST `/api/generate` `dryRun:true` with the current
   taste profile → renders: routed model, maxTokens, est input tokens
   + cost, every system block with cache badge, user message, and an
   **inclusion checklist** (detected by marker strings): relationships
   FIXED FACTS present? taste block present? guardrails present?
   references present? style profile present? DRY-RUN badge always
   visible.
4. **Test Runner** — same picker + a rubric panel (embedded criteria
   from the four committed rubrics). Flow: run dry-run (always
   available, $0) → optionally run LIVE: requires (a) typing `LIVE`
   into a confirm field, (b) a session cost cap (default $0.50) — the
   runner refuses to fire when `spent + estimate > cap`, tracks actual
   cost from the route's usage report, and hard-stops the session at
   the cap. Every run (dry or live) appends to the run log
   (localStorage `ws:engine-lab:runs`): timestamp, fixture, action,
   dry/live, model, cost, output text, rubric scores, pass/fail,
   notes. Export/import JSON.
5. **History** — renders `fixtures/engine/PROMPT_VERSIONS.json` (the
   era manifest: name, date, commit, summary, snapshot dir, docs) +
   the run log grouped by fixture×action so score movement over time
   is visible (regression tracking). Comparison view: select two runs
   → side-by-side prompt/user-message/output/scores/notes.

## 5. Safety invariants

- The Lab NEVER calls `/api/generate-*-image` or any TTS/video path.
- Dry-run is the default; a live call requires the typed confirm AND
  headroom under the session cap; caps are enforced client-side and
  every live call is visible in the run log (plus the route's own
  server-side cost logging, unchanged).
- The Lab makes no writes outside: writer profile (taste), the
  selected project's `guardrails`, and its own localStorage log.
- Non-admin access: page renders a flat "not authorized" state; API
  routes 403.

## 6. MVP acceptance (Phase B definition of done)

- Taste editable + persisted + visibly injected in Preview.
- Guardrails editable on a real project + visibly injected.
- Preview works for logline, beats, scene, characters-sync,
  derive_relationships, script-sync on all fixtures.
- Runner: dry-run + rubric scoring + log for logline/beats/scene at
  minimum; live path gated + capped.
- History panel shows the era manifest incl. this build.
- All existing snapshots byte-identical; build green.

## 7. Deferred (explicitly not in MVP)

AI-judge scoring (gauntlet NEXT_STEPS #9) · Supabase run-history table
(localStorage + export suffices for one admin) · guardrails editing in
the main app UI · additional dials (dialogue naturalism, structural
strictness, rewrite aggressiveness, creativity, specificity,
anti-generic/anti-sanitization sliders — the last two stay BINDING
CONTRACTS, not user-weakenable dials, by design) · per-action dial
overrides · prompt A/B tournaments · snapshot-dir visual differ ·
Style-Lab composition run (NEXT_STEPS #10) · cost preview in main-app
scriptLoop/easyMode (NEXT_STEPS #6 — separate task).

## 8. Live-test budget

Cap $3.00 (user-authorized). Plan ≤ 4 calls ≈ $0.13–0.25 (see audit
§8). Every call via `scripts/engine-lab-live.mjs` (one-shot, logged)
or the Lab runner itself; all spends recorded in
`FABLE_ENGINE_LAB_COST_REPORT.md`.
