# Modul Review — Accesare (Template-uri Index & Create)

> Înapoi la [Accesare — Index](Accesare.md)

## Status & Scope
- **Status:** Needs work
- **Modul:** Accesare — Template-uri (Index & Create)
- **Sursă:** US → Accesare → Template-uri (index/create)
- **Fișiere:** `exports/Accesare_Templates_Index_Create_Automation.csv`, `docs/modules/Accesare/Accesare_Templates_Index_Create.md`

## Rezumat review
### Distribuție pe disposition
| Disposition  | Count |
|---|---|
| Approved     | 7 |
| Needs work   | 8 |
| Blocked      | 0 |
| Drop         | 0 |
| **Total**    | 15 |

### Distribuție pe feasibility
| Fezabilitate | Count |
|---|---|
| A | 4 |
| B | 7 |
| C | 3 |
| D | 1 |
| E | 0 |

## Observații & note
- Paginarea, sortarea și filtrarea necesită oracole de date/state pentru aserții robuste.
- Crearea cu fișier și domeniu cere seed-uri (domain, sample XML) și interceptări rețea.
- Câmpurile dinamice pe baza placeholder-elor depind de parsarea XML — etapă ulterioară.

## Changelog
- 2025-09-10 (Europe/Bucharest): Inițializare document; import CSV; rezumat & status.

## Cheatsheet CLI (PowerShell)
```powershell
# Emitere plan pentru Template-uri (Index & Create)
pnpm -s planner:v2:adaugare -- `
  --out-csv exports/Accesare_Templates_Index_Create_Automation.csv `
  --out-md  docs/modules/Accesare/Accesare_Templates_Index_Create.md

# Extinde CSV cu coloanele de review (idempotent)
pnpm -s review:extend -- `
  --csv exports/Accesare_Templates_Index_Create_Automation.csv

# Regenerare Rezumat + Status în MD (idempotent)
pnpm -s review:report -- `
  --csv exports/Accesare_Templates_Index_Create_Automation.csv `
  --md  docs/modules/Accesare/Accesare_Templates_Index_Create.md

# Actualizare index Accesare.md
pnpm -s docs:update-index -- `
  --area Accesare `
  --func Templates_Index_Create `
  --status Needs work
```
