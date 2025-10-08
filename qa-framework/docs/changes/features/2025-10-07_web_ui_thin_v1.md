---
title: Minimal browser Web UI for US→Generate→Refine orchestration
date: 2025-10-07
category: Feature
links:
  - files:
      - qa-framework/package.json
      - qa-framework/apps/web-ui/package.json
      - qa-framework/apps/web-ui/server/index.ts
      - qa-framework/apps/web-ui/server/routes.ts
      - qa-framework/apps/web-ui/server/exec.ts
      - qa-framework/apps/web-ui/server/paths.ts
      - qa-framework/apps/web-ui/server/parsers.ts
      - qa-framework/apps/web-ui/src/pages/Home.tsx
      - qa-framework/apps/web-ui/src/pages/Manual.tsx
      - qa-framework/apps/web-ui/src/components/FilePicker.tsx
      - qa-framework/apps/web-ui/src/components/CaseList.tsx
---

What: Add a thin web application that exposes Home and Manual pages to drive the existing US→Generate→Refine flow via a local Node API.

Why: Provide a simple, Windows-safe, browser interface without duplicating business logic, relying on existing agent commands.

How:
- New app at qa-framework/apps/web-ui using Express (API) and Vite+React (UI).
- Server shells out using spawn with array args to:
  - node tools/us2manual.mjs --strict-spec --qa-style --no-provenance
  - pnpm -C qa-framework run agent:refine -- ...
  - optional training endpoint (deferred)
- Secrets are written to qa-framework/apps/agent/.env (no logging).

Impacts:
- Adds dev/build/start scripts in qa-framework/package.json for @apps/web-ui.
- Adds .gitignore entries for uploads/env.

Testing:
- pnpm -C qa-framework install
- pnpm -C qa-framework run webui:dev
- Navigate to http://localhost:5173 for the UI; API at 5174.
- Save API key, upload US, generate → refine, view manual, compare with QA, export selection.


