# Integrate ai development framework into project
_Exported on 9/2/2025 at 10:29:56 GMT+3 from Cursor (1.5.9)_

---

**User**

The project that we will build next, has to use the ai development framework that I've built, located on @https://github.com/Manu-rwd/ai-development-framework 
How can we do that?

---

**Cursor**

I'll look up the `ai-development-framework` repo to understand its language, install method, and usage so I can propose the best integration path.

I'll quickly fetch the repository README and setup instructions so we can choose the best integration method (dependency vs submodule vs template) and then set it up in your workspace.

I'll initialize a Git repo in your project, add your framework as a submodule, and open its README to determine the proper integration method.

I found and added your framework as a Git submodule under `vendor/ai-development-framework`. I’ll inspect its structure and copy the recommended directories (`docs`, `guidelines`, `config`) into your project, then scaffold the first change record from the template.

I'll set up integration tasks and start by copying the framework's `docs`, `guidelines`, and `config` into your project, scaffold the first change record, and commit everything.

I'll copy the recommended ADEF directories, replace `cp` with PowerShell equivalents, scaffold a feature change file, and commit. Now running the commands.

- I added your framework as a submodule at `vendor/ai-development-framework`, copied `docs`, `guidelines`, and `config` into your project, scaffolded a first change record at `docs/changes/features/2025-09-01_initial_integration.md`, and committed everything.

Next steps (optional):
- Align your future edits with ADEF docs: create change records under `docs/changes/features/` or `modifications/`.
- Keep the submodule updated: run `git submodule update --remote --merge` when you want latest framework updates.

All requested tasks are complete.

---

**User**

Ok, now based on that framework, please tell me how it will change your approach on coding the project

---

**Cursor**

### How ADEF changes our development approach

- **Documentation-first, then code**: Every task starts with a brief change record under `docs/changes/features/` or `docs/changes/modifications/` using the templates. No edits without a corresponding doc.
  - Define problem statement, scope, acceptance criteria, risks, and validation plan before coding.

- **Atomic, traceable changes**: We implement small, self-contained edits that map 1:1 to a single change record and commit. Commits and PRs reference the exact doc file.

- **Quality gates applied upfront**: Use `config/quality_gates.yml` as our checklist before/after edits (tests, lint, docs updated, risks reviewed). We don’t merge if any gate is unmet.

- **Session protocol**:
  - Start: Review open change records; confirm date/time; set the active item.
  - During: Keep scope tight; update the change record if scope shifts.
  - End: Document outcomes/decisions, record deltas, and link commits, then push.

- **Architecture and guidelines alignment**: Keep `docs/architecture/` and `guidelines/` current as we add components or patterns; update when design decisions change.

- **Templates everywhere**: Use `docs/changes/templates/` for features, fixes, security, performance, etc., to keep consistency and reduce omissions.

- **Decision logging over chat**: Capture key choices and trade-offs in the corresponding change record instead of burying them in chat history.

- **Submodule governance**: Keep `vendor/ai-development-framework` pinned; only update intentionally, and document framework version updates as their own modification change.

- **PR discipline**: One PR per change record; PR description links to the doc, lists gates passed, and includes test evidence.

- **Recovery and audits**: If something goes wrong, create a modification change record first, then fix; this preserves context and speeds rollback and audit.

Example mini-cycle per task:
1) Create change record from template → 2) Implement smallest viable edit → 3) Update docs/architecture if needed → 4) Run gates (tests/lint/review) → 5) Commit referencing the doc → 6) PR referencing the doc → 7) Close the doc with outcomes.

---

**User**

based on this, can you create me a project rule, that I can set in Cursor's settings, that will assure me you will follow each step of the framework, without me havinge to intervene? 

---

**Cursor**

I'll add a `.cursorrules` file with a clear ADEF enforcement rule and commit it so Cursor picks it up automatically for this project.

I'll create a `.cursorrules` file with ADEF enforcement rules and commit it so Cursor automatically applies them in this workspace.

```plaintext
<<'PATCH'
*** Add File: .cursorrules
+AI Development Excellence Framework (ADEF) - Project Rules for Cursor
+
+Purpose: Enforce ADEF workflow automatically for all AI actions in this workspace. If any rule cannot be satisfied, the assistant must stop, create the missing artifact, and only then proceed.
+
+Scope: Applies to all conversations, tool calls, edits, commits, and PRs performed in this repository.
+
+Core Protocol (Must Always Happen):
+- Pre-Edit Gate (Stop if unmet):
+  - Record current system date/time in a brief status update before any tool call.
+  - Ensure there is an active change record under docs/changes/features/ or docs/changes/modifications/ created from an appropriate template in docs/changes/templates/.
+  - If no record exists for the intended change, create one immediately (use today’s date in the filename). Do not write code without a change record.
+
+- Atomic Implementation:
+  - Keep the edit scope small and 1:1 with the active change record.
+  - Update docs/architecture/ and guidelines/ if architecture or standards change.
+  - Reference the active change record path in all commits and PR descriptions.
+
+- Quality Gates (config/quality_gates.yml):
+  - Before commit: run linters; fix or report errors; run tests if present.
+  - Verify acceptance criteria defined in the change record are met.
+  - If any gate fails, pause implementation and update the change record with findings and next steps.
+
+- Documentation Closure:
+  - Update the active change record with: summary of changes, files touched, risks/mitigations, validation evidence (tests/lint), and links to commits/PRs.
+  - Close or mark the change record as completed when merged.
+
+Commit & PR Conventions:
+- Commit message format: [ADEF] <concise change> (refs: <path-to-change-record>)
+- One PR per change record; PR description must link the record and list which quality gates passed.
+
+Submodule Governance:
+- The framework is vendored at vendor/ai-development-framework. Only update intentionally, always as its own documented change. Avoid silent updates.
+
+Refusal Policy (Safety Net):
+- If asked to proceed without documentation, quality gates, or beyond approved scope, politely refuse and propose to open/update the correct change record, then continue.
+
+Environment Notes (Windows/PowerShell):
+- Prefer PowerShell equivalents (Copy-Item, New-Item) over Unix utilities when manipulating files.
+
+Assistant Operational Checklist (Every Session):
+1) Start with status update including current date/time and the active change record path.
+2) If missing, create the change record from docs/changes/templates/ and set scope/acceptance criteria.
+3) Implement atomic edits only; keep scope aligned with the record.
+4) Run quality gates; fix or document failures.
+5) Update the change record with outcomes and evidence.
+6) Commit with required format; open PR referencing the record (when applicable).
+7) Close the change record upon completion.
+
+Non-Compliance Handling:
+- If any step is skipped, immediately stop, backfill the missing documentation, and re-run gates before continuing.
+
+These rules are mandatory and override convenience. Always default to documentation-first, then code.
*** End Patch
PATCH
```

```plaintext
AI Development Excellence Framework (ADEF) - Project Rules for Cursor

Purpose: Enforce ADEF workflow automatically for all AI actions in this workspace. If any rule cannot be satisfied, the assistant must stop, create the missing artifact, and only then proceed.

Scope: Applies to all conversations, tool calls, edits, commits, and PRs performed in this repository.

Core Protocol (Must Always Happen):
- Pre-Edit Gate (Stop if unmet):
  - Record current system date/time in a brief status update before any tool call.
  - Ensure there is an active change record under docs/changes/features/ or docs/changes/modifications/ created from an appropriate template in docs/changes/templates/.
  - If no record exists for the intended change, create one immediately (use today’s date in the filename). Do not write code without a change record.

- Atomic Implementation:
  - Keep the edit scope small and 1:1 with the active change record.
  - Update docs/architecture/ and guidelines/ if architecture or standards change.
  - Reference the active change record path in all commits and PR descriptions.

- Quality Gates (config/quality_gates.yml):
  - Before commit: run linters; fix or report errors; run tests if present.
  - Verify acceptance criteria defined in the change record are met.
  - If any gate fails, pause implementation and update the change record with findings and next steps.

- Documentation Closure:
  - Update the active change record with: summary of changes, files touched, risks/mitigations, validation evidence (tests/lint), and links to commits/PRs.
  - Close or mark the change record as completed when merged.

Commit & PR Conventions:
- Commit message format: [ADEF] <concise change> (refs: <path-to-change-record>)
- One PR per change record; PR description must link the record and list which quality gates passed.

Submodule Governance:
- The framework is vendored at vendor/ai-development-framework. Only update intentionally, always as its own documented change. Avoid silent updates.

Refusal Policy (Safety Net):
- If asked to proceed without documentation, quality gates, or beyond approved scope, politely refuse and propose to open/update the correct change record, then continue.

Environment Notes (Windows/PowerShell):
- Prefer PowerShell equivalents (Copy-Item, New-Item) over Unix utilities when manipulating files.

Assistant Operational Checklist (Every Session):
1) Start with status update including current date/time and the active change record path.
2) If missing, create the change record from docs/changes/templates/ and set scope/acceptance criteria.
3) Implement atomic edits only; keep scope aligned with the record.
4) Run quality gates; fix or document failures.
5) Update the change record with outcomes and evidence.
6) Commit with required format; open PR referencing the record (when applicable).
7) Close the change record upon completion.

Non-Compliance Handling:
- If any step is skipped, immediately stop, backfill the missing documentation, and re-run gates before continuing.

These rules are mandatory and override convenience. Always default to documentation-first, then code.

```

I added `.cursorrules` to enforce ADEF in Cursor for this workspace. Cursor will now guide me to:

- Require a change record before edits, and log date/time per session.
- Keep edits atomic and mapped to a single doc under `docs/changes/...`.
- Apply quality gates and refuse to proceed if unmet.
- Use commit/PR conventions referencing the doc.
- Stop and backfill missing docs if anything’s skipped.

If you’d like, I can also paste this rule into Cursor’s global Settings > Rules so it applies across projects, but keeping it project-scoped is safer.

- Added `.cursorrules` with mandatory ADEF workflow rules; committed referencing `docs/changes/features/2025-09-01_initial_integration.md`.

