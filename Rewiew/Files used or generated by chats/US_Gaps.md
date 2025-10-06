# US Gaps — Domenii ECF (Vizualizare)

**Detected confidence summary:** 0.73  
Sections below 0.6: fields (0.3), negative_paths (0.6 borderline)

## Missing / Unclear
- No specific **fields** mentioned for filters or search; if the module supports filtering, please provide field list and regex where applicable.
- **Negative paths**: specify expected behavior for 403/401 vs. logged-out state, and for actions that fail at server level.
- **Table schema**: columns not enumerated; please confirm required columns and ordering.

## Suggested Questions (to PO/QA)
1. Are there filters or a search box on the Domains list? If yes, which fields and what validation rules?
2. What is the exact empty-state message when there are no records?
3. Should the 'Delete' action require a confirmation modal? What is the exact text of the modal?
4. For direct URL access without session, is the expected behavior a redirect to login or a 401 page?