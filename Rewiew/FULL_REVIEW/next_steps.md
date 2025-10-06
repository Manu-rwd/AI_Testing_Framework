Prioritized next steps (draft; to be refined after full processing):

1) Finalize Project Standards Pack
2) Run US Review and gate by confidence
3) Lock data contracts (US_Normalized, Rules v2, Plan schemas)
4) Planner v2 improvements and module reviews
5) Parity scoring and acceptance thresholds
6) Codegen for A/B, executor and artifacts


Additions after 10,000–14,999 processing

- Open PR for Module 2 (feature/us-review) using prepared `qa-framework/PR_BODY.md`; ensure CI checks and ADEF gates pass.
- Complete Module 3 one-shot (Planner & Rules v2) in a new Cursor session; keep v1 paths intact; add scripts.
- Implement manual emitter via QA template; emit `docs/modules/<Module>_Manual.md`.
- Run US review on Accesare and produce dual plans (Manual + Automation); finalize review columns and approvals.
- Prepare codegen for feasibility A/B rows and wire executor + artifacts; plan CI integration and Xray/TestRail export.

Additions after 15,000–19,999 processing

- Open PRs for Module3 (Planner & Rules v2) and Module4 (Manual Emitter); attach ADEF change docs and CI notes.
- Harden CI: run planner v2 test, manual-emitter snapshot, and verify LF via `.gitattributes`.
- Begin Module 5 — Automation Plan Emitter (atoms + selectors + data profiles + feasibility; CSV/MD) using Planner v2 outputs.
- Align GUI plan: minimal US intake → review/gaps → dual outputs → verify snapshot → codegen gate.

Additions after 20,000–24,999 processing

- Stand up a CI job for line-endings check (scoped to tracked sources) and manual-emitter snapshot; fail on CRLF/mismatch.
- Adopt `.editorconfig` and expanded `.gitattributes` in all new modules; run one-off `git add --renormalize .` as needed.
- Execute Module 5 — Automation Plan Emitter (atoms/selectors/data profiles/feasibility; MD/CSV) and wire tests + CLI.
- Produce a Module 5 PR with guard checklist (LF/spacing/snapshots/UTF-8 console) and Windows-safe repro steps.

Additions after 25,000–29,999 processing

- Open PR for `feature/automation-emitter`; ensure CSV tests assert BOM/CRLF, compact JSON, and quoting; MD snapshot stable.
- Kick off Module 6 — Selector Strategy & Data Profiles: implement selector policy engine, data-profile resolver, v2 enrich, CLI `plan:enrich`, and tests/fixtures; ensure confidence bump caps and provenance notes.
- Wire `plan:enrich --emit` to call Module 5 emitter, producing enriched CSV/MD for Accesare; validate ≥10 enriched rows.

Additions after 30,000–34,999 processing

- Merge Module 6 (selector/data profiles), Module 7 (review tools), Module 8 (Accesare review) PRs; attach ADEF change docs and screenshots of outputs.
- Add Validation Gate to CI (validate.yml) and run locally with `validate:sample` before PRs.
- Extend selector/data-profile policies to other modules; prepare fixtures and enrich runs; ensure provenance and confidence caps.
- Begin codegen gating: only generate tests for rows with review_disposition=ok and feasibility in {A,B}; stage Module 10 plan.

Additions after 35,000–39,999 processing

- Merge `chore/m9-finalize` and `feat/review-gate-m10` PRs; ensure validate.yml and review-gate.yml CI are green.
- Backfill README with validation badge if missing; add Windows notes (no globs; remove PSReadLine if unstable).
- Extend review gate to other modules; generate `tmp_review/<Module>_Review_Summary.md` artifacts and store in CI.
- Re-enable/repair v2 and us_review tests or mark as `.skip.ts` until aliases are wired.

Additions after 40,000–44,999 processing

- Keep planner tests green by enforcing __dirname/cwd discipline on new E2Es; prefer workspace-root cwd for defaults-based CLIs.
- Extend plan:emit flags in docs (optional `--outCsv`/`--outDocs`); keep defaults unchanged.
- Maintain repo hygiene: ensure `.gitignore`/`.gitattributes` remain current; avoid tracking tmp outputs; renormalize after large merges.
- Use `repo_snapshot.ps1` on demand to attach repo status to PRs or reviews.

Additions after 45,000–49,999 processing

- Open/merge PRs for Module 5 hardening, Module 6 integration, and Module 7 review extender; attach ADEF change docs; confirm CI green.
- Keep review tools e2e robust: maintain execaNode launcher, explicit cwd, shell=false; ensure BOM stripping remains in CSV readers.
- Expand selector/data profile coverage to additional modules; verify provenance + capped confidence; update MD sections accordingly.
- Socialize QA flow: run extend_csv on legacy exports, fill dispositions/feasibility, and gate codegen; document sidecar usage.

Additions after 50,000–54,999 processing

- Finalize Accesare docs polish: add index/back‑links and keep docs tracked; roll Accesare submodules via batch prompts.
- Adopt validator `--fail-empty-buckets` by default; re-run validate/report after QA reviews.

Additions after 55,000–59,999 processing

- Batch-convert remaining Excel sheets using the standardized schema/template/runbook; maintain qa_id/plan_id traceability and idempotent merges.
- Keep QA‑granular generator ON; verify parity-by-bucket against QA templates; export traceability matrix when helpful.
- Include visual/style checks as D/E; plan adoption of a visual oracle (Percy/Applitools) before enabling codegen for those.
- For ERP-integrated flows, capture environment URLs in data_profile; add seed hints for pagination/toggles; confirm US-vs-QA control types via provenance.

Additions after 60,000–64,999 processing

- Upgrade planner to v1.6 everywhere (docs + CLI help); ensure expansions include disabled‑select placeholder assertions, visual spec tokens, and exit/interrupt cases.
- Re-run PVPFL with v1.6 to target ≥95% overlap; generate coverage diff vs QA and update notes in `docs/modules/PVPFL_Manual.md` and CSV tags (qa_id, plan_id, route_alias).
- Keep `finalize_module.ps1` as the standard finalize flow: PS 5.1‑safe, UTF‑8 no BOM, gates + workspace tests, branch ensure/create, merge note. Document usage in README.

Additions after 65,000–69,999 processing

- Implement Coverage Overlay Exporter (Excel→YAML) and Parity Scorer; update planner to v1.7 rules (headers vs values, ASC/DESC, synonym maps) to reach ≥95%.
- Finish UI/UX ingestion path: ensure converter uses repo-local `pdftohtml` (or explicit flag) and feed uiux.yaml into merge precedence (US > Project > UI/UX > QA Overlays > Defaults).
- Publish a short README section for Windows: run from repo root or drop `-C`; repo-local tools; preferred `pdftohtml` for PDF→HTML.

Additions after 75,000–79,999 processing

- Adopt the standardized finalize pipeline for all upcoming modules: use ASCII-only commit subjects, UTF-8 no BOM writes, conditional branch reconstruction, ancestry checks, and force-add merge notes under `qa-framework/docs/changes/merges/`.
- Update `@pkg/merge` provenance policy in docs to list `qa_library` (+0.01) explicitly; ensure downstream emitters/validators recognize this tier.
- Keep workspace tests green: guard tests that need external assets (e.g., UI/UX PDF) with existence checks and skip when absent.
- Prepare Module 12 execution with corrected branch/slug (feature/coverage-overlays, noteSlug=coverage) and then proceed to Module 13+ using the reusable `finalize_module.ps1` flow.

