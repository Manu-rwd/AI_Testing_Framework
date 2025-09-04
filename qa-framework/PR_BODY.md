Adds @pkg/planner/src/us-review/* (schema, normalize, confidence, gaps, emit, applyProject, CLI).

Adds engine_precheck.ts; optional --review-precheck before plan generation.

Root scripts: us:review, planner:precheck.

Tests & fixtures; Windows-safe scripts (; separators), UTF-8.

Acceptance checklist

- [ ] pnpm exec tsx packages/planner/test/us_review.test.ts prints “OK - US Review”.
- [ ] pnpm run us:review … writes docs/us/US_Normalized.yaml & US_Gaps.md (UTF-8).
- [ ] Planner with --review-precheck blocks below --min-confidence and points to gaps doc.
- [ ] No breaking changes to existing planner flows when the flag is absent.
