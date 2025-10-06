# Phase A — Spec & Emitter Hardening (validated, deterministic, ≥95% parity)

Date: 2025-10-06
Type: Feature

## What

Introduce shared spec `@pkg/spec` (sections, tags, bucket→tags), validator/formatter, strict manual emitter integration, and a QA-style output mode and bridge. Add compat auth flag to satisfy legacy coverage. Keep parity ≥95%.

## Why

To make the generator deterministic and spec-validated so future agent work has solid rails, and to provide QA-style lists aligned with the team’s vocabulary and ordering.

## How

- New package `@pkg/spec`: sections, canonical tags, BUCKET_TAGS, `validateManual`, `formatManual`.
- Emitter: imports spec; deterministic ordering/dedup; compat auth lines guarded by flag; QA-style mode (numbered, canonical tags, no provenance).
- Bridge: forwards flags; QA-style skips strict validation by design; UTF-8 fixes.
- Parity E2E updated to enable compat auth lines; new QA-style test added for Documents.

## Alternatives considered

- Enforcing strict spec on QA-style output — rejected: format is not spec-markdown; we keep strict for parity runs only.

## Impacts

- Adds a new workspace package and flags; downstream scripts updated.
- Maintains backward compatibility for strict emitter/CLI.

## Testing

- `@pkg/spec` unit tests (sections, vocabulary).
- `@pkg/manual-emitter` tests (columns, sorting, resilience, auth in compat, QA-style snapshot-like checks).
- `@pkg/parity` E2E now ≥95% for Vizualizare/Adăugare/Modificare with compat flag.

## Links

- Affected: `qa-framework/packages/spec`, `qa-framework/packages/manual-emitter`, `qa-framework/tools/us2manual.mjs`, `qa-framework/packages/parity`.


