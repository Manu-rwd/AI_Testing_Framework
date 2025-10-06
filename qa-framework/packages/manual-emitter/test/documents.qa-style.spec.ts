import { describe, it, expect } from "vitest";
import { emitManualMarkdown } from "../src/emit";

function makePlan(tip: string) {
  return {
    uiux: {
      tip,
      columns: [
        { label: "Acțiuni", sortable: false },
        { label: "Conținut", sortable: false },
        { label: "Id", sortable: true },
        { label: "Nume", sortable: true },
        { label: "Tip", sortable: true },
        { label: "Descriere", sortable: false }
      ],
      table: { paginated: true, stickyHeader: true, columnVisibilityMenu: true },
      resilience: { offline: true, slow: true, loadingSLAms: 2000, dropOnAccess: true, dropDuringAction: true },
      responsive: { breakpoints: ["md"] },
      auth: { roles: ["admin","user"], unauthRedirect: "/login" }
    }
  } as any;
}

function lines(md: string) { return md.split(/\r?\n/).filter(Boolean); }

describe("QA-style emitter — Documents", () => {
  it("emits five sections with numbering and canonical tags", () => {
    const title = "Plan de testare — Documente";
    const viz = emitManualMarkdown(makePlan("Vizualizare"), { filterTip: "Vizualizare", qaStyle: true, title });
    const add = emitManualMarkdown(makePlan("Adăugare"), { filterTip: "Adăugare", qaStyle: true, title });
    const mod = emitManualMarkdown(makePlan("Modificare"), { filterTip: "Modificare", qaStyle: true, title });
    const del = emitManualMarkdown(makePlan("Ștergere"), { filterTip: "Ștergere", qaStyle: true, title });
    const act = emitManualMarkdown(makePlan("Activare"), { filterTip: "Activare", qaStyle: true, title });

    const all = [viz, add, mod, del, act].join("\n\n");
    expect(all).toContain("## Vizualizare");
    expect(all).toContain("## Adăugare");
    expect(all).toContain("## Modificare");
    expect(all).toContain("## Ștergere");
    expect(all).toContain("## Activare");

    // No provenance HTML comments
    expect(all).not.toContain("<!-- provenance:");

    // Min count checks (coarse thresholds)
    const vizCount = lines(viz).filter(l => /^\d{2}\.\s/.test(l)).length;
    const addCount = lines(add).filter(l => /^\d{2}\.\s/.test(l)).length;
    const modCount = lines(mod).filter(l => /^\d{2}\.\s/.test(l)).length;
    const delCount = lines(del).filter(l => /^\d{2}\.\s/.test(l)).length;
    const actCount = lines(act).filter(l => /^\d{2}\.\s/.test(l)).length;
    expect(vizCount).toBeGreaterThanOrEqual(20);
    expect(addCount).toBeGreaterThanOrEqual(20);
    expect(modCount).toBeGreaterThanOrEqual(20);
    expect(delCount).toBeGreaterThanOrEqual(6);
    expect(actCount).toBeGreaterThanOrEqual(5);

    // Canonical tag examples present
    expect(all).toMatch(/\{prezenta, pozitionare, text-valoare, text-traducere\}/);
    expect(all).toMatch(/\{paginare, page-size\}/);
    expect(all).toMatch(/\{sortare, asc\}/);
    expect(all).toMatch(/\{loading, SLA\}/);
    expect(all).toMatch(/\{responsive, md\}/);
  });
});


