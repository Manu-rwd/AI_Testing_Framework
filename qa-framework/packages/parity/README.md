# @pkg/parity — Parity Scorer

Compute QA coverage parity between coverage YAML and manual overlays.

CLI:

```bash
pnpm -C qa-framework --filter @pkg/parity run cli -- \
  --project ./projects/example \
  --tip Vizualizare \
  --manual docs/modules/Vizualizare_Capitole_Grafice_Tehnice_Manual.md
```

Outputs:
- reports/<Area>_<Tip>_parity.json
- reports/<Area>_<Tip>_parity.md
```


