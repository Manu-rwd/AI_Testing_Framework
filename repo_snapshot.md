# Repo Snapshot - Ai_Testing_Framework

**Generated:** 2025-09-08 16:55:39 +03:00
**Root:** D:/Proj/Ai_Testing_Framework

## Head
- Branch: `Module4`
- HEAD: `6cc9ddd`

```
6cc9ddd | 2025-09-08 16:47:11 +0300 | Manu RWD | chore(planner): wire CLI and scripts for manual emitter\n\nADEF: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
```

## Remotes
```
origin	git@github-personal:Manu-rwd/AI_Testing_Framework.git (fetch)
origin	git@github-personal:Manu-rwd/AI_Testing_Framework.git (push)
```

## Status (porcelain)
```
 M repo_snapshot.ps1
```

## Diff - Staged (stat)
```

```

## Diff - Staged (name-status)
```

```

## Diff - Unstaged (stat)
```
 repo_snapshot.ps1 | 176 ++++++++++++++++++++++++++----------------------------
 1 file changed, 86 insertions(+), 90 deletions(-)
```

## Diff - Unstaged (name-status)
```
M	repo_snapshot.ps1
```

## Branches (vv)
```
  Module1                          67cd90278c8bd64e17a3e495a7473f6cbc820b9e [origin/Module1] feat(project-standards): Module 1 ΓÇö Project Standards Pack\n\nChange doc: ADEF/framework/docs/changes/features/2025-09-04_module1_project_standards.md
  Module2                          73f1bcf575d6413229ac9e2262b63a675434415c [origin/Module2] Merge feature/us-review into Module2: resolve conflicts preferring feature/us-review
  Module3                          a3cb1902adb2cbdefbd7e404b35a671d58f4fb90 [origin/Module3: ahead 2] feat(planner): deterministic manual emitter whitespace\n\n- Strict template spacing; control tags isolated; no trims.\n- Exactly one blank line after front-matter and between cases/sections.\n- Emitter enforces LF + single trailing newline.\n- Verifier LF-normalizes expected.\n\nChange doc: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
* Module4                          6cc9ddddefedbaaf1858cffda5b7bff63fd40cb6 chore(planner): wire CLI and scripts for manual emitter\n\nADEF: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
  Module5                          b5a32d511cda6b0ee346e40e29bb4d2386c120cb [origin/Module5] Merge branch 'feature/automation-emitter' into Module5
  chore/m9-finalize                fd1cf1649426cb9f424561601369217efb9d42cd [origin/chore/m9-finalize] chore(m9): finalize Accesare CSV + idempotent review:init
  chore/m9-post-merge-polish       59877598d61f33a979614eac27fe1889e4a8c72f chore(csv): replace Accesare_Automation.csv with validated fixed file (BOM+CRLF, header suffix, compact JSON, selectors, review values)
  chore/replace-fixed-accesare-csv 59877598d61f33a979614eac27fe1889e4a8c72f [origin/chore/replace-fixed-accesare-csv] chore(csv): replace Accesare_Automation.csv with validated fixed file (BOM+CRLF, header suffix, compact JSON, selectors, review values)
  chore/review-accesare-adaugare   5646c44ce3b7fd128913dba3ec5d4bc472190c2e [origin/chore/review-accesare-adaugare: ahead 1] chore: remove temp review filler scripts; update tmp review summary
  feat/review-gate-m10             5ee415b0365261fe40786ec7669c1e4851e403f7 [origin/feat/review-gate-m10] chore(planner): repo hygiene ΓÇö ignore tmp outputs, remove stray dirs, normalize EOLs; keep tests green
  feature/automation-emitter       f97e03a0699ecb33e0007fb981da555710b682e5 [origin/feature/automation-emitter: ahead 3] Merge remote-tracking branch 'origin/main' into feature/automation-emitter
  feature/importer-acceseaza       36d2238e22ef628448cd76c3fd411b5b08f549d5 [origin/feature/importer-acceseaza] fix(importer): align step_hints to ΓÇÿCaz de testareΓÇÖ cells, capture Bucket, write outputs at repo root
  feature/planner-rules-adaugare   7c1028e538b89b2c86f791dc2f9e2f624a39b21b [origin/feature/planner-rules-adaugare] chore(planner): pin csv libs and add review extension tool
  feature/review-tools             3ec9ea61e1a548eee54058aeb17893fc464a78b2 [origin/feature/review-tools] feat:review-tools
  feature/selector-data-profiles   5f7f341fe5686c26ecc561043d252707b4f15c82 [origin/feature/selector-data-profiles] feat(planner): selector strategy & data profiles enrichment with CLI and tests
  feature/us-review                2bbd9e9d9308b7f9878849453f41e3ab8beca44a [origin/feature/us-review: ahead 1] chore: normalize EOL (auto LF updates)
  feature/validation-gate          cfcd7a1475bc7afb50ccbf97d582226152dbc778 [origin/feature/validation-gate] ci: conditionally run ADEF verify only if framework src exists in checkout
  main                             00c1b2c0713ed5d0144483d29d53eebc109c613a [origin/main: ahead 1] feat(planner): add manual emitter and strict QA template\n\nADEF: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
```

## Latest Tags (20)
```

```

## Recent Commits
```
6cc9ddd | 2025-09-08 16:47:11 +0300 | Manu RWD |  (HEAD -> Module4)
    chore(planner): wire CLI and scripts for manual emitter\n\nADEF: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
532908c | 2025-09-08 16:45:29 +0300 | Manu RWD | 
    test(planner): byte-identical snapshot for manual emitter\n\nADEF: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
a3cb190 | 2025-09-05 12:15:00 +0300 | Manu RWD |  (origin/module4, Module3)
    feat(planner): deterministic manual emitter whitespace\n\n- Strict template spacing; control tags isolated; no trims.\n- Exactly one blank line after front-matter and between cases/sections.\n- Emitter enforces LF + single trailing newline.\n- Verifier LF-normalizes expected.\n\nChange doc: ADEF/framework/docs/changes/features/2025-09-04_manual_plan_emitter.md
be8ddaf | 2025-09-04 16:23:12 +0300 | Manu RWD | 
    chore: normalize LF line endings (repo-wide)
b9a4102 | 2025-09-04 15:34:10 +0300 | Manu RWD |  (origin/Module3)
    feat(planner): Planner & Rules v2 ΓÇö AAA atoms, selectors/data profiles, feasibility, provenance (opt-in v2)\n\nDocs: ADEF/framework/docs/changes/features/2025-09-04_planner_rules_v2.md
9ecc76d | 2025-09-04 15:06:50 +0300 | Manu RWD | 
    Merge Module2 into main: US Review Agent & Normalization
73f1bcf | 2025-09-04 15:06:45 +0300 | Manu RWD |  (origin/Module2, Module2)
    Merge feature/us-review into Module2: resolve conflicts preferring feature/us-review
2bbd9e9 | 2025-09-04 15:05:25 +0300 | Manu RWD |  (feature/us-review)
    chore: normalize EOL (auto LF updates)
e5777d0 | 2025-09-04 14:49:18 +0300 | Manu RWD |  (origin/feature/us-review)
    chore: normalize EOL via .gitattributes
a9a84bc | 2025-09-04 14:24:50 +0300 | Manu RWD | 
    feat(planner): Module 2 ΓÇö US Review Agent & Normalization (normalize+confidence+gaps+CLI+precheck)
2e2f971 | 2025-09-04 13:59:58 +0300 | Manu RWD | 
    feat(planner): Module 2 ΓÇô US Review Agent & Normalization
f7e14de | 2025-09-04 11:44:08 +0300 | Manu RWD | 
    Revert "feat(planner): Module 2 ΓÇö integrate Project Standards and add JSON/MD/CSV exports\n\nChange doc: ADEF/framework/docs/changes/features/2025-09-04_module2_planner_integration.md"
fcf75cf | 2025-09-04 11:44:08 +0300 | Manu RWD | 
    Revert "chore(repo): add .gitattributes and planner shortcuts (planner:generate/apply)"
0980304 | 2025-09-04 11:31:31 +0300 | Manu RWD | 
    chore(repo): add .gitattributes and planner shortcuts (planner:generate/apply)
582fb72 | 2025-09-04 11:23:19 +0300 | Manu RWD | 
    feat(planner): Module 2 ΓÇö integrate Project Standards and add JSON/MD/CSV exports\n\nChange doc: ADEF/framework/docs/changes/features/2025-09-04_module2_planner_integration.md
67cd902 | 2025-09-04 10:57:51 +0300 | Manu RWD |  (origin/Module1, Module1)
    feat(project-standards): Module 1 ΓÇö Project Standards Pack\n\nChange doc: ADEF/framework/docs/changes/features/2025-09-04_module1_project_standards.md
7c1028e | 2025-09-03 13:10:09 +0300 | Manu RWD |  (origin/feature/planner-rules-adaugare, feature/planner-rules-adaugare)
    chore(planner): pin csv libs and add review extension tool
43c3429 | 2025-09-03 12:31:57 +0300 | Manu RWD | 
    feat(planner): rules engine + starter flow for Adaugare; emit CSV/MD\n\nDocs: ADEF/framework/docs/changes/features/2025-09-03_planner_rules_adaugare.md
36d2238 | 2025-09-03 11:48:17 +0300 | Manu RWD |  (origin/feature/importer-acceseaza, feature/importer-acceseaza)
    fix(importer): align step_hints to ΓÇÿCaz de testareΓÇÖ cells, capture Bucket, write outputs at repo root
990a183 | 2025-09-03 11:05:49 +0300 | Manu RWD | 
    feat(importer): Accesare XLSX importer ΓåÆ normalized JSON/CSV/MD (Tip functionalitate)\n\nDocs: ADEF change entry added for importer
8d3ba59 | 2025-09-02 14:43:25 +0300 | Manu RWD | 
    fix(repo): track qa-framework as regular dir (remove submodule link)
2efe40a | 2025-09-02 14:42:18 +0300 | Manu RWD | 
    feat(qa-framework): add monorepo scaffold with DB, docs, tooling
bb6df7d | 2025-09-02 11:56:54 +0300 | Manu RWD | 
    chore(init): initial ADEF-integrated setup
```

## Recently Changed Files
```
.cursor/rules/001-core-adef.mdc
.cursor/rules/010-change-documentation.mdc
.cursor/rules/020-quality-gates.mdc
.cursor/rules/030-logging-and-observability.mdc
.cursor/rules/040-configuration-and-security.mdc
.cursor/rules/050-error-handling-result-type.mdc
.cursor/rules/060-repo-structure-and-integration.mdc
.cursor/rules/070-commit-and-pr-standards.mdc
.flake8
.gitattributes
.github/workflows/ci.yml
.gitignore
ADEF/config/environments/development.yml
ADEF/framework
ADEF/requirements.txt
ADEF/scripts/verify_adef_integration.py
ADEF/tools/check_quality_gates.py
mypy.ini
qa-framework
qa-framework/.cursorrules
qa-framework/.editorconfig
qa-framework/.gitattributes
qa-framework/.gitignore
qa-framework/ADEF_change_doc_placeholder.md
qa-framework/apps/api/README.md
qa-framework/apps/web/README.md
qa-framework/data/projects/default.project.yaml
qa-framework/data/projects/sample.crm.project.yaml
qa-framework/data/templates/.gitkeep
qa-framework/data/templates/Accesare.normalized.json
qa-framework/docker/compose.local.yml
qa-framework/docs/modules/.gitkeep
qa-framework/docs/modules/Accesare.md
qa-framework/docs/modules/Accesare_Manual.md
qa-framework/docs/modules/Plan_Adaugare.md
qa-framework/docs/Plan_Adaugare_v2.md
qa-framework/docs/roadmap.md
qa-framework/docs/templates/manual/standard_v1.md.hbs
qa-framework/docs/troubleshooting/prisma_p1000_windows_docker.md
qa-framework/docs/us/.keep
qa-framework/docs/us/US_Gaps.md
qa-framework/docs/us/US_Normalized.yaml
qa-framework/input/Biblioteca_cazuri_de_testare-update.xlsx
qa-framework/input/us_and_test_cases.txt
qa-framework/package.json
qa-framework/package-lock.json
qa-framework/packages/agents/README.md
qa-framework/packages/codegen/.gitkeep
qa-framework/packages/db/package.json
qa-framework/packages/db/package-lock.json
qa-framework/packages/db/prisma/migrations/20250902105053_init/migration.sql
qa-framework/packages/db/prisma/migrations/migration_lock.toml
qa-framework/packages/db/prisma/schema.prisma
qa-framework/packages/db/README.md
qa-framework/packages/db/src/seed.ts
qa-framework/packages/executors/.gitkeep
qa-framework/packages/importer/data/templates/Accesare.normalized.json
qa-framework/packages/importer/docs/modules/Accesare.md
qa-framework/packages/importer/exports/Accesare.csv
qa-framework/packages/importer/package.json
qa-framework/packages/importer/src/acceseaza.ts
qa-framework/packages/importer/src/schemas.ts
qa-framework/packages/importer/src/util/normalize.ts
qa-framework/packages/importer/src/util/xlsx.ts
qa-framework/packages/planner/docs/us/US_Gaps.md
qa-framework/packages/planner/docs/us/US_Normalized.yaml
qa-framework/packages/planner/exports/draft_plan_Accesare.csv
qa-framework/packages/planner/exports/draft_plan_Accesare.enriched.json
qa-framework/packages/planner/exports/draft_plan_Accesare.json
qa-framework/packages/planner/exports/draft_plan_Accesare.md
qa-framework/packages/planner/package.json
qa-framework/packages/planner/qa-framework/tmp_validation/bad_eol.csv
qa-framework/packages/planner/qa-framework/tmp_validation/bad_header_json.csv
qa-framework/packages/planner/qa-framework/tmp_validation/good.csv
qa-framework/packages/planner/README.md
qa-framework/packages/planner/src/cli.ts
qa-framework/packages/planner/src/cli/apply.ts
qa-framework/packages/planner/src/cli/generate.ts
qa-framework/packages/planner/src/cli/index.ts
qa-framework/packages/planner/src/cli/manual.ts
qa-framework/packages/planner/src/cli/verify-snapshot.ts
qa-framework/packages/planner/src/cli_v2.ts
qa-framework/packages/planner/src/emit/csv.ts
qa-framework/packages/planner/src/emit/markdown.ts
qa-framework/packages/planner/src/emitter/manual.ts
qa-framework/packages/planner/src/engine.ts
qa-framework/packages/planner/src/engine_precheck.ts
qa-framework/packages/planner/src/exporters/csv.ts
qa-framework/packages/planner/src/exporters/markdown.ts
qa-framework/packages/planner/src/project-standards/bridge.ts
qa-framework/packages/planner/src/us-parse.ts
qa-framework/packages/planner/src/us-review/applyProject.ts
qa-framework/packages/planner/src/us-review/cli.ts
qa-framework/packages/planner/src/us-review/confidence.ts
qa-framework/packages/planner/src/us-review/emit.ts
qa-framework/packages/planner/src/us-review/gaps.ts
qa-framework/packages/planner/src/us-review/normalize.ts
qa-framework/packages/planner/src/us-review/schema.ts
qa-framework/packages/planner/src/util/paths.ts
qa-framework/packages/planner/src/util/visibleDiff.ts
qa-framework/packages/planner/src/v2/aaa.ts
qa-framework/packages/planner/src/v2/emit.ts
qa-framework/packages/planner/src/v2/feasibility.ts
qa-framework/packages/planner/src/v2/generate.ts
qa-framework/packages/planner/src/v2/provenance.ts
qa-framework/packages/planner/src/v2/templating.ts
qa-framework/packages/planner/src/v2/types.ts
qa-framework/packages/planner/test/fixtures/manual/expected.acc-adaugare.md
qa-framework/packages/planner/test/fixtures/manual/input.acc-adaugare.json
qa-framework/packages/planner/test/fixtures/rules_v2/adaugare.yaml
qa-framework/packages/planner/test/fixtures/us/basic_us.txt
qa-framework/packages/planner/test/fixtures/us/us_normalized_min.yaml
qa-framework/packages/planner/test/manual_emitter.test.ts
qa-framework/packages/planner/test/planner_v2.test.ts
qa-framework/packages/planner/test/tmp_review_tests/automation.sample.csv
qa-framework/packages/planner/test/tmp_review_tests/automation.sample.review.csv
qa-framework/packages/planner/test/tmp_validation/bad_e2e.csv
qa-framework/packages/planner/test/tmp_validation/good_e2e.csv
qa-framework/packages/planner/test/us_review.test.ts
qa-framework/packages/planner/tmp_review/Accesare_Review_Summary.md
qa-framework/packages/planner/tmp_review/automation.sample.csv
qa-framework/packages/planner/tmp_review/automation.sample.review.csv
qa-framework/packages/planner/tmp_review_cli/Accesare_Review_Summary.md
qa-framework/packages/planner/tmp_review_cli/bad.csv
qa-framework/packages/planner/tmp_review_cli/good.csv
qa-framework/packages/planner/tmp_review_cli/report.csv
qa-framework/packages/project/package.json
qa-framework/packages/project/README.md
qa-framework/packages/project/src/demo.ts
qa-framework/packages/project/src/index.ts
qa-framework/packages/project/src/loader.ts
qa-framework/packages/project/src/merge.ts
qa-framework/packages/project/src/types.ts
qa-framework/packages/project/tsconfig.json
qa-framework/packages/rules/package.json
qa-framework/packages/rules/rules/adaugare.yaml
qa-framework/packages/rules/rules_v2/adaugare.yaml
qa-framework/packages/rules/rules_v2/vizualizare.yaml
qa-framework/packages/rules/src/index.ts
qa-framework/packages/rules/src/schema.ts
qa-framework/packages/rules/src/v2/schema.ts
qa-framework/packages/schemas/package.json
qa-framework/packages/schemas/src/index.ts
qa-framework/packages/schemas/src/manual.ts
qa-framework/packages/tools/review/extend_csv.ts
qa-framework/pnpm-lock.yaml
qa-framework/pnpm-workspace.yaml
qa-framework/PR_BODY.md
qa-framework/README.md
qa-framework/tmp_docs/Accesare_Automation.md
qa-framework/tmp_exports/Accesare_Automation.csv
qa-framework/tmp_seed.js
qa-framework/tsconfig.base.json
qa-framework/tsconfig.json
repo_snapshot.ps1
tmp/01.ai_qa_framework_modular_roadmap_downloadable.md
tmp/02.initial_commit_pack_copy_paste_for_codex.md
tmp/The Future of Cursor Project Rules_ Migration from.md
```
