## Module 6 — Selector Strategy & Data Profiles

### Added
- Selector resolver (project-policy aware) and data profile resolver with RO defaults and provenance/confidence.
- Planner v2 integration for Adăugare/Vizualizare flows.
- Updated CSV/MD emitters to include selector_strategy.* / selectors / data_profile.*.
- Example project standards under `projects/example`.

### Tests
- Unit and E2E suites added; all green locally.

### CSV Header (current order)
- module, tipFunctionalitate, bucket, narrative_ro, atoms, selector_needs, selector_strategy, selector_strategy.primary, selector_strategy.fallbacks, selector_strategy.source, selector_strategy.confidence, selectors, data_profile, data_profile.minimal_valid, data_profile.invalid_regex, data_profile.edge_cases, data_profile.source, data_profile.confidence, feasibility, source, confidence, rule_tags, notes


