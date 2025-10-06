import { CrudSection, PlanLiteSection } from "./types";
// Import the tuned emitter straight from source (Module 16)
import { emitManualMarkdown } from "../../manual-emitter/src/emit";

export function sectionToMarkdown(tip: CrudSection, sec: PlanLiteSection, docTitleOverride?: string): string {
  const filterTip =
    tip === "Read" ? "Vizualizare" :
    tip === "Create" ? "Adaugare" :
    tip === "Update" ? "Modificare" :
    tip === "Delete" ? "Stergere" : "Activare";

  const plan = {
    uiux: {
      tip: filterTip,
      columns: sec.columns.map(c => ({
        label: c.name,
        sortable: c.sortable,
      })),
      table: { paginated: !!sec.signals.pagination?.enabled },
      resilience: {
        offline: !!sec.signals.resilience?.offline,
        slow: !!sec.signals.resilience?.slowNetwork,
        ...(sec.signals.resilience?.loadingSLAms != null ? { loadingSLAms: sec.signals.resilience.loadingSLAms } : {}),
        dropOnAccess: !!sec.signals.resilience?.connDropOnAccess,
        dropDuringAction: !!sec.signals.resilience?.connDropDuringInteraction,
      },
      responsive: { breakpoints: sec.signals.breakpoints ?? ["md"] },
      auth: {
        ...(sec.signals.authPatterns?.unauthRedirect ? { unauthRedirect: sec.signals.authPatterns.unauthRedirect } : {}),
      },
    },
  } as any;

  const finalTitle = (docTitleOverride && docTitleOverride.trim()) && !/^\*{2,}$/.test(docTitleOverride.trim())
    ? `Plan de testare — ${docTitleOverride.trim()}`
    : `Plan de testare — ${sec.featureTitle}`;

  return emitManualMarkdown(plan, {
    filterTip,
    includeGeneralOnly: true,
    title: finalTitle,
  });
}


