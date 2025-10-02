import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { emitManualMarkdown } from "../src/emit";

describe("Manual QA Emitter (strict parity)", () => {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures", "merged_min.json"), "utf8")
  );

  it("filters by Tip functionalitate and General valabile = 1, emits deterministic Markdown", () => {
    const md = emitManualMarkdown(fixture, {
      filterTip: "Accesare",
      includeGeneralOnly: true,
      title: "Plan de testare — Accesare"
    });

    expect(md).toMatchInlineSnapshot(`
"# Plan de testare — Accesare

## Caz 1: Accesare prin URL directa 

**Tip functionalitate:** Accesare
**General valabile:** 1
**Severitate:** medie
**Prioritate:** P2

### Preconditii
- Utilizator neautentificat

### Pasi
- Deschide browserul
- Introdu URL-ul functionalitatii

### Rezultat asteptat
- Pagina se incarca
- Se afiseaza titlul corect

### Observatii
- Timpul de raspuns sub 2s

"
    `);
  });

  it("emits an 'empty' doc when nothing matches but keeps strict structure", () => {
    const md = emitManualMarkdown(fixture, {
      filterTip: "Inexistenta",
      includeGeneralOnly: true,
      title: "Plan de testare — Inexistenta"
    });

    expect(md).toMatchInlineSnapshot(`
"# Plan de testare — Inexistenta

_Nu exista cazuri care sa corespunda filtrului configurat._

"
    `);
  });
});


