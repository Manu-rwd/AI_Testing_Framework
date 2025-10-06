Title: Comprehensive Project Overview — Human-Friendly (English) (v1.1)

Sections:
- What we started with
- Key additions and removals along the way
- Current state (packages, scripts, outputs)
- Where we are going (prioritized next steps)

Notes:
- This is a narrative overview. For code/file-level anchors, see `overview_ai.md` and `sources_index.md`.


What we started with
- A clear ambition: mirror the Romanian QA team’s Excel-based manual workflow and add automation gradually.
- Inputs: an Excel library with 9 sheets (e.g., Accesare, Autorizare, etc.) and example User Stories (`us_and_test_cases.txt`).
- High-level pipeline: US → Planner → Docs/CSV → optional Codegen → Executor/CI → GUI.

Key additions and removals along the way
- Project Standards (kept): Introduced a per-project standards layer (selectors, messages, regex, routes, permissions, coverage). When US data is missing, the project can fill gaps with provenance (source=project) and a small confidence bump.
- Planner Integration (kept): Planner now emits Markdown and CSV; CSV carries review columns for QA (disposition, feasibility, selector_needs, parameter_needs, notes). Markdown shows a US fields/regex block for reviewer context.
- US Review Agent and Gate (kept): A normalization step before planning. It converts free text into US_Normalized.yaml, computes confidence, detects gaps, and produces US_Gaps.md. Planner can be gated by a minimum confidence threshold.
- Strict vs Lax Buckets (kept): Rules allow strict (only buckets mentioned in US) or lax (diagnostic) plans.
- Manual Plan Standardization (kept): Manual docs must follow QA’s approved template exactly. The system renders manual plans via a template owned by QA.
- Automation Plan Evolution (kept): The automation plan is free to optimize: atoms (Arrange/Act/Assert), selector/data profiles, feasibility, provenance, confidence.
- CSV Review Extender (kept): A helper script adds review columns to legacy CSVs (Accesare.xlsx-derived exports) to speed up module reviews.

Current state (packages, scripts, outputs)
- Monorepo `qa-framework` with Node 22 + pnpm. Core packages visible and functioning:
  - `@pkg/planner`: CLI to generate plans; exporters (MD/CSV); optional US review precheck; shows US field/regex context in MD.
  - `@pkg/rules`: YAML-backed rules per functionality type (e.g., Adăugare), with support for buckets policy and provenance tags.
  - Project standards used during planning to fill gaps with provenance (source=project).
  - Review flow: CSVs now include QA review columns; a script can retrofit legacy files.
- Outputs demonstrated:
  - `Plan_Adaugare.md` and `Plan_Adaugare.csv` generated; content is Romanian with correct diacritics in files (console mojibake addressed via UTF-8 settings).
  - US Review Agent implemented with CLI + precheck; artifacts exist under `qa-framework/docs/us/US_Normalized.yaml` and `qa-framework/docs/us/US_Gaps.md`.
  - Planner & Rules v2 implemented (opt-in); emitted `docs/Plan_Adaugare_v2.md` and `exports/Plan_Adaugare_v2.csv`.
  - Manual Plan Emitter implemented; strict QA template at `docs/templates/manual/standard_v1.md.hbs`; output `docs/modules/Accesare_Manual.md`; verification via snapshot and visible diff.

Recent stability work (20,000–24,999 window)
- Whitespace determinism locked for manual emitter (control tags on own lines; exactly one blank line after front-matter and between cases; single trailing newline). Tests and CLI verification are now stable and green.
- Line endings enforced: `.editorconfig` (LF + final newline) and expanded `.gitattributes` plus a line-endings check CLI suitable for CI.
- Windows guidance consolidated: use `;` separators, avoid piping to `cat`, ensure UTF-8 console.

Module 5 delivery (25,000–29,999 window)
- Automation Plan Emitter added in planner with dual outputs:
  - CSV: UTF-8 BOM, CRLF, fixed column order, compact JSON in `atoms` and `rule_tags`, proper quoting.
  - MD: mirrors AAA atoms and metadata per row for readability.
- CLI `emit-automation` available; tests cover header/BOM/quoting and MD snapshot; demo outputs under `tmp_docs/` and `tmp_exports/`.

Modules 6–8 and validation gate (30,000–34,999 window)
- Selector Strategy & Data Profiles (Module 6): enrichment engine + CLI `plan:enrich`; policies enforced (prefer role-with-name when roles hinted; disallow xpath); provenance + confidence bump.
- Review Tools (Module 7): idempotently append 5 review columns to CSV; CLI `plan:review:init` and `plan:review:summary`; preserves BOM+CRLF; tests green.
- Accesare(Adăugare) Review (Module 8): ≥10 rows reviewed; idempotency verified via SHA256; summary at `docs/modules/Accesare_Review_Summary.md`.
- Validation Gate (Module 9 setup): `plan:validate` CLI with rules for BOM/CRLF, header, compact JSON, selectors/profile, review enums, and Accesare ≥10 reviewed rows; unit + E2E tests; CI workflow outlined.

Validation & Review gates (35,000–39,999 window)
- Module 9 finalized and merged: validation rules shipped under `packages/planner/src/validate/*`, CLI `plan:validate`, tests + CI ready; Windows guidance: avoid globs, recurse per-file.
- Fixed `Accesare_Automation.csv` and proved idempotency for `plan:review:init --inPlace` (byte-identical on good files).
- Module 10 delivered: `plan:review:verify` and `plan:review:report` enforce/ summarize review completion (RV001–RV006); report prints `Totals:` and `WROTE`, writing to `qa-framework/tmp_review/<Module>_Review_Summary.md`.

M10 test hardening and repo hygiene (40,000–44,999 window)
- Planner CLI tests stabilized: dist paths via __dirname; set cwd when defaults depend on workspace root.
- plan:emit E2E aligned to real defaults: outputs in `qa-framework/tmp_exports` and `qa-framework/tmp_docs`; optional `--outCsv`/`--outDocs` flags available.
- Repo hygiene: added `.gitignore` and `.gitattributes` (LF), purged nested/temporary paths, renormalized line endings; planner tests all green.
- Roadmap expanded with handover prompts, acceptance criteria, CLI cheatsheets; `repo_snapshot.ps1` added (PowerShell 5.1 safe).

M5/M6/M7 stabilization (45,000–49,999 window)
- Automation Plan Emitter hardened: proper CSV quotes escaping; BOM + CRLF + exact header order verified; MD shows feasibility badges and sections; confidence formatted to two decimals; notes include feasibility rationale.
- Review tools robust on Windows: BOM stripped from CSV headers; e2e harness uses a Node launcher with explicit cwd and shell=false; built CLI returns exit 0; inline BOM+CRLF fixture generation removes ENOENT.
- Selector/Data Profiles integrated and merged (Module 6): resolvers in Planner v2 with precedence US > project > defaults, provenance and capped confidence bump.
- Review extension CLI (Module 7): appends 5 review columns idempotently; optional JSON sidecar; Windows-friendly globbing; tests fully green.

M8 wrap and M9 delivery (50,000–54,999 window)
- Accesare (Adăugare): validator hardened (`--fail-empty-buckets`), docs cheatsheet added; toggle semantics clarified; minor path typos fixed.
- Accesare (Vizualizare): viz scripts added; `Accesare_Vizualizare.md` created with Status: Approved; `.gitignore` narrowed so docs are tracked.
- Prompts prepared for Accesare index/back‑links and batch rollout across remaining submodules.

QA integration and generator parity (55,000–59,999 window)
- Integrated QA text packs (US + QA TCs) with `qa_id`/`plan_id` traceability and idempotent merges.
- Updated plans for `Domenii_ECF` and `Proiecte_Licitatie` (Index/Create/Update/Delete); feasibility→disposition applied; seed hints captured.
- Generator defaults: QA‑granular facet checks, affordances (direct URL, double‑click, breadcrumbs links, offline/slow‑net), alias/typo reconciliation, visual checks marked D/E.
- Clarified specifics: US‑only breadcrumbs for `Domenii_ECF`; toggle (Active↔Șterse) semantics; ERP redirect flows in `data_profile`.

Algorithm consolidation and PVPFL coverage (60,000–64,999 window)
- Generator spec upgraded from v0.9 to v1.6: explicit inputs/precedence, normalization, expansion packs, emission rules, coverage scoring, and PVPFL heuristics.
- Ran PVPFL US end‑to‑end: manual QA‑style list generated; coverage ~82–85%; captured deltas (disabled‑select placeholders as values, visual spec tokens, exit/interrupt variants) and folded into v1.6.
- Release finalize flow added: `finalize_module.ps1` (PS 5.1‑safe) ensures UTF‑8 no BOM, Python gates, pnpm workspace tests, branch ensure/create, merge note; fixed Windows timeouts/quoting.

Coverage-driven planner & UI/UX converter (65,000–69,999 window)
- Planner v1.7: canonical signature + facet catalogs + synonym maps; policies to split header/value checks and ASC/DESC sorts; targets CRUD ≥95%, visual ≥85%.
- UI/UX Converter improved: repo-local binaries and `--pandoc`/`--pdftohtml` flags; auto-discovery under `qa-framework/tools/`. Note: use `pdftohtml` for PDF→HTML (pandoc can’t read PDF).
- Coverage Overlays (Excel→YAML) + Parity Scorer planned; precedence updated to US > Project > UI/UX > QA Overlays > Defaults.

Finalize pipeline and Merge Engine v2 (75,000–79,999 window)
- Finalize scripts standardized for Windows: ASCII-only commit subjects, UTF‑8 no BOM writes, conditional branch reconstruction, ancestry checks, and forced merge notes even if docs/ is gitignored.
- Module 12 alignment: confirm Coverage Overlay Exporter branch/slug/paths; corrected handover parameters provided.
- Module 13 delivered: `@pkg/merge` with deterministic precedence (US > Project > UI/UX > Coverage > Defaults) and sibling `__prov` keys; CLI `merge-plan` and tests in place; merge note written.
- Fixes merged: accept `qa_library` (+0.01) provenance bump; make converter idempotence test skip when PDF missing; add `.gitignore` to avoid committing transformed test JS; workspace gates all green.

Manual emitter package and finalize flow (80,000–84,999 window)
- Module 13 fix branch merged; gates green; notes recorded under `qa-framework/docs/changes/merges/`.
- Module 14 scaffolded `@pkg/manual-emitter` with strict template parity (no metadata leaks), Tip filtering and optional General=1, deterministic ordering; workspace script `manual:emit` added.
- Finalize script for Module 14 (PS 5.1-safe): pnpm -C scoping, UTF‑8 no BOM, ASCII commit subjects; merge note built via array join; CLI smoke-run and tests rerun on main.

US→Manual bridge and repo analysis (85,000–87,613 window)
- Bridge shipped: `@apps/us2manual` (TS CLI `us:emit`) and wrapper `qa-framework/tools/us2manual.mjs` (`us:bridge`), creating `US_input/` and `Manual_output/`, emitting Module‑16 style QA Markdown per section.
- Polished prompts enforce overlay families, two lines/column, ASC/DESC, presence/pagination/responsive/resilience/auth, provenance; later spec fixes 5-section order and canonical tags; option to hide provenance.
- Full repo analysis executed: `docs/ARCHITECTURE_OVERVIEW.md` + `tmp/analysis/inventory.json`; ~12 workspaces discovered; recommendation to unify bridge entrypoint and standardize folder names.

Where we are going (prioritized next steps)
- Lock design contracts: finalize schemas for US_Normalized.yaml, Rules v2 (strict/lax, min_confidence, required_sections), Plan CSV/MD (automation atoms + metadata), Project pack.
- Approve the US Review gate: run on US intake, produce US_Gaps.md and confidence; block planning below threshold unless project fallbacks are applied.
- Manual emitter: render QA’s manual plan via a repository template (kept under docs/templates/manual); no internal metadata leakage.
- Automation emitter: add atoms, selector_strategy, data_profile, feasibility, provenance, confidence, rule_tags to the CSV/MD consistently.
- Module Reviews: complete Accesare (Adăugare, Vizualizare) using the CSV review columns; mark Approved before codegen.
- Codegen and Executor: generate Playwright TS (EN with RO header) for A/B feasibility cases; run locally; later integrate into CI with artifacts.
- Integrations and UX: export JUnit to Xray/TestRail; optional visual oracles; simple GUI (US intake → Review Q&A → Dual Plans → Codegen) with later email auth.

Recent progress (10,000–14,999 window)
- Landed US Review Agent and optional planner gate; improved normalization heuristics and confidence weighting.
- Fixed Windows scripting quirks (`;` separators, PSReadLine issues) and added `.gitattributes` for LF normalization.
- Ensured outputs write to monorepo `docs/us` under filtered runs; pushed `feature/us-review` and prepared PR body.

Recent progress (15,000–19,999 window)
- Delivered Planner & Rules v2 (AAA atoms, selectors/data profiles, feasibility, provenance) with v2 CLI and tests.
- Delivered Manual Plan Emitter with strict whitespace template and verifier; stabilized LF/blank lines for CI.


