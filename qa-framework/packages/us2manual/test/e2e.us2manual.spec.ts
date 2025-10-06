import { parseUsText } from "../src/parseUsText";
import { sectionToMarkdown } from "../src/mapToEmitter";

const sample = `
### Read
**TITLE:** - "Documente"
VIEW IMPLEMENTATION:
  - Pagination: Enabled, default items number: 20
**Id Column:** 
  - Name: "Id"
  - Sort: True
**Nume Column:** 
  - Name: "Nume"
  - Sort: True
CONTROLLER IMPLEMENTATION:
  - Implement sort logic (ASC, DESC) for the Id, Nume columns.
AUTH:
  - 403 on direct, non-admin role, unauth redirect '/login'
RESILIENCE:
  - Offline; SLA loading 2000ms; drop conexiune in timpul interactiunii
`;

it("parses and emits Read with pagination, sorting and auth/resilience overlays", () => {
  const plan = parseUsText(sample);
  const sec = plan.sections.Read!;
  const md = sectionToMarkdown("Read", sec);
  expect(md).toMatch(/\[pagination] Selector marime pagina/);
  expect(md).toMatch(/\[sorting] Sortare 'Id' — ASC/);
  expect(md).toMatch(/\[columns] Coloana 'Nume' — header/);
  expect(md).toMatch(/\[auth] Neautentificat — redirect/);
  expect(md).toMatch(/\[resilience] SLA incarcare/);
});


