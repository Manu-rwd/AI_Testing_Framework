High-level milestones and pivots (will be filled after full processing):

- Bootstrap repo and ADEF integration
- Importer PR(s) and initial planner
- Rules v2 and planner evolution
- US→Manual bridge (`us2manual`) and manual-emitter
- Parity scoring setup
- Module reviews (Accesare, Vizualizare)
- Current state and pending gates


10,000–14,999 window (Module 2 focus)

- Implemented US Review Agent under `packages/planner/src/us-review/*` with normalization, confidence, gaps, emit, and project fallbacks.
- Added precheck gate (`packages/planner/src/engine_precheck.ts`) and integrated `--review-precheck` in planner CLI.
- Created tests/fixtures and confirmed “OK - US Review”. Produced `docs/us/US_Normalized.yaml` and `docs/us/US_Gaps.md`.
- Addressed Windows PowerShell issues: `;` separators, PSReadLine crashes, UTF-8 codepage, and added `.gitattributes` for LF.
- Fixed monorepo path emission for docs when running via `--filter @pkg/planner`.
- Improved heuristics for fields/messages parsing and adjusted confidence weighting (partial credit).
- Pushed `feature/us-review` and prepared `qa-framework/PR_BODY.md`; compare URL available for PR.
- Drafted handover prompt for Module 3 — Planner & Rules v2 (AAA atoms, selectors, data profiles, feasibility, provenance, rule_tags).

15,000–19,999 window (Modules 3–4)

- Module 3 — Planner & Rules v2 implemented on branch `Module3`:
  - Rules v2 schema and packs added; Planner v2 core (AAA, feasibility, provenance) and CLI v2 created.
  - Tests passed (OK - Planner v2); emitted `docs/Plan_Adaugare_v2.md` and `exports/Plan_Adaugare_v2.csv`.
  - Resolved ESM aliasing for `@pkg/rules` and normalized LF via `.gitattributes`.
- Module 4 — Manual Plan Emitter (QA template):
  - Added strict Handlebars template, emitter, CLI (`--verify-against`), visible diff helper, and snapshot tests.
  - Iterated whitespace/LF stability (single blank lines, no `~` trims, trailing newline); tests stabilized.
  - Produced `docs/modules/Accesare_Manual.md` matching the QA template.

20,000–24,999 window (Module 4 hardening, tooling)

- Stabilized manual emitter whitespace via deterministic template layout; eliminated “Line 7” and “Efort: 32.” diffs; tests green.
- Added `.editorconfig` and expanded `.gitattributes` to enforce LF + final newline; introduced line-endings checker CLI and CI guidance.
- Consolidated Windows PS guidance (use `;`, avoid piping to `cat`, enforce UTF-8 console).
- Prepared Module 5 handover (Automation Plan Emitter: atoms/selectors/data profiles/feasibility; MD/CSV) with guardrails.

25,000–29,999 window (Module 5 delivery)

- Implemented Automation Plan Emitter:
  - Emitter under `packages/planner/src/emitter/automation/*` and CLI `emit-automation`.
  - CSV: UTF-8 BOM, CRLF, strict column order, compact JSON fields, quoting; MD mirrors AAA + metadata.
  - Tests added and stabilized for header/BOM/quoting; resolved ESM import paths and dist structure.
- Branch `feature/automation-emitter` pushed; demo outputs under `tmp_docs/` and `tmp_exports/` verified.
- Drafted Module 6 handover (Selector Strategy & Data Profiles) with enrich pipeline and CLI.

30,000–34,999 window (Modules 6–8 and M9 setup)

- Module 6 — Selector Strategy & Data Profiles delivered:
  - Engines and CLI `plan:enrich`; Windows path issues resolved; tests stabilized (role-with-name preference, no xpath, provenance + confidence bump).
  - Branch `feature/selector-data-profiles` pushed; fixtures under `packages/planner/test/selector-data-profiles/fixtures/*`.
- Module 7 — Review Tools shipped:
  - CSV extender preserves BOM+CRLF and appends review columns idempotently; CLI `plan:review:init` and `plan:review:summary` added; tests green; branch pushed.
- Module 8 — Accesare(Adăugare) review completed:
  - ≥10 rows reviewed; idempotency verified by SHA256; summary MD generated; branch pushed.
- Module 9 — Validation Gate scaffolded:
  - `plan:validate` CLI and validation rules (BOM/CRLF, header, compact JSON, selectors/profile, review enums, Accesare ≥10) with unit+E2E tests; CI workflow drafted.

35,000–39,999 window (M9 finalize + M10 delivery)

- Module 9 finalized and merged:
  - Validation rules implemented under `packages/planner/src/validate/*`, CLI `plan:validate`, tests green, `.github/workflows/validate.yml` added; Windows-safe usage documented (no globs; per-file recursion).
  - Replaced bad `tmp_exports/Accesare_Automation.csv` with fixed validated CSV; ensured `plan:review:init --inPlace` is idempotent (no byte diffs); opened and finalized PR `chore/m9-finalize`.
- Module 10 — Review Completion Gate:
  - Added `plan:review:verify` and `plan:review:report` with RV001–RV006; report prints `Totals:` and `WROTE` and writes to `qa-framework/tmp_review/<Module>_Review_Summary.md`.
  - Tests and Windows-safe helper scripts delivered; resolved path issues by switching tests to __dirname-based resolution; skipped unstable v2/us_review suites; removed nested `qa-framework/` path inside planner.

40,000–44,999 window (M10 test hardening, emit e2e, repo hygiene)

- Hardened all planner CLI E2E tests to use __dirname for dist paths; added cwd where defaults depend on workspace root.
- plan:emit E2E: run from workspace root and assert defaults in `qa-framework/tmp_exports` and `qa-framework/tmp_docs`; optional `--outCsv`/`--outDocs` supported.
- Repo hygiene: added `.gitignore` and `.gitattributes` (LF); removed stray nested `qa-framework/` and tracked tmp outputs; renormalized EOLs; planner tests green (25/25).
- Roadmap updated with handover prompts + acceptance criteria + CLI cheatsheets; `repo_snapshot.ps1` added (PowerShell 5.1 safe).

45,000–49,999 window (M5/M6/M7 stabilization)

- Module 5 hardened: CSV quotes escaping fixed; BOM+CRLF+header verified; MD shows feasibility badges and expected sections; confidence 2 decimals; notes carry feasibility rationale.
- Review tools e2e stabilized on Windows: BOM-stripping for CSV headers; harness uses Node launcher with explicit cwd and shell=false; built CLI returns exit 0; inline BOM+CRLF fixture generation.
- Module 6 integrated and merged: selector/data profile resolvers active with precedence and confidence bump; example standards present; tests green.
- Module 7 delivered: review extension CLI appends 5 review columns idempotently; sidecar optional; Windows-friendly glob expansion; tests fully green.

50,000–54,999 window (M8 wrap, M9 delivery, docs hygiene)

- Module 8 — Accesare (Adăugare): validator hardening (`--fail-empty-buckets`), review flows demonstrated, docs cheatsheet added; toggle semantics clarified; typos fixed.
- Module 9 — Accesare (Vizualizare): viz scripts added; `docs/modules/Accesare_Vizualizare.md` created (Status: Approved); idempotency checks; `.gitignore` narrowed so docs tracked.
- Prepared prompts to finalize Accesare index/back‑links and to batch process all Accesare functionalities.

55,000–59,999 window (QA corpus integration; generator parity)

- Integrated QA text packs for Domenii ECF and Proiecte tip Licitație; artifacts consolidated (US + QA + plan) with `qa_id`/`plan_id` traceability and idempotent merges.
- Upgraded generator defaults: QA‑granular expansion, affordances (direct URL, double-click, breadcrumbs links, offline/slow network), alias map (Nume↔Denumire), visual checks as D/E, parity-by-bucket, feasibility→disposition mapping.
- Clarified domain specifics: breadcrumbs variant (US‑only), toggle semantics (Active↔Șterse), ERP redirect flows (dev/prod URLs) captured in `data_profile`.
- Produced handover packet to cover all Excel sheets with standardized schema, MD template, and runbook.

60,000–64,999 window (Algorithm v0.9→v1.6; PVPFL run; finalize tooling)

- Generator algorithm consolidated and upgraded: v0.9 max‑granularity spec ➜ v1.6 planner (inputs/precedence, normalization, expansions, emission rules, coverage scoring, PVPFL heuristics).
- Ran PVPFL US end‑to‑end: produced QA‑style manual list and coverage comparison (~82–85%), identified deltas (disabled‑select placeholders, visual facets, exit/interrupt variants) and folded them into v1.6.
- Release automation hardened: `finalize_module.ps1` created and iterated for PS 5.1 (UTF‑8 no BOM, venv gates, pnpm workspace tests, branch creation/merge, merge note); fixed test timeouts and Windows quirks.

65,000–69,999 window (v1.7 coverage planner; UI/UX converter local bins; overlays path)

- Planner v1.7 specified: canonical signature + facet catalogs + synonym maps; gates CRUD ≥95%, visual ≥85%; deltas surfaced and policies (headers vs values; ASC/DESC splits).
- Module 10 UI/UX Converter improved: repo-local binary discovery and `--pandoc`/`--pdftohtml` flags; tests for resolver/logging; Windows instructions; note that pandoc can’t read PDF (use pdftohtml path).
- Coverage Overlay Exporter and Parity Scorer defined; merge precedence updated to include UI/UX and QA overlays; next modules queued to reach QA-style ≥95% by design.

75,000–79,999 window (Finalize pipeline; Module 13 merge engine v2)

- Module 11 finalize: Windows-safe finalize scripts delivered (`finalize_module11.ps1`, `finalize_module11_auto.ps1`, reusable `finalize_module.ps1`); ASCII commit messages; UTF-8 no BOM; conditional branch reconstruction; ancestry check; force-add merge notes.
- Roadmap alignment: clarified Module 12 as Coverage Overlay Exporter; provided corrected handover parameters and prompt template.
- Module 13 implemented: new `@pkg/merge` with deterministic precedence (US > Project > UI/UX > Coverage > Defaults) and sibling `__prov`; CLI and tests added; finalize flow created branch, merged, and wrote dated merge note.
- Fix-ups merged: accept `qa_library` (+0.01) bump; UI/UX converter idempotence test skips when PDF missing; `.gitignore` to avoid committing transformed test JS; workspace gates fully green.

80,000–84,999 window (Module 13 fix merge; Module 14 scaffold + finalize)

- Module 13 fix branch merged into main; workspace gates green (flake8, mypy, JS tests); merge notes written under `qa-framework/docs/changes/merges/`.
- Module 14 scaffolded: `@pkg/manual-emitter` package (types, emit, CLI, tests, README) created; `manual:emit` wired at workspace level.
- Finalize script (PS 5.1-safe) for Module 14: pnpm -C scoped, UTF-8 no BOM, ASCII commit subjects; merge note built via joined array; CLI smoke-run; workspace tests re-run on main.

85,000–87,613 window (US→Manual bridge; repo analysis report)

- Added US→Manual bridge: `@apps/us2manual` (TypeScript CLI `us:emit`) and wrapper `qa-framework/tools/us2manual.mjs` (`us:bridge`), creating `US_input/` and `Manual_output/`; emits Module‑16 style Markdown per section.
- Polished Cursor prompts: auto-fix build/import, enforce overlay families, two lines/column, ASC/DESC, presence/pagination/responsive/resilience/auth, provenance; later spec locks sections order and canonical tags; option to hide provenance in final MD.
- Ran full repo scan prompt: produced `docs/ARCHITECTURE_OVERVIEW.md` and `tmp/analysis/inventory.json`; ~12 workspaces detected; confirms Module 15/16 cores and suggests unifying bridge entrypoint and folder names.

