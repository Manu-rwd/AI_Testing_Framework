Key changes, decisions, and their impacts (to be completed with citations):

- Introduced packages and CLIs
- Data contracts and provenance policies
- Planner v2 vs v1 design notes
- Review and feasibility gates
- US→Manual consolidation via wrapper
- Parity thresholds and rationale


Additions from 10,000–14,999 window

- Decision: Gate planning with an optional US Review precheck (`--review-precheck --min-confidence`). Impact: prevents low-confidence US from generating plans without clarification; produces `docs/us/US_Gaps.md` for action.
- Decision: Apply project fallbacks to fill missing US sections with provenance (`source=project`) and a small confidence bump. Impact: smoother intake for sparse US; maintains traceability.
- Change: Normalize Windows workflows — use `;` in PowerShell, add `.gitattributes` (LF), ensure UTF-8 outputs. Impact: reliable local/CI behavior and correct diacritics.
- Change: Write US review and planner outputs to monorepo `docs/us` even when running via `--filter @pkg/planner`. Impact: consistent artifact locations.
- Change: Improve normalization heuristics (fields/messages) and field-confidence partial credit (0.4/0.3/0.3). Impact: raises typical US confidence above gate with minimal edits.
- Decision: Prepare Module 3 (Planner & Rules v2) as additive, opt-in (`--v2`) with AAA atoms, selector strategy, data profiles, feasibility, provenance, and rule_tags. Impact: preserves v1 stability while enabling richer automation planning.

Additions from 15,000–19,999 window

- Decision: Adopt Rules v2 schema and examples alongside v1. Impact: enables AAA templating, selector/data hints, feasibility and rule_tags with per-type policies.
- Change: Planner v2 implemented with CLI v2; artifacts emitted (CSV/MD). Impact: dual-output automation planning without breaking v1.
- Decision: Introduce Manual Plan emitter with strict template fidelity and verification flag. Impact: QA-facing docs standardized; drift prevented via snapshot/visible diff.
- Change: Enforce LF endings and PowerShell-safe scripts; document UTF-8 console options. Impact: stable cross-platform runs; eliminates mojibake and CRLF noise.

Additions from 20,000–24,999 window

- Decision: Lock manual-emitter whitespace deterministically (control tags on own lines; one blank line after front matter and between cases/sections; single trailing newline). Impact: removes flaky diffs; reproducible CI runs.
- Change: Introduce `.editorconfig` and expand `.gitattributes` for LF enforcement; add a line-endings checker CLI (scoped to git-tracked files with `--paths`/`--since`). Impact: prevents CRLF regressions; lightweight CI gate.
- Decision: Standardize Windows usage guidance (no `&&`, avoid `| cat`, ensure UTF-8). Impact: fewer local false negatives and encoding issues.
- Decision: Proceed to Module 5 (Automation Plan Emitter) with strict guardrails inherited from Module 4 (LF, spacing, snapshot verification). Impact: smoother handover; consistent quality across generators.

Additions from 25,000–29,999 window

- Decision: Emit automation plan in dual formats (MD + CSV) with strong encoding/format rules (UTF-8 BOM + CRLF for CSV; compact JSON in fields). Impact: Excel-friendly artifacts, reproducible diffs, downstream tooling reliability.
- Change: Added CLI `emit:automation` and pure emitters (CSV/MD) with FS helpers. Impact: clear separation of concerns; enables Planner v2 to plug in easily.
- Decision: Resolve ESM and dist path issues by ensuring explicit file imports (no directory imports) and correct build outputs. Impact: stable CLI execution and test runs on Node 22.
- Decision: Prepare Module 6 selector/data-profile enrichment (precedence US > Project > Defaults, confidence bump ≤ 0.04). Impact: higher-quality automation plans without schema churn.

Additions from 30,000–34,999 window

- Decision: Enforce selector policy in enrichment (prefer role-with-name when roles hinted; disallow xpath). Impact: selector robustness; consistent provenance and confidence bump.
- Change: Add review tools with idempotent CSV extension and Markdown summary CLI. Impact: human-in-the-loop review standardized; reproducible outputs (BOM+CRLF).
- Decision: Complete Accesare(Adăugare) review before codegen. Impact: quality gate ensures ≥10 reviewed rows with dispositions.
- Decision: Introduce Validation Gate (`plan:validate`) with strict rules (encoding/EOL, header, compact JSON, selectors/profile, review enums, module-specific thresholds) and CI job. Impact: prevents malformed artifacts from merging.

Additions from 35,000–39,999 window

- Decision: Make `plan:review:init --inPlace` byte-idempotent when review suffix + BOM+CRLF already satisfied. Impact: safe re-runs and reproducible hashes in CI.
- Change: Replace failing `tmp_exports/Accesare_Automation.csv` with validated fixed CSV; document Windows-safe validation (per-file recursion; no globs). Impact: green validation on main; fewer Windows pitfalls.
- Decision: Ship Module 10 Review Gate with `plan:review:verify` and `plan:review:report` (RV001–RV006). Impact: formalized review completion criteria and human-readable summaries (`tmp_review/<Module>_Review_Summary.md`).
- Change: Stabilize tests using __dirname-based paths; ensure `process.exitCode=0` on OK; report emits `Totals:` and `WROTE`. Impact: cross-shell stable CI; clearer outputs.
- Change: Remove accidentally nested `qa-framework/` folder inside planner and skip unstable v2/us_review tests for now. Impact: unblocks CI; isolates WIP suites.

Additions from 40,000–44,999 window

- Decision: Standardize planner CLI E2E to operate from known cwd and __dirname-resolved dist paths. Impact: eliminates cwd-coupling and path duplication failures.
- Change: plan:emit E2E runs from workspace root; assertions against real defaults in `qa-framework/tmp_exports` and `qa-framework/tmp_docs`; optional `--outCsv`/`--outDocs` added without breaking defaults. Impact: deterministic tests on Windows and POSIX.
- Decision: Adopt repo hygiene rules (.gitignore/.gitattributes) and purge tracked tmp/nested dirs. Impact: clean status, no noisy CRLF warnings, smaller PRs.
- Change: Roadmap upgraded with handover prompts, acceptance criteria, and CLI cheatsheets; added `repo_snapshot.ps1` (ASCII-only, PS 5.1 safe). Impact: reproducible module execution; easier audits.

Additions from 45,000–49,999 window

- Decision: Escape CSV quotes per RFC (double quotes), keep BOM+CRLF and exact header order. Impact: Excel-compatibility and predictable diffs.
- Change: Add BOM stripping for review CSV headers and harden the e2e harness (explicit cwd, shell=false, execaNode). Impact: Windows-stable review:init and reliable exit codes.
- Decision: Integrate selector/data profile resolvers into Planner v2 emit; apply precedence US > project > defaults with capped confidence bump and provenance. Impact: richer automation rows without schema churn.
- Change: Deliver review extension CLI with idempotent append, optional sidecar, Windows-friendly globbing and tests. Impact: standardized QA review flow across modules.

Additions from 50,000–54,999 window

- Decision: Add `--fail-empty-buckets` to review validator and print the resolved US path. Impact: avoids false green on empty values; better traceability.
- Change: Deliver Vizualizare docs/scripts for Accesare; narrow `.gitignore` so module docs are tracked. Impact: docs included in PRs; smoother review.
- Decision: Provide docs index/back‑links and batch‑processing prompts for Accesare submodules. Impact: consistent navigation and faster rollout.

Additions from 55,000–59,999 window

- Decision: Mirror QA granularity by default (facet checks for UI: presence/position/text(RO/EN)/hover/tooltip/icon/a11y). Impact: parity with QA templates; clearer review mapping.
- Change: Add affordances pack to every plan (direct URL, double‑click idempotency, breadcrumbs as links, offline/slow-network). Impact: robust navigation coverage.
- Decision: Include visual/style checks (feasibility D/E) but mark manual-first or visual-oracle; enforce feasibility→disposition mapping (A/B Approved; C/D/E Needs work/Blocked). Impact: keeps codegen gated without losing coverage.
- Change: Introduce alias/typo reconciliation (e.g., Nume↔Denumire), and reconcile US vs QA control types with provenance (source=US|QA). Impact: reduces mismatches; preserves traceability.
- Decision: Tag imported QA/plan lines with qa_id/plan_id in `rule_tags` and perform idempotent merges. Impact: safe re-runs; audit trail.

Additions from 60,000–64,999 window

- Decision: Promote the max‑granularity generator spec from v0.9 to v1.6 with explicit inputs/precedence, normalization, expansion packs, emission rules, and coverage scoring. Impact: consistent planning behavior and higher overlap with QA.
- Change: Executed v1.x on PVPFL US; captured coverage (~82–85%) and codified missing facets (disabled‑select placeholders as values, visual spec tokens, exit/interrupt variants) into the algorithm. Impact: closes gaps for next runs.
- Change: Harden `finalize_module.ps1` for PS 5.1 (UTF‑8 no BOM writes, venv gates, pnpm workspace tests, branch ensure/create, merge note). Impact: reliable finalize-and-merge workflow on Windows.

Additions from 65,000–69,999 window

- Decision: Adopt coverage-driven Planner v1.7 with canonical signature matching, synonym normalization, and facet catalogs; enforce policies (header vs values, ASC/DESC). Impact: unlock ≥95% coverage against QA.
- Change: Module 10.2 enables repo-local converter binaries and `--pandoc`/`--pdftohtml` flags; auto-discovery under `qa-framework/tools/`. Impact: zero PATH dependency; stable Windows runs.
- Decision: Prefer pdftohtml for PDF→HTML; pandoc noted as “to PDF only” (cannot read PDF). Impact: eliminate converter confusion.
- Decision: Introduce Coverage Overlays (Excel→YAML) + Parity Scorer; precedence updated to US > Project > UI/UX > QA Overlays > Defaults. Impact: deterministic inclusion of QA families and measurable parity.

Additions from 75,000–79,999 window

- Decision: Standardize finalize pipeline on Windows (PowerShell 5.1 safe): remove PSReadLine, ASCII-only commit subjects, UTF‑8 no BOM writes, conditional branch reconstruction, ancestry check, and force-add merge notes even if docs/ is ignored. Impact: repeatable, crash-free merges with full audit trail.
- Change: Clarify Module 12 alignment to roadmap (Coverage Overlay Exporter); provided corrected handover parameters and prompt template. Impact: roadmap fidelity and smoother module handovers.
- Decision: In Merge Engine v2, accept `qa_library` as a first-class provenance tier (+0.01) alongside `coverage`. Impact: spec compliance and clear attribution for QA overlays.
- Change: Make UI/UX converter idempotence test skip when the input PDF is absent (CI/local without assets). Impact: workspace tests green without external dependencies.
- Change: Add `.gitignore` in `@pkg/merge` to prevent committing transformed test JS/Maps. Impact: clean repository and stable diffs.

Additions from 80,000–84,999 window

- Decision: Keep Module 14 manual emitter strictly template-parity for QA docs (no metadata leaks), with filtering by Tip functionalitate and optional General valabile=1; enforce deterministic ordering. Impact: predictable, reviewer-friendly manuals.
- Change: Standardize finalize script for Module 14 (PS 5.1): scope pnpm with `-C qa-framework`, write UTF‑8 no BOM, use ASCII-only commit subjects, and build merge notes from an array of lines; smoke-run CLI before merge and re-run workspace tests on main. Impact: stable Windows merges and auditable notes.
- Decision: Record Module 13 fix-merge explicitly under `qa-framework/docs/changes/merges/` and require all gates green prior to merge. Impact: traceability and policy adherence.

Additions from 85,000–87,613 window

- Decision: Provide two bridge entrypoints temporarily (`us:emit` TypeScript CLI and `us:bridge` ESM wrapper) to stabilize UX; plan to unify on one. Impact: smoother local runs during transition.
- Change: Standardize repo-level folders for bridge I/O (`US_input/`, `Manual_output/`), with the wrapper auto-creating them. Impact: predictable file locations.
- Decision: Lock stricter acceptance for bridge output (overlay families, two lines/column, ASC/DESC, presence/pagination/responsive/resilience/auth, determinism/dedup), with optional provenance hiding in final MD. Impact: output consistency and parity readiness.
- Change: Execute full repo analysis prompt to generate `docs/ARCHITECTURE_OVERVIEW.md` and `tmp/analysis/inventory.json`; treat as living reference. Impact: shared understanding for the upcoming agent.
