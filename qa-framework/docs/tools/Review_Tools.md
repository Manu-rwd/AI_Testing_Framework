### Review Tools: CSV Extender

Adds QA review columns to existing CSV exports and optionally creates a JSON sidecar for per-row review metadata.

Added columns (in order):
- disposition: free text
- feasibility: one of A | B | C | D | E (free-form for now)
- selector_needs: notes on selector gaps
- parameter_needs: notes on data/params
- notes: general comments

#### Quick start

```powershell
pnpm review:extend -- exports/Accesare.csv
pnpm review:extend -- "exports/*.csv" --sidecar --pretty
pnpm review:extend -- exports/Accesare.csv --out exports/Accesare_ext.csv
```

#### CLI

```
Usage: review:extend [options] <files...>

Options:
  --sidecar                Write <name>.review.json next to each CSV (default: false)
  --pretty                 Pretty-print the JSON sidecar
  --out <path>             Output file or directory (default: in-place)
  --backup                 Create <file>.bak before writing in-place
  --delimiter <char>       Force delimiter if auto-detect fails (e.g., ';' or ',')
  --encoding <enc>         Input encoding (default: utf8)
  -q, --quiet              Reduce logging
  -h, --help
```

Notes:
- Idempotent: running multiple times does not duplicate columns.
- Preserves delimiter, quoting, BOM, header order, and row order.
- Sidecar path: <csv_basename>.review.json next to output CSV.


