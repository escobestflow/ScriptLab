#!/usr/bin/env node
// ONE live logline generation against a fixture. Used by the Phase-3
// live-tuning protocol (FABLE_ENGINE_PHASE_3_LIVE_TUNING.md) — every
// invocation is a deliberate, logged, budgeted spend decision.
//
//   node scripts/logline-live-test.mjs <fixture-name>
//
// Env: BASE (default http://localhost:3000), EMAIL (beta allowlist).
// Prints JSON: { fixture, model, logline, cost, tokens, ms } — cost
// comes from the route's own usage report event (actual, not estimated).
//
// NOT for loops. The Phase-3 caps (3 per round, 8 absolute) are
// enforced by the operator, so this script deliberately does exactly
// one call per invocation.

import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.EMAIL || "luisfescobarjr@gmail.com";
const fixture = process.argv[2];
if (!fixture) {
  console.error("usage: node scripts/logline-live-test.mjs <fixture-name>");
  process.exit(1);
}

const story = JSON.parse(
  await readFile(path.join("fixtures/engine", `${fixture}.json`), "utf8"),
);

const t0 = Date.now();
const res = await fetch(`${BASE}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-user-email": EMAIL },
  body: JSON.stringify({
    story,
    action: { type: "generate_concept_logline", payload: {} },
    profile: null,
    // NO dryRun — this is the intentional live call.
  }),
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}

let text = "";
let report = null;
let buf = "";
const decoder = new TextDecoder();
for await (const chunk of res.body) {
  buf += decoder.decode(chunk, { stream: true });
  const lines = buf.split("\n");
  buf = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const evt = JSON.parse(line);
      if (evt.type === "text") text += evt.value;
      else if (evt.type === "report") report = evt.value;
      else if (evt.type === "error") throw new Error(`stream error: ${evt.value}`);
    } catch (e) {
      if (String(e).includes("stream error")) throw e;
    }
  }
}

const jsonMatch = text.match(/\{[\s\S]*\}/);
const logline = jsonMatch ? JSON.parse(jsonMatch[0]).logline : null;

console.log(JSON.stringify({
  fixture,
  model: report?.model ?? "(no report)",
  logline,
  costUsd: report?.cost?.total ?? null,
  tokens: report?.tokens ?? null,
  ms: Date.now() - t0,
}, null, 2));
