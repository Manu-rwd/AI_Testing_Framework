# Feature: Module 6 — Selector Strategy & Data Profiles

What: Implement selector strategy resolver (project-policy driven) and data profile generator (RO defaults + overrides), integrate into Planner v2 emit path, update CSV/MD emitters, add example project standards, and tests.

Why: Improve robustness and repeatability of UI selector choices and input data modeling, aligned with project standards and provenance-aware confidence.

How:
- Added `packages/planner/src/selectors/selectorResolver.ts` and `packages/planner/src/dataProfiles/dataProfileResolver.ts`.
- Extended v2 types to carry `selector_strategy`, `selectors`, and rich `data_profile` objects.
- Integrated resolvers in `src/v2/generate.ts` for Adaugare/Vizualizare flows.
- Updated automation emitters (CSV/MD) to include new fields and RO texts.
- Added example standards under `projects/example` (Project.yaml, standards/selectors.yaml, standards/data_profiles.yaml).
- Added unit and e2e tests under `packages/planner/test/module6` and fixed emitter tests.

Impacts:
- New CSV columns and MD sections; downstream consumers should not rely on strict prior column count.
- Confidence and provenance surfaced per strategy/data profile.

Testing:
- All tests pass locally (20 files, 37 tests).
- Manual sanity checks for CSV/MD artifacts per acceptance criteria.

Links:
- Edited files: see `packages/planner/src/**`, `projects/example/**`, `packages/planner/test/**`.


