import type { EmitOptions, MergedPlan, ManualLine, PlanCase } from "./types";

function normalizeDiacritics(s: string): string {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function asBool(v: any): boolean { return v === 1 || v === "1" || v === true; }

// Collect potential tip from options or data
function resolveTip(input: MergedPlan, cases: PlanCase[], opts: EmitOptions): string {
  return String(opts.filterTip || input.uiux?.tip || cases[0]?.tipFunctionalitate || cases[0]?.module || "").trim();
}

function collectCases(input: MergedPlan): PlanCase[] {
  const arrays = [input.cases, input.tests, input.plan].filter(Boolean) as PlanCase[][];
  return arrays.length ? (Array.isArray(arrays[0]) ? arrays[0] : []) : [];
}

function stableKeyOf(line: ManualLine): string {
  const f = [...(line.facets || [])].sort().join("|");
  const prov = (line.provenance||[]).join(",");
  const s = `${line.bucket}\u0001${normalizeDiacritics(line.narrative).toLowerCase()}\u0001${f}\u0001${prov}`;
  return s;
}

function stableCompare(a: ManualLine, b: ManualLine): number {
  const ba = (a.bucket||"").localeCompare(b.bucket||""); if (ba !== 0) return ba;
  const fa = (a.sort?.family||"").localeCompare(b.sort?.family||""); if (fa !== 0) return fa;
  const la = (a.sort?.label||"").localeCompare(b.sort?.label||""); if (la !== 0) return la;
  const sa = (a.sort?.scenario||"").localeCompare(b.sort?.scenario||""); if (sa !== 0) return sa;
  const ad = (a.sort?.ascDesc||"").localeCompare(b.sort?.ascDesc||""); if (ad !== 0) return ad;
  return (normalizeDiacritics(a.narrative).toLowerCase()).localeCompare(normalizeDiacritics(b.narrative).toLowerCase());
}

function pushLine(arr: ManualLine[], line: ManualLine) { arr.push(line); }

// RULE 1: Overlay families baseline
function emitOverlayFamilies(lines: ManualLine[], tip: string, input: MergedPlan) {
  const overlays = input.uiux?.overlays && Array.isArray(input.uiux.overlays) ? input.uiux.overlays : undefined;
  const families = overlays?.map(o => o.family) || baselineOverlaysForTip(tip);
  for (const fam of families) {
    pushLine(lines, {
      bucket: "overlay",
      narrative: `Familia overlay '${fam}' — verificari de baza prezente`,
      facets: ["overlay", fam],
      provenance: overlays ? ["uiux"] : ["defaults"],
      sort: { family: fam, label: fam }
    });
  }
}

function baselineOverlaysForTip(tip: string): string[] {
  const t = (tip||"").toLowerCase();
  if (["vizualizare", "viz", "raportare"].includes(t)) return ["presence", "columns", "sorting", "pagination", "responsive", "resilience", "auth"];
  if (["adaugare", "creare", "add"].includes(t)) return ["presence", "form", "validation", "responsive", "resilience", "auth"];
  if (["modificare", "editare", "edit"].includes(t)) return ["presence", "form", "validation", "responsive", "resilience", "auth"];
  return ["presence", "responsive", "resilience", "auth"]; // safe defaults
}

// RULE 2 & 3: Columns with header/value + sorting ASC/DESC
function emitColumns(lines: ManualLine[], input: MergedPlan) {
  const cols = input.uiux?.columns || [];
  for (const col of cols) {
    const label = col.label;
    // header/facets line
    pushLine(lines, {
      bucket: "columns",
      narrative: `Coloana '${label}' — header/facets vizibilitate, aliniere, iconografie${col.header?.tooltip?", tooltip":""}`,
      facets: ["tabel", "coloana", "header"],
      provenance: ["uiux"],
      sort: { family: "columns", label }
    });
    // value correctness line
    pushLine(lines, {
      bucket: "columns",
      narrative: `Coloana '${label}' — valoare corecta (format, masca, constrangeri, link/CTA)`,
      facets: ["tabel", "valoare"],
      provenance: ["uiux"],
      sort: { family: "columns", label, scenario: "value" }
    });
    if (col.sortable) {
      pushLine(lines, {
        bucket: "sorting",
        narrative: `Sortare '${label}' — ASC corecta (ASC)`,
        facets: ["sortare", "asc"],
        provenance: ["uiux"],
        sort: { family: "sorting", label, ascDesc: "ASC" }
      });
      pushLine(lines, {
        bucket: "sorting",
        narrative: `Sortare '${label}' — DESC corecta (DESC)`,
        facets: ["sortare", "desc"],
        provenance: ["uiux"],
        sort: { family: "sorting", label, ascDesc: "DESC" }
      });
    }
  }
}

// RULE 4 & 7: Presence and generic table controls
function emitPresenceAndGeneric(lines: ManualLine[], input: MergedPlan) {
  const table = input.uiux?.table || {};
  pushLine(lines, { bucket: "presence", narrative: "Container pagina/tabela/formular exista", facets: ["prezenta", "container"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "container" } });
  pushLine(lines, { bucket: "presence", narrative: "Cautare (search) vizibila si functionala", facets: ["cautare"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "search" } });
  if (table.paginated) {
    pushLine(lines, { bucket: "pagination", narrative: "Selector marime pagina vizibil si aplica filtrul", facets: ["paginare", "page-size"], provenance: ["uiux"], sort: { family: "pagination", label: "page-size" } });
    pushLine(lines, { bucket: "pagination", narrative: "Controale pager (first/prev/next/last) cu stare dezactivata la margini", facets: ["paginare", "pager"], provenance: ["uiux"], sort: { family: "pagination", label: "pager" } });
  }
  pushLine(lines, { bucket: "presence", narrative: "Rand stare incarcare (loading) / skeleton vizibil", facets: ["loading"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "loading" } });
  pushLine(lines, { bucket: "presence", narrative: "Stare fara rezultate (no results) afisata corect", facets: ["gol"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "no-results" } });
  if (table.stickyHeader) { pushLine(lines, { bucket: "presence", narrative: "Header tabel lipicios (sticky) activat", facets: ["sticky"], provenance: ["uiux"], sort: { family: "presence", label: "sticky" } }); }
  if (table.columnVisibilityMenu) { pushLine(lines, { bucket: "presence", narrative: "Meniu vizibilitate coloane disponibil", facets: ["coloane", "vizibilitate"], provenance: ["uiux"], sort: { family: "presence", label: "column-visibility" } }); }
}

// RULE 5: Resilience scenarios
function emitResilience(lines: ManualLine[], input: MergedPlan) {
  const r = input.uiux?.resilience || {};
  if (r.offline) pushLine(lines, { bucket: "resilience", narrative: "Offline — acces si afisare conform specificatiei", facets: ["offline"], provenance: ["uiux"], sort: { family: "resilience", scenario: "offline" } });
  if (r.slow) pushLine(lines, { bucket: "resilience", narrative: "Retea lenta — feedback si timeouts adecvate", facets: ["slow"], provenance: ["uiux"], sort: { family: "resilience", scenario: "slow" } });
  if (r.loadingSLAms !== undefined) pushLine(lines, { bucket: "resilience", narrative: `SLA incarcare — TTFB sub ${r.loadingSLAms}ms, spinner/schelet prezent`, facets: ["loading", "SLA"], provenance: ["uiux"], sort: { family: "resilience", scenario: "sla" } });
  if (r.dropOnAccess) pushLine(lines, { bucket: "resilience", narrative: "Drop conexiune la acces — comportament UI conform", facets: ["drop", "acces"], provenance: ["uiux"], sort: { family: "resilience", scenario: "drop-access" } });
  if (r.dropDuringAction) pushLine(lines, { bucket: "resilience", narrative: "Drop conexiune in timpul interactiunii — comportament UI conform", facets: ["drop", "interactiune"], provenance: ["uiux"], sort: { family: "resilience", scenario: "drop-during" } });
}

// RULE 6: Responsive breakpoints
function emitResponsive(lines: ManualLine[], input: MergedPlan) {
  const bps = input.uiux?.responsive?.breakpoints || [];
  for (const bp of bps) {
    pushLine(lines, { bucket: "responsive", narrative: `Breakpoint '${bp}' — layout, colapse coloane, controale critice vizibile, overflow gestionat`, facets: ["responsive", bp], provenance: ["uiux"], sort: { family: "responsive", label: bp } });
  }
}

// RULE 8: Auth split
function emitAuth(lines: ManualLine[], input: MergedPlan) {
  const auth = input.uiux?.auth || {};
  pushLine(lines, { bucket: "auth", narrative: "Neautorizat — elemente ascunse (hidden)", facets: ["hidden"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "auth", scenario: "hidden" } });
  pushLine(lines, { bucket: "auth", narrative: "Neautorizat — elemente dezactivate (disabled)", facets: ["disabled"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "auth", scenario: "disabled" } });
  pushLine(lines, { bucket: "auth", narrative: "Neautorizat — eroare la click (toast/dialog)", facets: ["eroare", "click"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "auth", scenario: "error-click" } });
  pushLine(lines, { bucket: "auth", narrative: "Neautorizat — 403 la acces direct", facets: ["403"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "auth", scenario: "403" } });
  pushLine(lines, { bucket: "auth", narrative: "Rol non-admin — permisiuni limitate", facets: ["rol", "non-admin"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "auth", scenario: "non-admin" } });
  if (auth.unauthRedirect) pushLine(lines, { bucket: "auth", narrative: `Neautentificat — redirect catre '${auth.unauthRedirect}'`, facets: ["redirect"], provenance: ["uiux"], sort: { family: "auth", scenario: "redirect" } });
}

function render(lines: ManualLine[], title: string): string {
  // de-duplicate using key
  const seen = new Set<string>();
  const uniq: ManualLine[] = [];
  for (const ln of lines) {
    const k = stableKeyOf(ln);
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(ln);
  }
  uniq.sort(stableCompare);
  const out: string[] = [ `# ${title}`, "" ];
  for (const ln of uniq) {
    const fac = (ln.facets||[]).length ? ` {facets:${(ln.facets||[]).join(", ")}}` : "";
    out.push(`- [${ln.bucket}] ${ln.narrative}${fac}`);
    if (ln.provenance && ln.provenance.length) {
      out.push(`<!-- provenance: ${ln.provenance.join(",")} -->`);
    }
  }
  out.push("");
  return out.join("\n");
}

export function emitManualMarkdown(input: MergedPlan, opts: EmitOptions): string {
  // Collect and optionally filter by tip/general (only influences inclusion of US-derived lines; UIUX overlays always included)
  const allCases = collectCases(input);
  const tip = resolveTip(input, allCases, opts);
  const filteredCases = allCases
    .filter(c => !opts.filterTip || (c.tipFunctionalitate || c.module) === opts.filterTip)
    .filter(c => !opts.includeGeneralOnly || asBool(c.general_valabile));

  const lines: ManualLine[] = [];
  // overlays always
  emitOverlayFamilies(lines, tip, input);
  // presence + generic
  emitPresenceAndGeneric(lines, input);
  // columns and sorting
  emitColumns(lines, input);
  // resilience
  emitResilience(lines, input);
  // responsive
  emitResponsive(lines, input);
  // pagination specifics were included in presence generic (page-size/pager)
  // auth split
  emitAuth(lines, input);

  // If we ever want to include US-derived lines, we could map them here, but parity scorer relies on precise narratives; skipping by design.

  const title = opts.title || `Plan de testare — ${tip || "Manual"}`;
  // If nothing, still emit header and blank line for idempotence
  return render(lines, title);
}


