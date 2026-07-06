#!/usr/bin/env node
// Zero-cost prompt snapshots via /api/generate's dryRun mode.
//
// Captures the fully-assembled prompt (system blocks + user message +
// routed model + cost estimate) for a fixed matrix of fixture × action
// pairs, WITHOUT any Anthropic call. Run it before and after a prompt
// change and diff the outputs — that's the engine's regression harness.
//
// Usage:
//   npm run dev                                  # terminal 1 (no secrets needed)
//   node scripts/engine-preview.mjs <outdir>     # terminal 2
//   node scripts/engine-preview.mjs fixtures/engine/snapshots/after
//   diff -r fixtures/engine/snapshots/before fixtures/engine/snapshots/after
//
// Env: BASE=http://localhost:3000 (default) to point elsewhere.
// Cost: $0 — the endpoint returns before contacting Anthropic.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.argv[2] || "fixtures/engine/snapshots/current";
// The /api/generate beta gate checks x-user-email against
// NEXT_PUBLIC_ALLOWED_EMAILS (a client-shipped, non-secret allowlist).
// Override with EMAIL=you@example.com when running against an
// environment with a different allowlist.
const EMAIL = process.env.EMAIL || "luisfescobarjr@gmail.com";

// The capture matrix — representative, cheap, meaningful. Add rows as
// new prompt surfaces become interesting; keep names stable so diffs
// line up across runs.
const MATRIX = [
  { fixture: "fresh-feature", action: "generate_concept_logline" },
  { fixture: "fresh-feature", action: "generate_concept_summary" },
  { fixture: "developed-feature", action: "generate_concept_logline" },
  { fixture: "developed-feature", action: "generate_beats" },
  { fixture: "developed-feature", action: "sync_story_to_script" },
  { fixture: "tv-ongoing", action: "generate_concept_logline" },
  // Phase 2 — logline quality cases. backseat-roadtrip mirrors the
  // shape of the first real regression (strong container, abstract
  // realization ending); quiet-drama is the abstraction-danger case
  // (no external stakes to lean on); developed-feature (above) covers
  // genre/external stakes.
  { fixture: "backseat-roadtrip", action: "generate_concept_logline" },
  { fixture: "quiet-drama", action: "generate_concept_logline" },
  // Quality Gauntlet — beats → scene → script chain. Rows with a
  // `payload` exercise per-beat surfaces (generate_scene reads
  // payload.beatIndex). See FABLE_GAUNTLET_FIXTURES.md for what each
  // fixture traps.
  { fixture: "horror-comedy", action: "generate_beats" },
  { fixture: "reference-adjacency", action: "generate_beats" },
  { fixture: "anti-generic-trap", action: "generate_beats" },
  { fixture: "developed-feature", action: "generate_scene", payload: { beatIndex: 3 } },
  { fixture: "relationship-trap", action: "generate_scene", payload: { beatIndex: 1 } },
  { fixture: "scene-intent", action: "generate_scene", payload: { beatIndex: 1 } },
  { fixture: "relationship-trap", action: "sync_story_to_script" },
  // Logline v5 — imported-scaffolding trap (time-slip premise with NO
  // clock and NO return-mission in the material; the v4-era live
  // regression invented both).
  { fixture: "scaffolding-trap", action: "generate_concept_logline" },
  // Taste alignment — the same fixture's concept now carries an
  // intentionally uncomfortable teacher subplot (Ms. Vann). Character
  // generation must preserve her as edgy dark comedy, not swap in a
  // safe peer love interest.
  { fixture: "scaffolding-trap", action: "sync_concept_to_characters" },
  { fixture: "scaffolding-trap", action: "generate_beats" },
  // Relationship coverage (F2) — the TV-import character step now emits
  // relationships[] (schema addition), and derive_relationships
  // backfills existing projects. developed-feature is the fixture whose
  // empty relationships caused the Buck Mark parentage wobble.
  { fixture: "tv-ongoing", action: "tv_import_characters" },
  { fixture: "developed-feature", action: "derive_relationships" },
  // Engine Lab — project guardrails + humor dial render into the bible
  // (guardrails twin), and the account taste profile renders as its
  // own system block (profile file). Rows with a `profile` post that
  // WriterProfile fixture instead of null.
  { fixture: "scaffolding-trap-guardrails", action: "generate_concept_logline" },
  { fixture: "scaffolding-trap-guardrails", action: "generate_beats" },
  { fixture: "scaffolding-trap-guardrails", action: "generate_concept_logline", profile: "taste-profile", suffix: "taste" },
  // Arcs quality pass — the rewritten tv_import_arcs craft prompt
  // (arc contract, curve grammar, moments schema, relationship arcs)
  // across the three TV fixtures: prestige drama w/ relationships,
  // relationship-heavy mystery, and the guardrailed dark comedy with
  // the taste profile active.
  { fixture: "tv-prestige", action: "tv_import_arcs", payload: { episodeCount: 8 } },
  { fixture: "tv-mystery", action: "tv_import_arcs", payload: { episodeCount: 8 } },
  { fixture: "tv-timeslip", action: "tv_import_arcs", payload: { episodeCount: 8 }, profile: "taste-profile", suffix: "taste" },
  // Downstream: the arc-populated twin (live AFTER arcs applied via
  // the real helpers) exercises the season-arcs bible render, the
  // episode digest with DOMINANT tiers + hard moments, and the
  // no-pre-emption rule in a generate_episode prompt.
  { fixture: "tv-prestige-arcs", action: "generate_episode" },
];

function renderReadable(r) {
  const lines = [];
  lines.push(`ACTION: ${r.action}`);
  lines.push(`MODEL: ${r.model}   maxTokens: ${r.maxTokens}   jsonPrefill: ${r.jsonPrefill}`);
  lines.push(`EST INPUT TOKENS: ${r.estimate.inputTokens}   est cold-cache input cost: $${r.estimate.inputCostUsd}`);
  lines.push("");
  r.system.forEach((b, i) => {
    lines.push(`───────── SYSTEM BLOCK ${i + 1} ${b.cached ? "(cached)" : "(uncached)"} — ~${b.estTokens} tok ─────────`);
    lines.push(b.text);
    lines.push("");
  });
  lines.push("───────── USER MESSAGE ─────────");
  lines.push(r.userMessage);
  lines.push("");
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let failures = 0;
  for (const { fixture, action, payload, profile, suffix } of MATRIX) {
    const name = `${fixture}__${action}${suffix ? `__${suffix}` : ""}`;
    try {
      const story = JSON.parse(
        await readFile(path.join("fixtures/engine", `${fixture}.json`), "utf8"),
      );
      // Optional per-row WriterProfile fixture (Engine Lab taste rows).
      const profileBody = profile
        ? JSON.parse(await readFile(path.join("fixtures/engine", `${profile}.json`), "utf8"))
        : null;
      const res = await fetch(`${BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": EMAIL },
        body: JSON.stringify({
          story,
          action: { type: action, payload: payload ?? {} },
          profile: profileBody,
          dryRun: true,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      if (data.dryRun !== true) {
        throw new Error("response is not a dry-run payload — refusing to continue (live-call safety)");
      }
      await writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
      await writeFile(path.join(OUT, `${name}.txt`), renderReadable(data));
      console.log(`✓ ${name}  (model=${data.model}, ~${data.estimate.inputTokens} input tok)`);
    } catch (err) {
      failures++;
      console.error(`✗ ${name}: ${err.message}`);
    }
  }
  console.log(failures === 0 ? `\nAll snapshots written to ${OUT}` : `\n${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
