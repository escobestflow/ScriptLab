# FABLE_ENGINE_LAB_TEST_RESULTS

Phase C verification of the Engine Lab build (branch
`fable-engine-lab`, 2026-07-06). Costs: `FABLE_ENGINE_LAB_COST_REPORT.md`.

## $0 layer (all passed before any live call)

| Check | Result |
|---|---|
| `npx next build` | ✅ clean; `/engine-lab` 9.22 kB page + `/api/engine-lab/fixtures` route both present |
| Snapshot regression | ✅ **all 19 pre-Lab rows byte-identical** to the `relationship-coverage` baseline (`diff -rq` — only the 3 new rows differ). The conditional-injection invariant holds. |
| New snapshot rows | ✅ guardrails twin renders the full `## Project guardrails (BINDING…)` section (8 fields) + `- Humor: 8/10` dial line; taste row renders `# ACCOUNT TASTE PROFILE (binding)` as its own cached block (~466 tok) |
| Guardrails normalize round-trip | ✅ tsx unit run: real guardrails survive `normalizeGuardrails`; junk shapes (whitespace-only, unknown keys, non-strings) → dropped; null → undefined |
| Page auth gate | ✅ unauthenticated `/engine-lab` visit redirects to `/` |
| API auth gates | ✅ 403 with no header, 403 with non-admin email, 200 (13 fixtures + 9 eras) as admin |
| Path traversal guard | ✅ `?name=../../package` → 400 |

## Live layer — 3 calls, $0.0310 total (cap was $3.00)

### 1. Logline · guardrails twin + taste profile · Haiku · $0.0040

> "A thirty-five-year-old startup founder wakes up in his
> fourteen-year-old body in 1996 with no useful future knowledge—only
> rap lyrics and movie trivia—and when his best friend finally
> believes him, they appoint themselves his management team, devising
> increasingly stupid schemes to monetize a psychic kid who can't
> remember a single stock tip or game score."

**PASS.** The v5 imported-scaffolding trap held with taste +
guardrails stacked on top: no invented clock, no get-back mission, no
menu/insight ending (L4 gate = 2). Guardrails honored: useless-
knowledge engine front and center; no get-rich shape. Scored ~11/12
(L6 n/a): L2 external pressure is the soft spot (the pressure is the
friends' schemes, not an outside force — consistent with this
fixture's known borderline). Minor: "his best friend… they appoint
themselves" number wobble (summary says three friends).

### 2. Beats · guardrails twin + taste (humor 8/10) · Haiku · $0.0144

**PASS with one instructive finding.** Causality chain clean
(B1 = 2); the mid-sheet turn ("the knowledge is almost worthless in
real-time") changes the problem's nature (B2 = 2); specificity high —
Wu-Tang order, notebook-paper contract, lunch-coupon DJ bribe
(B5 = 2). **Humor dial audible** (the P-B5 register-balance check):
schemes escalate as pure comedy engines and every beat carries a
laugh alongside the dread. Guardrails: every scheme fails ✅, adults
exact costs ✅ (high-schooler steals the allowance, phone company
flags the billing, station manager kills the segment), no
fix-the-timeline shape ✅.

**Finding L-1 (logged, not fixed):** beats 8–9 push Ms. Vann to
"she's falling for the boy who isn't there" — boundaries hold on the
page and the wrongness is explicitly carried as wrongness, but the
`sensitiveHandling` guardrail says "never reciprocates romantically,"
and the model read that as "never ACTS on it" rather than "never
develops the feeling." Guardrail wording lesson: behavioral
constraints ("never acts, boundaries hold") are enforced more
literally than interior-state constraints ("never reciprocates").
B7 intent scored 1, not 2, for this. Candidate wording fix in
NEXT_STEPS; note the beats are still inside the edge-preservation
hard lines (no romance-normalization, no consummation, discomfort
stays discomfort).

(Capture note: the beats output streamed past the terminal capture —
the tail beats weren't recorded, so B3 final-beat went unscored
rather than re-rolling at $0.014. Later runs pipe to file; the Lab's
Runner stores full outputs automatically.)

### 3. Characters · guardrails twin + taste · Haiku · $0.0126

**PASS — the taste-alignment regression stayed dead with the new
blocks active.** Ms. Vann survives as: a 24-year-old teacher (role
`supporting`, NOT `love_interest`), dark-comedy foil, her
vulnerability rendered as HER flaw ("mistakes Miles's mature rapport
for genuine intellectual kinship… poor boundary-setting") with social
danger attached. No sanitization (no peer-romance substitute), no
exploitation. Miles's own entry names the wrongness honestly
("crossing a line he intellectually understands"). Taste block,
guardrails, and `EDGE_PRESERVATION_RULES` composed without fighting —
the audit's contract-collision risk (§4.3) did not materialize.

## Conclusions

1. The injection layer is regression-safe (byte-identical when off)
   and effective (all three surfaces honored the new blocks live).
2. Taste + guardrails + existing craft contracts reinforce rather
   than fight — same-vocabulary design worked.
3. The humor dial demonstrably shifts register (single sample).
4. One real guardrail-wording lesson (L-1) — exactly the class of
   insight the Lab is for; it cost $0.014 to learn.
5. Single-sample caveat applies to all live results, as program-wide.
