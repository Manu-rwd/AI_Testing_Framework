# Accesare — Index

| Submodul    | Status       | Document                                        |
|-------------|--------------|-------------------------------------------------|
| Adăugare    | Approved     | [Accesare_Adaugare.md](Accesare_Adaugare.md)   |
| Vizualizare | **Approved** | [Accesare_Vizualizare.md](Accesare_Vizualizare.md) |

## Cheatsheet (PowerShell)

```powershell
# Deschide raportul de review pentru Vizualizare
Start-Process exports/Accesare_Vizualizare.csv

# Regenerare rapidă (din directorul repo-ului)
pnpm -s --filter @pkg/planner review:viz:extend
pnpm -s --filter @pkg/planner review:viz:report
```