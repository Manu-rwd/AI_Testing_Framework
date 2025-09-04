@pkg/planner — Planner (integration)

Project Standards Integration

Usage (PowerShell):

```powershell
# Generate a draft (stub)
pnpm --filter @pkg/planner run generate

# Apply project standards and export (JSON/MD/CSV)
$env:PROJECT_ID='crm'
pnpm --filter @pkg/planner run apply

# Target a specific input file
pnpm --filter @pkg/planner run apply -- --in exports/draft_plan_Accesare.json
```


