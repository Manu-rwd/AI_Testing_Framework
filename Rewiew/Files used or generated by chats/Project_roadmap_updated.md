# AI Testing Framework — Roadmap (Updated with Handover Prompts, Acceptance Criteria & CLI Cheatsheet)

## ✅ Done
- **Module 1 — Project Standards Pack**
- **Module 2 — US Review Agent & Normalization**
- **Module 3 — Planner & Rules v2**

## 🚧 Current Next Step

**Module 4 — Manual Plan Emitter (QA template)**  
_Status: in progress — branch `Module4` exists; one-shot prompt not yet executed in Cursor._  

👉 **Handover Prompt (paste into a new ChatGPT chat in this project):**
```
I want the one-shot prompt for Cursor so it can implement Module 4 — Manual Plan Emitter (QA template).
Branch: Module4
```

**Acceptance Criteria:**
- Manual plan rendered strictly in QA Markdown template (1:1 format).  
- Headings, numbering, spacing must match QA template exactly.  
- No automation metadata leaks.  
- Snapshot tests confirm byte-for-byte match with expected `.md`.  

**CLI Cheatsheet:**
```powershell
# Run emitter
pnpm planner:emit:manual -- --in packages/planner/test/fixtures/manual/input.acc-adaugare.json --out-manual-md docs/modules/Accesare_Manual.md

# Run tests
pnpm test:manual-emitter
```

---

## ⏳ Next Modules

### Module 5 — Automation Plan Emitter (atoms + selectors + feasibility + CSV/MD)

👉 **Handover Prompt:**
```
I want the one-shot prompt for Cursor so it can implement Module 5 — Automation Plan Emitter (atoms + selectors + feasibility + CSV/MD).
Branch: Module5
```

**Acceptance Criteria:**
- Emits `docs/modules/<Module>_Automation.md` + `exports/<Module>_Automation.csv`.  
- CSV includes: module, tipFunctionalitate, bucket, narrative_ro, atoms, selector_needs, selector_strategy, data_profile, feasibility (A–E), source, confidence, rule_tags, notes.  
- Markdown shows Romanian narrative + AAA atoms + feasibility badge.  
- UTF-8 only; Windows-safe CSV.  

**CLI Cheatsheet:**
```powershell
# Generate automation plan
pnpm planner:v2:adaugare -- --out-csv exports/Plan_Adaugare_v2.csv --out-md docs/Plan_Adaugare_v2.md
```

---

### Module 6 — Selector Strategy & Data Profiles

👉 **Handover Prompt:**
```
I want the one-shot prompt for Cursor so it can implement Module 6 — Selector Strategy & Data Profiles.
Branch: Module6
```

**Acceptance Criteria:**
- Selector strategies resolved per project standards (prefer `data-testid` / role).  
- Data profiles generated for fields (minimal_valid, invalid_regex, edge_*).  
- At least 10 rows from Accesare (Adăugare/Vizualizare) show correct strategies + profiles.  

**CLI Cheatsheet:**
```powershell
# Generate plan with selectors and data profiles applied
pnpm planner:v2:adaugare -- --project ./projects/example --apply-project-fallbacks
```

---

### Module 7 — Feasibility & Review Tools

👉 **Handover Prompt:**
```
I want the one-shot prompt for Cursor so it can implement Module 7 — Feasibility & Review Tools.
Branch: Module7
```

**Acceptance Criteria:**
- Extends existing CSVs with review columns: disposition, feasibility, selector_needs, parameter_needs, notes.  
- CLI helper (`extend_csv.ts`) appends review fields without altering existing data.  
- Review metadata optionally saved as JSON sidecar.  
- Reviewed CSVs accepted by QA team.  

**CLI Cheatsheet:**
```powershell
# Extend CSV with review fields
pnpm review:extend -- exports/Accesare.csv
```

---

### Module 8 — Module Review: Accesare (Adăugare)

👉 **Handover Prompt:**
```
I want the one-shot prompt for Cursor so it can implement Module 8 — Module Review: Accesare (Adăugare).
Branch: Module8
```

**Acceptance Criteria:**
- Reviewed `exports/Accesare.csv` includes dispositions + feasibility.  
- `docs/modules/Accesare.md` updated with changelog.  
- Module marked “Approved” after QA validation.  
- Strict bucket compliance verified.  

**CLI Cheatsheet:**
```powershell
# Open CSV in review mode (after extend)
Start-Process exports/Accesare.csv
```

---

### Module 9 — Module Review: Accesare (Vizualizare)

👉 **Handover Prompt:**
```
I want the one-shot prompt for Cursor so it can implement Module 9 — Module Review: Accesare (Vizualizare).
Branch: Module9
```

**Acceptance Criteria:**
- Same process as Module 8, applied to Vizualizare sheet.  
- Reviewed CSV extended with dispositions/feasibility.  
- Markdown updated with review notes + changelog.  
- Module marked “Approved”.  

**CLI Cheatsheet:**
```powershell
# Open Vizualizare CSV for review
Start-Process exports/Accesare_Vizualizare.csv
```

---

### Later Phases (after Reviews)
- **Module 10 — Playwright Codegen**
  - Acceptance: Generates Playwright TypeScript (EN, RO comment), only for A/B feasible cases.  
  - CLI: `pnpm codegen`  

- **Module 11 — Executor**
  - Acceptance: Local runner integrated; later MCP; artifacts saved (JUnit XML, screenshots, traces).  
  - CLI: `pnpm exec:local`  

- **Module 12+ — CI/CD & Integrations**
  - Acceptance: CI pipeline stores artifacts; sync to Xray/TestRail via JUnit.  
  - CLI: GitHub Actions / GitLab CI jobs  

- **Module 13+ — GUI & Deployment**
  - Acceptance: GUI app (no-auth → email auth); deployed on local IT server.  
  - CLI: `pnpm dev:web` / `pnpm dev:api`  

👉 Each will follow the same handover pattern:
```
I want the one-shot prompt for Cursor so it can implement Module <N> — <Goal>.
Branch: Module<N>
```
