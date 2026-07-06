// Engine Lab — admin-gated read access to the committed engine
// fixtures + the prompt-version era manifest, so the Lab UI can offer
// the same fixture matrix the CLI harness uses without shipping the
// fixture JSON to the client bundle.
//
//   GET /api/engine-lab/fixtures            → { fixtures: string[], versions: {...} }
//   GET /api/engine-lab/fixtures?name=<id>  → the fixture Story JSON
//
// Read-only by design: the Lab never writes fixtures (they are
// committed test assets; editing happens in git). Gated on the same
// hardcoded admin allowlist as /api/admin/* (x-user-email is injected
// by AuthProvider on every same-origin /api fetch).

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/adminEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXTURES_DIR = path.join(process.cwd(), "fixtures", "engine");

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get("x-user-email"))) {
    return Response.json({ error: "not authorized" }, { status: 403 });
  }
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  try {
    if (name) {
      // Strict allowlist shape — a bare fixture id, no path traversal.
      if (!/^[a-z0-9-]+$/i.test(name)) {
        return Response.json({ error: "bad fixture name" }, { status: 400 });
      }
      const raw = await readFile(path.join(FIXTURES_DIR, `${name}.json`), "utf8");
      return Response.json(JSON.parse(raw));
    }
    const entries = await readdir(FIXTURES_DIR);
    const fixtures = entries
      // PROMPT_VERSIONS is the era manifest; taste-profile is a
      // WriterProfile (not a Story) used by the CLI harness — neither
      // belongs in the story-fixture picker.
      .filter(f => f.endsWith(".json") && f !== "PROMPT_VERSIONS.json" && f !== "taste-profile.json")
      .map(f => f.replace(/\.json$/, ""))
      .sort();
    let versions: unknown = null;
    try {
      versions = JSON.parse(await readFile(path.join(FIXTURES_DIR, "PROMPT_VERSIONS.json"), "utf8"));
    } catch {
      versions = null; // manifest optional — the Lab renders a fallback
    }
    return Response.json({ fixtures, versions });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
