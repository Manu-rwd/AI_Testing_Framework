# Modul Review — Propuneri_tehnice (Centralizatoare)
> Înapoi la [Propuneri_tehnice — Index](Propuneri_tehnice.md)

## Status & Scope
- Status: Needs work
- Modul: Propuneri_tehnice — Centralizatoare
- Sursă: US (prioritar) + QA (practici), project (fallback)

## Rezumat review
### După dispoziție
| Dispoziție | Nr. |
|------------|-----|
| Approved   | 40 |
| Needs work | 1 |
| Blocked    | 1 |

### După fezabilitate
| Fezabilitate | Nr. |
|--------------|-----|
| A | 27 |
| B | 13 |
| C | 1 |
| D | 1 |
| E | 0 |

## Observații & note
- Selectorii de coloană pentru Added/Updated necesită id/data-testid dedicate.
- Pentru meniul de navigare recomandăm `data-testid` pe fiecare nod.
- Stările offline/lent necesită oracol vizual sau hook de mesaj.
- Duplicate name: nevoie de seed fix pentru un nume existent (ex: Alpha).

## Changelog
- 2025-09-15: Prima generare a planului pentru Centralizatoare (QA-granular, idempotent).

## Cheatsheet CLI (PowerShell)
# exemple; separator ';' în loc de '&&'
pnpm --filter @pkg/planner start -- --area "Propuneri_tehnice" --func "Centralizatoare" --emit csv --out .\exports ;
node .\review\extend_csv.ts --in .\exports\Propuneri_tehnice_Centralizatoare.csv --schema v1 ;
pnpm --filter @pkg/planner start -- --area "Propuneri_tehnice" --func "Centralizatoare" --emit md --out .\docs\modules
