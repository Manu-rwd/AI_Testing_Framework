# Brainstorming To‑Do — Framework Roadmap Additions

> Living document capturing decisions & tasks from our sessions.  
> **Scope:** AI‑driven QA workflow (US → Review → Dual Plans → Codegen) + “Project” standards.

_Last updated: 2025-09-03 12:57_

---

## 0) Status Snapshot
- Repo bootstrap, DB, importer for **Accesare** ✅
- Planner + rules (PR #2 draft) ✅ — CSV/MD emitters, review columns
- Next: lock design (RFC + schemas), then Module Review — **Accesare (Adăugare)**

---

## 1) US Review Agent & Confidence/Gaps Gate
**Goal:** Normalize US; detect gaps; block planning below threshold.
- ☐ Implement `US_Normalized.yaml` schema (buckets, fields+regex, permissions, negatives, assumptions, confidence)
- ☐ Emit `US_Gaps.md` with actionable questions
- ☐ Gate: `min_confidence >= 0.6` before planning

**Acceptance:** Planner refuses to run until gaps addressed or project fallbacks applied.

---

## 2) Automation‑first Library v2 (Atoms)
**Goal:** Convert narrative cases to atoms (`setup / action / assert / oracle`).
- ☐ Extend normalized JSON with: `atoms[]`, `oracle_kind`, `preconditions`, `data_profile`
- ☐ Keep Romanian narratives for QA docs; use atoms for codegen

**Acceptance:** Same source yields human docs and deterministic code.

---

## 3) Extraction Algorithm v2
**Goal:** Robust selection/expansion from US + library.
- ☐ Vet US → retrieve candidate cases (by functionality + buckets)
- ☐ Atomize + parameterize with US regex / project regex
- ☐ Gap‑check via coverage templates; warn on missing parts

**Acceptance:** Planner output lists provenance per row (US|project|defaults).

---

## 4) Modules ↔ Lanes Alignment
**Goal:** Keep QA modules (Accesare, Autorizare, …) but overlay automation lanes.
- ☐ Lanes: Navigation, AuthZ/Roles, Input Validation, UI Output, Confirmation, Final Output, Re‑verification
- ☐ Map each case to a lane for oracles & selector strategy

**Acceptance:** Planner groups stay familiar; automation remains composable.

---

## 5) Feasibility & Review Flow
**Goal:** Grade for automation & capture needs.
- ☐ Heuristics for A–E (selectors present, stable oracles, deterministic data)
- ☐ Review columns: `disposition, feasibility, selector_needs, parameter_needs, notes`
- ☐ Only A/B eligible for codegen

**Acceptance:** Non‑A/B rows are held for manual/triage.

---

## 6) Selector & Data Profiles
**Goal:** Stable locators + deterministic data.
- ☐ Selector strategy: prefer `data-testid` / `role`; avoid brittle XPath
- ☐ Data profiles: `minimal_valid`, `invalid_regex`, `edge_*`; env routing (Local/Test/Prod)

**Acceptance:** Fewer flaky tests; portable across envs.

---

## 7) Tooling Quality Gates
**Goal:** Encoding, diacritics, Windows paths.
- ☐ UTF‑8 end‑to‑end; normalize newlines; diacritic checks
- ☐ Windows‑safe path handling (PowerShell friendly)

**Acceptance:** No mojibake; reproducible runs.

---

## 8) Pilot Modules
- ☐ **Accesare (Vizualizare/Adăugare)** — atomization + selectors
- ☐ **FRT‑Output final** — messages, toasts, empty states

**Acceptance:** Working examples in MD/CSV + Playwright TS.

---

## 9) Dual Plan Outputs (from one source)
**Goal:** Manual (QA template) + Automation (atoms+metadata).
- ☐ Manual plan strictly via QA’s template (owned by QA)
- ☐ Automation plan adds: atoms, selectors, data_profile, feasibility
- ☐ CLI supports `--out-manual-md` and automation outputs in one run

**Acceptance:** Zero drift between plans.

---

## 10) Integrations & CI
- ☐ Export JUnit for Xray/TestRail import
- ☐ CI runners with artifacts (trace, screenshots), OIDC secrets
- ☐ Optional visual oracle PoC (Applitools/Percy) on critical flows

**Acceptance:** Reports visible in existing QA tooling.

---

## 11) Project Layer (Standards & Fallbacks)
**Goal:** Per‑project standards fill US gaps deterministically.
- ☐ Project manifest `Project.yaml` (policies: buckets_mode=strict|lax, min_confidence, codegen threshold A/B, envs, selector_strategy_preference, use_project_fallbacks)
- ☐ Standards pack:
  - `selectors.yaml`, `messages.yaml`, `regex.yaml`, `components.yaml`, `coverage.yaml`, `env.yaml`, `permissions.yaml`
- ☐ Merge precedence: **US > Project > Global defaults**
- ☐ Provenance + confidence bump when project fills a gap

**Acceptance:** Plans show `source=project` where used.

---

## 12) Manual Plan Standardization (QA Template)
**Goal:** Manual doc matches QA’s approved structure 1:1.
- ☐ Template‑driven renderer (QA‑owned Markdown template)
- ☐ No internal metadata leaks into manual doc
- ☐ Preview side‑by‑side with automation plan

**Acceptance:** QA signs off once; reusable across modules.

---

## 13) Design Sign‑off (no coding before this)
- ☐ Short RFC (10–12 pages): flow, states, risks, UX
- ☐ Data contracts v1: US_Normalized.yaml, Rules YAML (incl. buckets.mode, min_confidence), Plan Row schema, Manual input context
- ☐ Wireframes: Intake → Review Q&A → Dual Plans → Codegen
- ☐ Decision log in repo

**Acceptance:** Stakeholders sign; then implementation PRs begin.

---

## 14) Research Integration Upgrades
**Goal:** Fold external research into design.
- ☐ Requirements quality gate (agent or tool; confidence+gaps)
- ☐ Planner: AAA atoms, strict/lax feasibility, provenance
- ☐ Flakiness architecture: fixtures, network stubbing, selector doctrine
- ☐ Security: PII redaction pre‑processor; on‑prem option
- ☐ PoCs: Playwright MCP; Visual AI; US vetting tool vs agent

**Acceptance:** Updated schemas + PoC notes reflected in RFC.

---

## Session Decisions (Locked)
- ✓ Manual plan **follows QA template**; QA owns it
- ✓ Dual plan from **one source of truth**
- ✓ **Strict buckets** by default (toggleable to lax)
- ✓ `min_confidence = 0.6` gate for planning
- ✓ Codegen only for **feasibility A/B**
- ✓ Store `US_Normalized.yaml` in **repo** (versioned)

---
