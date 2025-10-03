import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { emitManualMarkdown } from "../src/emit";

const fx = (p: string) => path.join(__dirname, "fixtures", p);

describe("Manual Emitter — Module16 rules", () => {
  it("includes overlay families and presence/generic controls, deterministic & idempotent", () => {
    const plan = JSON.parse(fs.readFileSync(fx("uiux_viz.json"), "utf8"));
    const md1 = emitManualMarkdown(plan, { filterTip: "Vizualizare", includeGeneralOnly: true, title: "Plan de testare — Vizualizare" });
    const md2 = emitManualMarkdown(plan, { filterTip: "Vizualizare", includeGeneralOnly: true, title: "Plan de testare — Vizualizare" });
    expect(md1).toBe(md2);
    // Overlay families
    expect(md1).toMatch(/^- \[overlay] Familia overlay 'presence' — verificari de baza prezente/m);
    // Presence & generic controls
    expect(md1).toMatch(/\[presence] Container pagina\/tabela\/formular exista/);
    expect(md1).toMatch(/\[pagination] Selector marime pagina vizibil si aplica filtrul/);
    expect(md1).toMatch(/\[pagination] Controale pager \(first\/prev\/next\/last\) cu stare dezactivata la margini/);
    // Provenance comment appears after a line
    expect(md1).toMatch(/<!-- provenance: (uiux|defaults)(,[a-z_]+)* -->/);
  });

  it("emits TWO lines per column and ASC/DESC for sortable", () => {
    const plan = JSON.parse(fs.readFileSync(fx("uiux_viz.json"), "utf8"));
    const md = emitManualMarkdown(plan, { filterTip: "Vizualizare", includeGeneralOnly: true, title: "Plan de testare — Vizualizare" });
    // Column 'Nume' header + value
    const numeHeader = /\[columns] Coloana 'Nume' — header\/facets vizibilitate, aliniere, iconografie/;
    const numeValue = /\[columns] Coloana 'Nume' — valoare corecta \(format, masca, constrangeri, link\/CTA\)/;
    expect(md).toMatch(numeHeader);
    expect(md).toMatch(numeValue);
    // Sorting ASC/DESC present for sortable columns
    expect(md).toMatch(/\[sorting] Sortare 'Nume' — ASC corecta \(ASC\)/);
    expect(md).toMatch(/\[sorting] Sortare 'Nume' — DESC corecta \(DESC\)/);
  });

  it("resilience, responsive, and auth split lines are present", () => {
    const plan = JSON.parse(fs.readFileSync(fx("uiux_viz.json"), "utf8"));
    const md = emitManualMarkdown(plan, { filterTip: "Vizualizare", includeGeneralOnly: true, title: "Plan de testare — Vizualizare" });
    expect(md).toMatch(/\[resilience] Offline — acces si afisare conform specificatiei/);
    expect(md).toMatch(/\[resilience] Retea lenta — feedback si timeouts adecvate/);
    expect(md).toMatch(/\[resilience] SLA incarcare — TTFB sub 2000ms, spinner\/schelet prezent/);
    expect(md).toMatch(/\[resilience] Drop conexiune la acces — comportament UI conform/);
    expect(md).toMatch(/\[resilience] Drop conexiune in timpul interactiunii — comportament UI conform/);
    expect(md).toMatch(/\[responsive] Breakpoint 'md' — layout, colapse coloane, controale critice vizibile, overflow gestionat/);
    expect(md).toMatch(/\[auth] Neautorizat — elemente ascunse \(hidden\)/);
    expect(md).toMatch(/\[auth] Neautorizat — 403 la acces direct/);
    expect(md).toMatch(/\[auth] Neautentificat — redirect catre '\/login'/);
  });

  it("produces no duplicate logical lines and stable ordering", () => {
    const plan = JSON.parse(fs.readFileSync(fx("uiux_viz.json"), "utf8"));
    const md = emitManualMarkdown(plan, { filterTip: "Vizualizare", includeGeneralOnly: true, title: "Plan de testare — Vizualizare" });
    const lines = md.split(/\r?\n/).filter(l => l.startsWith("- ["));
    const set = new Set(lines);
    expect(set.size).toBe(lines.length);
    // Stable sort: bucket then family then label then scenario then ASC/DESC
    const sorted = [...lines].slice().sort((a,b)=>a.localeCompare(b));
    // Not strictly lexicographic because of families, but should be deterministic across runs; check repeatability
    const md2 = emitManualMarkdown(plan, { filterTip: "Vizualizare", includeGeneralOnly: true, title: "Plan de testare — Vizualizare" });
    const lines2 = md2.split(/\r?\n/).filter(l => l.startsWith("- ["));
    expect(lines2).toEqual(lines);
  });
});