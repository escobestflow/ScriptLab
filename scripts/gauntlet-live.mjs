#!/usr/bin/env node
// ONE live generation against a fixture, any surface. Gauntlet Phase D
// tool — every invocation is a deliberate, logged, budgeted spend
// (see FABLE_GAUNTLET_RUBRICS.md for pass thresholds and stop rules).
//
//   node scripts/gauntlet-live.mjs <fixture> <action> [beatIndex]
//   node scripts/gauntlet-live.mjs horror-comedy generate_beats
//   node scripts/gauntlet-live.mjs scene-intent generate_scene 1
//
// Env: BASE (default http://localhost:3000), EMAIL (beta allowlist).
// Prints: model, actual cost (from the route's usage report), tokens,
// and the raw output text. One call per invocation — never loops.

import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.EMAIL || "luisfescobarjr@gmail.com";
const [fixture, action, beatIndexRaw] = process.argv.slice(2);
if (!fixture || !action) {
  console.error("usage: node scripts/gauntlet-live.mjs <fixture> <action> [beatIndex]");
  process.exit(1);
}
const payload = beatIndexRaw !== undefined ? { beatIndex: Number(beatIndexRaw) } : {};

const story = JSON.parse(
  await readFile(path.join("fixtures/engine", `${fixture}.json`), "utf8"),
);

const t0 = Date.now();
const res = await fetch(`${BASE}/api/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-user-email": EMAIL },
  body: JSON.stringify({ story, action: { type: action, payload }, profile: null }),
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

console.log(JSON.stringify({
  fixture, action, payload,
  model: report?.model ?? "(no report)",
  costUsd: report?.cost?.total ?? null,
  tokens: report?.tokens ?? null,
  ms: Date.now() - t0,
}, null, 2));
console.log("────── OUTPUT ──────");
console.log(text.trim());
