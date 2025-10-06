---
title: Module 11 — UI/UX Guide Ingestor (MD/HTML → uiux.yaml)
date: 2025-09-25
status: proposed
---

## Summary

Implements a deterministic ingestor that parses the UI/UX guide (Markdown/HTML) and emits a normalized YAML spec with component families and facet tokens, validated with zod. Includes hashing and provenance.

## CLI

```
pnpm -C qa-framework uiux:ingest -- --project ./projects/example --in qa-framework/temp/uiux_guide.md
```

Args:
- `--project <path>`: required; project root path
- `--in <path>`: optional; guide MD/HTML path (default: `qa-framework/temp/uiux_guide.md`)
- `--out <path>`: optional; output path (default: `<project>/standards/uiux/uiux.yaml`)

Behavior:
- If input MD missing but PDF found at `qa-framework/input/Ghid UIUX - Norme si bune practici 1.pdf`, triggers converter to generate MD, then proceeds.
- Parses → maps → normalizes → validates → writes deterministic YAML.
- Records `guide_hash` (sha256) and `generated_at` ISO.

## Schema

See `packages/uiux-ingestor/src/schema.ts` for the zod schema with top-level keys: `source`, `guide_hash`, `uiux_version`, `generated_at`, `components{...}`.

## Mapping Table (high-level)

- Headings containing: Title, Breadcrumb, Table, Button, Link, Badge, Form, Toast, Modal, Loading, Pagination, Responsive, Typography, Color, Spacing, Icon map into respective component families.
- Lists, paragraphs, and table contents are normalized into facet tokens using `normalizeFacets.ts`.
- Arrays and keys are sorted to ensure snapshot-stable YAML output.

## Testing

- Unit: `packages/uiux-ingestor/test/ingestor.spec.ts` uses a small sample fixture to validate schema conformance, stable YAML snapshot (normalized newlines), and >=10 populated families.
- E2E smoke (skipped) honors PDF fallback if a temp guide exists.

## Auto-merge Policy

- If all tests pass locally and CI gates are green, auto-merge the feature branch into `main` with a merge commit and push.

## Links

- Edited files under `packages/uiux-ingestor/**` and `qa-framework/package.json`.


