"use client";

// Engine Lab — private, admin-only control room for Unfold's creative
// engine. Five panels:
//
//   Taste      — author the account-level taste profile
//                (WriterProfile.tasteProfile; injected as its own
//                system block by buildPrompt when non-empty)
//   Guardrails — author per-project creative guardrails
//                (Story.guardrails; rendered inside the story bible)
//   Preview    — $0 dry-run prompt inspector for any fixture/project ×
//                action: every system block, routed model, cost
//                estimate, and an inclusion checklist
//   Runner     — controlled test runner: dry-run by default; live
//                calls require a typed confirm AND headroom under a
//                session cost cap; every run logged with rubric scores
//   History    — prompt-version era manifest + run log + comparison
//
// Design rules (FABLE_ENGINE_LAB_PRD.md): this page NEVER calls image/
// video/TTS routes; it reads the REAL engine paths (/api/generate,
// buildPrompt output) rather than reimplementing them; utilitarian
// styling per the admin-page precedent (style-lab, usage) — numbers >
// polish.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isAdmin } from "@/lib/adminEmails";
import { DesktopSidebar, deriveSidebarUserFields } from "@/components/DesktopSidebar";
import { loadWriterProfileFromDB, saveWriterProfileToDB } from "@/lib/writerProfileStore";
import { WriterProfile, emptyProfile } from "@/lib/writerProfile";
import { loadProjectsFromDB, saveProjectToDB } from "@/lib/storage";
import { Story } from "@/lib/story";
import { PRICING } from "@/lib/prompt";
import {
  TasteProfile, emptyTasteProfile, TASTE_PRINCIPLES, hasTasteContent, renderTasteForPrompt,
  ProjectGuardrails, GUARDRAIL_FIELDS, hasGuardrails, renderGuardrailsForBible, normalizeGuardrails,
  EngineLabRun, ENGINE_LAB_RUNS_KEY, ENGINE_LAB_MAX_RUNS,
  ENGINE_LAB_RUBRICS, RUBRIC_FOR_ACTION, Rubric,
} from "@/lib/engineLab";

// ─── Constants ────────────────────────────────────────────────────────

const TABS = ["Taste", "Guardrails", "Preview", "Runner", "History"] as const;
type Tab = (typeof TABS)[number];

/** Actions the Lab exposes. Deliberately the program's test surfaces —
 *  NOT the full ActionType union. No image/video/TTS action exists
 *  here by construction. */
const LAB_ACTIONS: ReadonlyArray<{ value: string; label: string; needsBeatIndex?: boolean }> = [
  { value: "generate_concept_logline", label: "Logline" },
  { value: "generate_beats", label: "Beats" },
  { value: "generate_scene", label: "Scene (needs beat #)", needsBeatIndex: true },
  { value: "sync_story_to_script", label: "Script (story → script)" },
  { value: "sync_concept_to_characters", label: "Characters (concept → cast)" },
  { value: "derive_relationships", label: "Relationships (derive)" },
] as const;

const DEFAULT_CAP_USD = 0.5;

// ─── Small shared bits ────────────────────────────────────────────────

const box: React.CSSProperties = {
  background: "#1b1b1b", border: "1px solid #2c2c2c", borderRadius: 8, padding: 16,
};
const btn: React.CSSProperties = {
  background: "#2c2c2c", color: "#ededed", border: "1px solid #3a3a3a",
  borderRadius: 6, padding: "7px 14px", fontSize: 13, cursor: "pointer",
};
const btnPrimary: React.CSSProperties = { ...btn, background: "#ededed", color: "#121212", fontWeight: 700 };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "#121212", color: "#ededed", border: "1px solid #3a3a3a",
  borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
};
const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 };
const fmtUsd = (n: number | null | undefined) => (n == null ? "—" : `$${n.toFixed(6)}`);

function loadRuns(): EngineLabRun[] {
  try {
    const raw = localStorage.getItem(ENGINE_LAB_RUNS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveRuns(runs: EngineLabRun[]) {
  try { localStorage.setItem(ENGINE_LAB_RUNS_KEY, JSON.stringify(runs.slice(0, ENGINE_LAB_MAX_RUNS))); } catch {}
}

/** Stream a LIVE /api/generate call, returning text + the usage report.
 *  Same NDJSON protocol scripts/gauntlet-live.mjs consumes. */
async function streamGenerate(body: unknown): Promise<{ text: string; report: any | null }> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "", text = "", report: any = null;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const evt = JSON.parse(line);
        if (evt.type === "text") text += evt.value;
        else if (evt.type === "report") report = evt.value;
        else if (evt.type === "error") throw new Error(String(evt.value));
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
  return { text, report };
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function EngineLabPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin(user?.email)) router.replace("/");
  }, [authLoading, user?.email, router]);
  const { userInitial, userAvatarUrl, userDisplayName } = deriveSidebarUserFields(user);

  const [tab, setTab] = useState<Tab>("Taste");

  // Writer profile (source of tasteProfile). Loaded once, edited here.
  const [profile, setProfile] = useState<WriterProfile | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadWriterProfileFromDB(user.id).then(p => { if (!cancelled) setProfile(p ?? emptyProfile()); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fixture + project sources.
  const [fixtures, setFixtures] = useState<string[]>([]);
  const [versions, setVersions] = useState<any>(null);
  const [projects, setProjects] = useState<Story[]>([]);
  useEffect(() => {
    if (!isAdmin(user?.email)) return;
    fetch("/api/engine-lab/fixtures")
      .then(r => r.json())
      .then(j => { setFixtures(j.fixtures ?? []); setVersions(j.versions ?? null); })
      .catch(() => {});
    if (user?.id) loadProjectsFromDB(user.id).then(setProjects).catch(() => {});
  }, [user?.email, user?.id]);

  // Run log.
  const [runs, setRuns] = useState<EngineLabRun[]>([]);
  useEffect(() => { setRuns(loadRuns()); }, []);
  const addRun = useCallback((r: EngineLabRun) => {
    setRuns(prev => { const next = [r, ...prev].slice(0, ENGINE_LAB_MAX_RUNS); saveRuns(next); return next; });
  }, []);
  const updateRun = useCallback((id: string, patch: Partial<EngineLabRun>) => {
    setRuns(prev => { const next = prev.map(r => (r.id === id ? { ...r, ...patch } : r)); saveRuns(next); return next; });
  }, []);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="app">
      <DesktopSidebar activeMain={null} inStudio={false}
        onProjects={() => router.push("/")} onIdeas={() => router.push("/")} onMenu={() => router.push("/")}
        userInitial={userInitial} userAvatarUrl={userAvatarUrl} userDisplayName={userDisplayName} />
      <div className="app-content" style={{ background: "#121212", color: "#ededed", minHeight: "100vh", overflowY: "auto" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 28px 96px" }}>{children}</div>
      </div>
    </div>
  );

  if (authLoading || !isAdmin(user?.email)) {
    return <Shell><div style={{ opacity: 0.5 }}>Loading…</div></Shell>;
  }

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>Engine Lab</h1>
        <div style={{ fontSize: 12, opacity: 0.55 }}>internal · dry-run first · no image gen</div>
      </div>
      <p style={{ fontSize: 13, opacity: 0.6, margin: "0 0 18px", maxWidth: 720, lineHeight: 1.5 }}>
        Control room for the creative engine. Taste and guardrails feed the REAL prompt paths
        (buildPrompt / storyBible) — everything here is what generations actually see.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...btn, ...(tab === t ? { background: "#ededed", color: "#121212", fontWeight: 700 } : {}) }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Taste" && <TastePanel userId={user!.id} profile={profile} setProfile={setProfile} />}
      {tab === "Guardrails" && <GuardrailsPanel userId={user!.id} projects={projects} setProjects={setProjects} fixtures={fixtures} />}
      {tab === "Preview" && <PreviewPanel fixtures={fixtures} projects={projects} profile={profile} />}
      {tab === "Runner" && <RunnerPanel fixtures={fixtures} projects={projects} profile={profile} runs={runs} addRun={addRun} updateRun={updateRun} />}
      {tab === "History" && <HistoryPanel versions={versions} runs={runs} setRuns={setRuns} />}
    </Shell>
  );
}

// ─── Taste panel ──────────────────────────────────────────────────────

function TastePanel({ userId, profile, setProfile }: {
  userId: string;
  profile: WriterProfile | null;
  setProfile: (p: WriterProfile) => void;
}) {
  const taste: TasteProfile = profile?.tasteProfile ?? emptyTasteProfile();
  const [principles, setPrinciples] = useState<string[]>(taste.principles);
  const [notes, setNotes] = useState(taste.notes);
  const [customText, setCustomText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Re-seed the editor when the profile finishes loading.
  const seeded = useRef(false);
  useEffect(() => {
    if (profile && !seeded.current) {
      seeded.current = true;
      setPrinciples(profile.tasteProfile?.principles ?? []);
      setNotes(profile.tasteProfile?.notes ?? "");
    }
  }, [profile]);

  const knownIds = new Set(TASTE_PRINCIPLES.map(p => p.id));
  const customs = principles.filter(p => !knownIds.has(p));
  const toggle = (id: string) =>
    setPrinciples(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const draft: TasteProfile = {
    principles, notes,
    updatedAt: taste.updatedAt, version: taste.version,
  };
  const rendered = renderTasteForPrompt(draft);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const next: TasteProfile = {
        principles, notes,
        updatedAt: new Date().toISOString(),
        version: (profile.tasteProfile?.version ?? 0) + 1,
      };
      const updated: WriterProfile = { ...profile, tasteProfile: hasTasteContent(next) ? next : null };
      await saveWriterProfileToDB(userId, updated);
      setProfile(updated);
      setSavedAt(new Date().toLocaleTimeString());
    } finally { setSaving(false); }
  };

  if (!profile) return <div style={{ opacity: 0.5 }}>Loading profile…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div style={box}>
        <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>Account taste profile</h2>
        <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 14px", lineHeight: 1.5 }}>
          Standing creative taste, injected into every generation as a binding system block.
          Hard safety lines are NOT taste — they live in the engine&apos;s edge-preservation
          contract and cannot be toggled here.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {TASTE_PRINCIPLES.map(p => {
            const on = principles.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)} title={p.promptLine}
                style={{ ...btn, fontSize: 12, padding: "5px 11px",
                  ...(on ? { background: "#3d6b47", borderColor: "#4e8a5b", color: "#fff" } : {}) }}>
                {on ? "✓ " : ""}{p.label}
              </button>
            );
          })}
          {customs.map(c => (
            <button key={c} onClick={() => toggle(c)} title="Custom principle — click to remove"
              style={{ ...btn, fontSize: 12, padding: "5px 11px", background: "#5b4a2e", borderColor: "#7a6236", color: "#fff" }}>
              ✓ {c.length > 42 ? c.slice(0, 42) + "…" : c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input style={inputStyle} placeholder="Add a custom principle (rendered verbatim as a rule line)…"
            value={customText} onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && customText.trim()) {
                setPrinciples(prev => [...prev, customText.trim()]);
                setCustomText("");
              }
            }} />
        </div>
        <label style={{ fontSize: 12, opacity: 0.7 }}>In your own words (optional)</label>
        <textarea style={{ ...inputStyle, minHeight: 110, marginTop: 6, resize: "vertical" }}
          placeholder="Free-text elaboration the model reads verbatim…"
          value={notes} onChange={e => setNotes(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button style={btnPrimary} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save taste profile"}
          </button>
          <span style={{ fontSize: 12, opacity: 0.55 }}>
            v{taste.version}{savedAt ? ` · saved ${savedAt}` : ""}
          </span>
        </div>
      </div>
      <div style={box}>
        <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>Exact prompt block</h2>
        <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 10px" }}>
          What buildPrompt will inject (own cached system block). Empty = the block is omitted
          entirely and prompts are byte-identical to a taste-less account.
        </p>
        <pre style={{ ...mono, whiteSpace: "pre-wrap", background: "#121212", border: "1px solid #2c2c2c",
          borderRadius: 6, padding: 12, minHeight: 200, maxHeight: 420, overflowY: "auto" }}>
          {rendered || "(empty — no block will be injected)"}
        </pre>
      </div>
    </div>
  );
}

// ─── Guardrails panel ─────────────────────────────────────────────────

function GuardrailsPanel({ userId, projects, setProjects, fixtures }: {
  userId: string;
  projects: Story[];
  setProjects: (p: Story[]) => void;
  fixtures: string[];
}) {
  const [sel, setSel] = useState<string>("");
  const [fields, setFields] = useState<ProjectGuardrails>({});
  const [fixturePreview, setFixturePreview] = useState<ProjectGuardrails | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const isFixture = sel.startsWith("fixture:");
  const project = projects.find(p => `project:${p.id}` === sel) ?? null;

  useEffect(() => {
    setSavedAt(null);
    if (sel.startsWith("project:")) {
      const p = projects.find(x => `project:${x.id}` === sel);
      setFields(p?.guardrails ?? {});
      setFixturePreview(null);
    } else if (sel.startsWith("fixture:")) {
      const name = sel.slice("fixture:".length);
      fetch(`/api/engine-lab/fixtures?name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(j => setFixturePreview(normalizeGuardrails(j?.guardrails) ?? {}))
        .catch(() => setFixturePreview({}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const effective = isFixture ? (fixturePreview ?? {}) : fields;
  const rendered = renderGuardrailsForBible(effective);

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const guardrails = normalizeGuardrails(fields);
      const updated: Story = { ...project, guardrails, updatedAt: new Date().toISOString() };
      await saveProjectToDB(userId, updated);
      setProjects(projects.map(p => (p.id === project.id ? updated : p)));
      setSavedAt(new Date().toLocaleTimeString());
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div style={box}>
        <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>Project guardrails</h2>
        <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 12px", lineHeight: 1.5 }}>
          Per-project constraints rendered into the story bible (BINDING). Projects are editable;
          fixtures are read-only committed test assets (edit in git).
        </p>
        <select style={{ ...inputStyle, marginBottom: 14 }} value={sel} onChange={e => setSel(e.target.value)}>
          <option value="">— pick a project or fixture —</option>
          <optgroup label="My projects">
            {projects.map(p => <option key={p.id} value={`project:${p.id}`}>{p.title || "(untitled)"}</option>)}
          </optgroup>
          <optgroup label="Fixtures (read-only)">
            {fixtures.map(f => <option key={f} value={`fixture:${f}`}>{f}</option>)}
          </optgroup>
        </select>
        {sel && GUARDRAIL_FIELDS.map(f => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.7 }}>{f.label}</label>
            <textarea style={{ ...inputStyle, minHeight: 44, marginTop: 4, resize: "vertical", opacity: isFixture ? 0.6 : 1 }}
              placeholder={f.placeholder} disabled={isFixture}
              value={(isFixture ? fixturePreview?.[f.key] : fields[f.key]) ?? ""}
              onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))} />
          </div>
        ))}
        {project && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <button style={btnPrimary} onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save guardrails"}
            </button>
            {savedAt && <span style={{ fontSize: 12, opacity: 0.55 }}>saved {savedAt}</span>}
          </div>
        )}
      </div>
      <div style={box}>
        <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>Exact bible section</h2>
        <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 10px" }}>
          Rendered inside the story bible after Settings. Empty = section omitted, prompts byte-identical.
        </p>
        <pre style={{ ...mono, whiteSpace: "pre-wrap", background: "#121212", border: "1px solid #2c2c2c",
          borderRadius: 6, padding: 12, minHeight: 200, maxHeight: 480, overflowY: "auto" }}>
          {rendered || "(empty — no section will be rendered)"}
        </pre>
      </div>
    </div>
  );
}

// ─── Source/action picker (shared by Preview + Runner) ───────────────

function useSourceStory(fixtures: string[], projects: Story[]) {
  const [sel, setSel] = useState<string>("");
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setStory(null);
    if (!sel) return;
    if (sel.startsWith("project:")) {
      setStory(projects.find(p => `project:${p.id}` === sel) ?? null);
    } else if (sel.startsWith("fixture:")) {
      setLoading(true);
      fetch(`/api/engine-lab/fixtures?name=${encodeURIComponent(sel.slice("fixture:".length))}`)
        .then(r => r.json()).then(j => setStory(j?.id ? j : null))
        .catch(() => setStory(null))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);
  const Picker = (
    <select style={inputStyle} value={sel} onChange={e => setSel(e.target.value)}>
      <option value="">— source —</option>
      <optgroup label="Fixtures">
        {fixtures.map(f => <option key={f} value={`fixture:${f}`}>{f}</option>)}
      </optgroup>
      <optgroup label="My projects">
        {projects.map(p => <option key={p.id} value={`project:${p.id}`}>{p.title || "(untitled)"}</option>)}
      </optgroup>
    </select>
  );
  return { sel, story, loading, Picker };
}

// ─── Preview panel ────────────────────────────────────────────────────

interface DryRunResult {
  action: string; model: string; maxTokens: number; jsonPrefill: boolean;
  system: Array<{ cached: boolean; chars: number; estTokens: number; text: string }>;
  userMessage: string;
  estimate: { note: string; inputTokens: number; inputCostUsd: number | null; maxOutputCostUsd: number | null };
}

function inclusionChecklist(r: DryRunResult) {
  const all = r.system.map(b => b.text).join("\n") + "\n" + r.userMessage;
  const refLine = all.match(/- References \(titles to mirror, with the aspects to borrow\): (.+)/);
  return [
    { label: "Account taste profile", on: all.includes("# ACCOUNT TASTE PROFILE") },
    { label: "Project guardrails", on: all.includes("## Project guardrails (BINDING") },
    { label: "Relationships (FIXED FACTS)", on: all.includes("Relationships (FIXED FACTS)") },
    { label: "References", on: !!refLine && !refLine[1].startsWith("none") },
    { label: "Writer profile (accumulated signal)", on: all.includes("# WRITER PROFILE") },
    { label: "Locked style profile", on: all.includes("## WRITER STYLE PROFILE") },
    { label: "Humor dial", on: /- Humor: \d+\/10/.test(all) },
  ];
}

function PreviewPanel({ fixtures, projects, profile }: {
  fixtures: string[]; projects: Story[]; profile: WriterProfile | null;
}) {
  const { story, Picker } = useSourceStory(fixtures, projects);
  const [action, setAction] = useState(LAB_ACTIONS[0].value);
  const [beatIndex, setBeatIndex] = useState(0);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsBeat = LAB_ACTIONS.find(a => a.value === action)?.needsBeatIndex;

  const run = async () => {
    if (!story) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story,
          action: { type: action, payload: needsBeat ? { beatIndex } : {} },
          profile: includeProfile ? profile : null,
          dryRun: true,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.dryRun) throw new Error(j?.error || `HTTP ${res.status}`);
      setResult(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ ...box, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ minWidth: 260, flex: 1 }}>{Picker}</div>
        <select style={{ ...inputStyle, width: 240 }} value={action} onChange={e => setAction(e.target.value)}>
          {LAB_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {needsBeat && (
          <input type="number" min={0} style={{ ...inputStyle, width: 90 }} value={beatIndex}
            onChange={e => setBeatIndex(Math.max(0, Number(e.target.value) || 0))} title="beatIndex (0-based)" />
        )}
        <label style={{ fontSize: 12, opacity: 0.8, display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={includeProfile} onChange={e => setIncludeProfile(e.target.checked)} />
          include my profile (taste/style)
        </label>
        <button style={btnPrimary} onClick={run} disabled={!story || busy}>
          {busy ? "Assembling…" : "Preview prompt ($0)"}
        </button>
      </div>
      {err && <div style={{ color: "#ff8a8a", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
          <div>
            <div style={{ ...box, marginBottom: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8 }}>
                <span style={{ background: "#2e4a6b", color: "#cfe3ff", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>DRY-RUN — $0</span>
              </div>
              <table style={{ fontSize: 12, borderSpacing: 0 }}>
                <tbody>
                  <tr><td style={{ opacity: 0.55, paddingRight: 10 }}>Model</td><td style={mono}>{result.model}</td></tr>
                  <tr><td style={{ opacity: 0.55, paddingRight: 10 }}>Output cap</td><td style={mono}>{result.maxTokens} tok</td></tr>
                  <tr><td style={{ opacity: 0.55, paddingRight: 10 }}>Est input</td><td style={mono}>{result.estimate.inputTokens} tok</td></tr>
                  <tr><td style={{ opacity: 0.55, paddingRight: 10 }}>Est input cost</td><td style={mono}>{fmtUsd(result.estimate.inputCostUsd)}</td></tr>
                  <tr><td style={{ opacity: 0.55, paddingRight: 10 }}>Max output cost</td><td style={mono}>{fmtUsd(result.estimate.maxOutputCostUsd)}</td></tr>
                  <tr><td style={{ opacity: 0.55, paddingRight: 10 }}>JSON prefill</td><td style={mono}>{String(result.jsonPrefill)}</td></tr>
                </tbody>
              </table>
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 8, lineHeight: 1.4 }}>{result.estimate.note}</div>
            </div>
            <div style={box}>
              <h3 style={{ fontSize: 13, margin: "0 0 10px" }}>What&apos;s included</h3>
              {inclusionChecklist(result).map(c => (
                <div key={c.label} style={{ fontSize: 12, marginBottom: 6, opacity: c.on ? 1 : 0.45 }}>
                  {c.on ? "✅" : "—"} {c.label}
                </div>
              ))}
            </div>
          </div>
          <div>
            {result.system.map((b, i) => (
              <details key={i} open={i === result.system.length - 1} style={{ ...box, marginBottom: 12, padding: 0 }}>
                <summary style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13 }}>
                  System block {i + 1} {b.cached ? "· cached" : "· uncached"} · ~{b.estTokens} tok
                </summary>
                <pre style={{ ...mono, whiteSpace: "pre-wrap", margin: 0, padding: "0 14px 14px", maxHeight: 380, overflowY: "auto" }}>{b.text}</pre>
              </details>
            ))}
            <details open style={{ ...box, padding: 0 }}>
              <summary style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13 }}>User message (the ask)</summary>
              <pre style={{ ...mono, whiteSpace: "pre-wrap", margin: 0, padding: "0 14px 14px", maxHeight: 420, overflowY: "auto" }}>{result.userMessage}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Runner panel ─────────────────────────────────────────────────────

function RunnerPanel({ fixtures, projects, profile, runs, addRun, updateRun }: {
  fixtures: string[]; projects: Story[]; profile: WriterProfile | null;
  runs: EngineLabRun[]; addRun: (r: EngineLabRun) => void; updateRun: (id: string, patch: Partial<EngineLabRun>) => void;
}) {
  const { sel, story, Picker } = useSourceStory(fixtures, projects);
  const [action, setAction] = useState(LAB_ACTIONS[0].value);
  const [beatIndex, setBeatIndex] = useState(0);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  // Live-call safety: typed confirm + session cap.
  const [capUsd, setCapUsd] = useState(DEFAULT_CAP_USD);
  const [confirmText, setConfirmText] = useState("");
  const needsBeat = LAB_ACTIONS.find(a => a.value === action)?.needsBeatIndex;

  const sessionSpend = useMemo(
    () => runs.filter(r => r.mode === "live").reduce((n, r) => n + (r.costUsd ?? 0), 0),
    [runs],
  );
  const payload = needsBeat ? { beatIndex } : {};
  const effProfile = includeProfile ? profile : null;

  const dryRun = async (): Promise<DryRunResult | null> => {
    const res = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story, action: { type: action, payload }, profile: effProfile, dryRun: true }),
    });
    const j = await res.json();
    if (!res.ok || !j.dryRun) throw new Error(j?.error || `HTTP ${res.status}`);
    return j;
  };

  const runDry = async () => {
    if (!story) return;
    setBusy(true); setErr(null);
    try {
      const j = await dryRun();
      if (!j) return;
      const run: EngineLabRun = {
        id: `run_${Math.random().toString(36).slice(2, 10)}`,
        at: new Date().toISOString(),
        fixture: sel, action, payload, mode: "dry",
        model: j.model, costUsd: 0,
        inputTokens: j.estimate.inputTokens, outputTokens: null,
        tasteVersion: effProfile?.tasteProfile?.version ?? null,
        hadGuardrails: hasGuardrails(story.guardrails),
        notes: `est input ${fmtUsd(j.estimate.inputCostUsd)}, output cap ${j.maxTokens} tok`,
      };
      addRun(run); setLastRunId(run.id);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const runLive = async () => {
    if (!story || confirmText !== "LIVE") return;
    setBusy(true); setErr(null);
    try {
      // Cap check with a conservative pre-flight estimate: dry-run the
      // exact request, take input cost + 25% of the max-output cost as
      // the expected ceiling. Refuse when it would cross the cap.
      const j = await dryRun();
      const est = (j?.estimate.inputCostUsd ?? 0) + 0.25 * (j?.estimate.maxOutputCostUsd ?? 0);
      if (sessionSpend + est > capUsd) {
        throw new Error(
          `Refused: estimated ceiling ${fmtUsd(est)} would push session spend past the cap ` +
          `(${fmtUsd(sessionSpend)} spent of $${capUsd.toFixed(2)}). Raise the cap deliberately if intended.`,
        );
      }
      const { text, report } = await streamGenerate({ story, action: { type: action, payload }, profile: effProfile });
      const run: EngineLabRun = {
        id: `run_${Math.random().toString(36).slice(2, 10)}`,
        at: new Date().toISOString(),
        fixture: sel, action, payload, mode: "live",
        model: report?.model ?? j?.model ?? "?",
        costUsd: report?.cost?.total ?? null,
        inputTokens: report?.tokens?.input ?? null,
        outputTokens: report?.tokens?.output ?? null,
        output: text,
        tasteVersion: effProfile?.tasteProfile?.version ?? null,
        hadGuardrails: hasGuardrails(story.guardrails),
      };
      addRun(run); setLastRunId(run.id);
      setConfirmText("");
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const lastRun = runs.find(r => r.id === lastRunId) ?? null;

  return (
    <div>
      <div style={{ ...box, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ minWidth: 260, flex: 1 }}>{Picker}</div>
        <select style={{ ...inputStyle, width: 240 }} value={action} onChange={e => setAction(e.target.value)}>
          {LAB_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {needsBeat && (
          <input type="number" min={0} style={{ ...inputStyle, width: 90 }} value={beatIndex}
            onChange={e => setBeatIndex(Math.max(0, Number(e.target.value) || 0))} title="beatIndex (0-based)" />
        )}
        <label style={{ fontSize: 12, opacity: 0.8, display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={includeProfile} onChange={e => setIncludeProfile(e.target.checked)} />
          include my profile
        </label>
        <button style={btnPrimary} onClick={runDry} disabled={!story || busy}>
          {busy ? "…" : "Dry-run ($0)"}
        </button>
      </div>

      <div style={{ ...box, marginBottom: 18, borderColor: "#6b2e2e" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ff9a9a" }}>LIVE (spends real money)</span>
          <label style={{ fontSize: 12, opacity: 0.8 }}>
            session cap $
            <input type="number" step="0.05" min={0} value={capUsd}
              onChange={e => setCapUsd(Math.max(0, Number(e.target.value) || 0))}
              style={{ ...inputStyle, width: 80, display: "inline-block", marginLeft: 6 }} />
          </label>
          <span style={{ fontSize: 12, opacity: 0.7 }}>spent this session: <b>{fmtUsd(sessionSpend)}</b></span>
          <input style={{ ...inputStyle, width: 130 }} placeholder={`type LIVE to arm`}
            value={confirmText} onChange={e => setConfirmText(e.target.value)} />
          <button style={{ ...btn, ...(confirmText === "LIVE" ? { background: "#6b2e2e", borderColor: "#8a3d3d", color: "#fff", fontWeight: 700 } : { opacity: 0.5 }) }}
            onClick={runLive} disabled={!story || busy || confirmText !== "LIVE"}>
            {busy ? "Running…" : "Run LIVE"}
          </button>
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
          Pre-flight: the runner dry-runs the exact request first and refuses when input cost + 25% of the
          output ceiling would cross the cap. Every live call is logged below and in the server usage log.
        </div>
      </div>

      {err && <div style={{ color: "#ff8a8a", fontSize: 13, marginBottom: 12, whiteSpace: "pre-wrap" }}>{err}</div>}

      {lastRun && <RunCard run={lastRun} updateRun={updateRun} expanded />}

      <h3 style={{ fontSize: 14, margin: "22px 0 10px" }}>Run log ({runs.length})</h3>
      {runs.slice(0, 25).map(r => <RunCard key={r.id} run={r} updateRun={updateRun} />)}
      {runs.length === 0 && <div style={{ fontSize: 12, opacity: 0.5 }}>No runs yet. Dry-run something.</div>}
    </div>
  );
}

// ─── Run card + rubric scoring ────────────────────────────────────────

function RunCard({ run, updateRun, expanded }: {
  run: EngineLabRun; updateRun: (id: string, patch: Partial<EngineLabRun>) => void; expanded?: boolean;
}) {
  const rubric: Rubric | undefined = ENGINE_LAB_RUBRICS.find(r => r.id === RUBRIC_FOR_ACTION[run.action]);
  const scores = run.scores ?? {};
  const setScore = (cid: string, v: number) =>
    updateRun(run.id, { scores: { ...scores, [cid]: scores[cid] === v ? undefined as any : v } });

  const { total, denom, gateFailed } = useMemo(() => {
    if (!rubric) return { total: 0, denom: 0, gateFailed: false };
    let total = 0, denom = 0, gateFailed = false;
    for (const c of rubric.criteria) {
      const s = scores[c.id];
      if (s === -1) continue; // n/a — drops from denominator
      if (typeof s === "number") {
        total += s;
        if (c.gate && s === 0) gateFailed = true;
      }
      denom += 2;
    }
    return { total, denom, gateFailed };
  }, [rubric, scores]);

  return (
    <details open={expanded} style={{ ...box, marginBottom: 10, padding: 0 }}>
      <summary style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ background: run.mode === "live" ? "#6b2e2e" : "#2e4a6b", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
          {run.mode.toUpperCase()}
        </span>
        <span style={mono}>{run.fixture.replace(/^fixture:/, "")}</span>
        <span>· {run.action}{run.payload?.beatIndex != null ? ` b${run.payload.beatIndex}` : ""}</span>
        <span style={{ opacity: 0.55 }}>· {run.model} · {fmtUsd(run.costUsd)}</span>
        {run.passFail && (
          <span style={{ color: run.passFail === "pass" ? "#7fd18a" : "#ff8a8a", fontWeight: 700 }}>
            {run.passFail.toUpperCase()}{denom > 0 ? ` ${total}/${denom}` : ""}
          </span>
        )}
        <span style={{ opacity: 0.4, marginLeft: "auto", fontSize: 11 }}>{new Date(run.at).toLocaleString()}</span>
      </summary>
      <div style={{ padding: "0 14px 14px" }}>
        {run.output && (
          <pre style={{ ...mono, whiteSpace: "pre-wrap", background: "#121212", border: "1px solid #2c2c2c",
            borderRadius: 6, padding: 12, maxHeight: 340, overflowY: "auto" }}>{run.output}</pre>
        )}
        {rubric && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              {rubric.title} — {rubric.passNote} {gateFailed && <b style={{ color: "#ff8a8a" }}>GATE FAILED</b>}
              {denom > 0 && <b style={{ marginLeft: 8 }}>{total}/{denom}</b>}
            </div>
            {rubric.criteria.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                <span style={{ width: 26, opacity: 0.55, fontWeight: c.gate ? 800 : 400 }}>{c.id}</span>
                {[0, 1, 2].map(v => (
                  <button key={v} onClick={() => setScore(c.id, v)}
                    style={{ ...btn, padding: "2px 9px", fontSize: 11,
                      ...(scores[c.id] === v ? { background: v === 0 ? "#6b2e2e" : v === 1 ? "#5b4a2e" : "#3d6b47", color: "#fff", fontWeight: 700 } : {}) }}>
                    {v}
                  </button>
                ))}
                {c.naAble && (
                  <button onClick={() => setScore(c.id, -1)}
                    style={{ ...btn, padding: "2px 9px", fontSize: 11, ...(scores[c.id] === -1 ? { background: "#444", fontWeight: 700 } : {}) }}>
                    n/a
                  </button>
                )}
                <span style={{ opacity: 0.75 }}>{c.label}{c.gate ? " ⛩" : ""}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <button style={{ ...btn, ...(run.passFail === "pass" ? { background: "#3d6b47", color: "#fff" } : {}) }}
            onClick={() => updateRun(run.id, { passFail: run.passFail === "pass" ? null : "pass" })}>PASS</button>
          <button style={{ ...btn, ...(run.passFail === "fail" ? { background: "#6b2e2e", color: "#fff" } : {}) }}
            onClick={() => updateRun(run.id, { passFail: run.passFail === "fail" ? null : "fail" })}>FAIL</button>
          <input style={{ ...inputStyle, flex: 1, minWidth: 220 }} placeholder="Notes — why is this output better/worse?"
            value={run.notes ?? ""} onChange={e => updateRun(run.id, { notes: e.target.value })} />
        </div>
        <div style={{ fontSize: 11, opacity: 0.45, marginTop: 8 }}>
          taste v{run.tasteVersion ?? "—"} · guardrails {run.hadGuardrails ? "on" : "off"}
          {run.inputTokens != null && <> · in {run.inputTokens} tok</>}
          {run.outputTokens != null && <> · out {run.outputTokens} tok</>}
        </div>
      </div>
    </details>
  );
}

// ─── History panel ────────────────────────────────────────────────────

function HistoryPanel({ versions, runs, setRuns }: {
  versions: any; runs: EngineLabRun[]; setRuns: (r: EngineLabRun[]) => void;
}) {
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const a = runs.find(r => r.id === compareA) ?? null;
  const b = runs.find(r => r.id === compareB) ?? null;

  const exportRuns = () => {
    const blob = new Blob([JSON.stringify(runs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = `engine-lab-runs-${new Date().toISOString().slice(0, 10)}.json`;
    el.click();
    URL.revokeObjectURL(url);
  };
  const importRuns = (file: File) => {
    file.text().then(t => {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        const merged = [...parsed, ...runs.filter(r => !parsed.some((p: EngineLabRun) => p.id === r.id))];
        saveRuns(merged); setRuns(merged.slice(0, ENGINE_LAB_MAX_RUNS));
      }
    }).catch(() => {});
  };

  // Regression view: group runs by fixture×action, most recent first.
  const groups = useMemo(() => {
    const map = new Map<string, EngineLabRun[]>();
    for (const r of runs) {
      const k = `${r.fixture.replace(/^fixture:/, "")} × ${r.action}`;
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return [...map.entries()].filter(([, rs]) => rs.length > 0);
  }, [runs]);

  const eras: any[] = versions?.eras ?? [];

  return (
    <div>
      <div style={{ ...box, marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Prompt / profile version history</h2>
        <p style={{ fontSize: 12, opacity: 0.6, margin: "0 0 12px" }}>
          From <span style={mono}>fixtures/engine/PROMPT_VERSIONS.json</span> — one entry per engine pass.
          Snapshot baselines live in <span style={mono}>fixtures/engine/snapshots/&lt;id&gt;</span>; diff two eras with{" "}
          <span style={mono}>diff -r</span>.
        </p>
        {eras.length === 0 && <div style={{ fontSize: 12, opacity: 0.5 }}>(manifest not found)</div>}
        {eras.map((e: any) => (
          <div key={e.id} style={{ borderLeft: "2px solid #3a3a3a", padding: "2px 0 2px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{e.name} <span style={{ opacity: 0.5, fontWeight: 400 }}>· {e.date} · {e.commit}</span></div>
            <div style={{ fontSize: 12, opacity: 0.75, margin: "3px 0" }}>{e.summary}</div>
            <div style={{ ...mono, fontSize: 11, opacity: 0.5 }}>snapshots/{e.snapshots} · {Array.isArray(e.docs) ? e.docs.join(" · ") : ""}</div>
          </div>
        ))}
      </div>

      <div style={{ ...box, marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Regression tracking (run log by surface)</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button style={btn} onClick={exportRuns}>Export runs JSON</button>
          <label style={{ ...btn, display: "inline-block" }}>
            Import runs JSON
            <input type="file" accept="application/json" style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && importRuns(e.target.files[0])} />
          </label>
        </div>
        {groups.length === 0 && <div style={{ fontSize: 12, opacity: 0.5 }}>No runs logged yet.</div>}
        {groups.map(([k, rs]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{k}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {rs.map(r => (
                <span key={r.id} title={`${new Date(r.at).toLocaleString()} · ${fmtUsd(r.costUsd)}${r.notes ? ` · ${r.notes}` : ""}`}
                  style={{ ...mono, fontSize: 11, borderRadius: 4, padding: "2px 8px",
                    background: r.mode === "live" ? "#3a2222" : "#20293a",
                    border: `1px solid ${r.passFail === "pass" ? "#3d6b47" : r.passFail === "fail" ? "#8a3d3d" : "#3a3a3a"}` }}>
                  {r.mode}{r.passFail ? ` ${r.passFail}` : ""} {new Date(r.at).toLocaleDateString()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={box}>
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Compare two runs</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {[{ v: compareA, set: setCompareA }, { v: compareB, set: setCompareB }].map((s, i) => (
            <select key={i} style={inputStyle} value={s.v} onChange={e => s.set(e.target.value)}>
              <option value="">— run {i === 0 ? "A" : "B"} —</option>
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.mode} · {r.fixture.replace(/^fixture:/, "")} · {r.action} · {new Date(r.at).toLocaleString()}
                </option>
              ))}
            </select>
          ))}
        </div>
        {a && b && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[a, b].map((r, i) => (
              <div key={i} style={{ background: "#121212", border: "1px solid #2c2c2c", borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  <b>{i === 0 ? "A" : "B"}</b> · {r.mode} · {r.model} · {fmtUsd(r.costUsd)} ·
                  {" "}taste v{r.tasteVersion ?? "—"} · guardrails {r.hadGuardrails ? "on" : "off"}
                  {r.passFail && <> · <b style={{ color: r.passFail === "pass" ? "#7fd18a" : "#ff8a8a" }}>{r.passFail.toUpperCase()}</b></>}
                </div>
                {r.scores && Object.keys(r.scores).length > 0 && (
                  <div style={{ ...mono, fontSize: 11, opacity: 0.75, marginBottom: 8 }}>
                    {Object.entries(r.scores).map(([k2, v]) => `${k2}:${v === -1 ? "n/a" : v}`).join("  ")}
                  </div>
                )}
                {r.notes && <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>“{r.notes}”</div>}
                <pre style={{ ...mono, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto", margin: 0 }}>
                  {r.output ?? "(dry run — no output; re-assemble via Preview at $0)"}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
