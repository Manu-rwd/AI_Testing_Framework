import type { EmitOptions, MergedPlan, ManualLine, PlanCase } from "./types";
import { BUCKET_TAGS, formatManual, Tag } from "@pkg/spec";

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

function toQaTags(bucket: string, narrative: string, facets: string[]): string[] {
  const lowerNarr = (narrative || "").toLowerCase();
  const tags = new Set<string>();
  switch ((bucket || "").toLowerCase()) {
    case "presence": {
      tags.add("prezenta");
      if (lowerNarr.includes("cautare")) tags.add("cautare");
      if (lowerNarr.includes("loading") || lowerNarr.includes("incarcare") || lowerNarr.includes("skeleton")) tags.add("loading");
      if (lowerNarr.includes("fara rezultate")) tags.add("gol");
      if (lowerNarr.includes("sticky")) tags.add("sticky");
      if (lowerNarr.includes("vizibilitate coloane") || lowerNarr.includes("vizibilitate")) { tags.add("vizibilitate"); }
      break;
    }
    case "columns": {
      if (lowerNarr.includes("header")) { tags.add("tabel"); tags.add("coloana"); tags.add("header"); }
      if (lowerNarr.includes("valoare")) { tags.add("tabel"); tags.add("valoare"); }
      break;
    }
    case "sorting": {
      tags.add("sortare");
      if (lowerNarr.includes("asc")) tags.add("asc");
      if (lowerNarr.includes("desc")) tags.add("desc");
      break;
    }
    case "pagination": {
      tags.add("paginare");
      if (lowerNarr.includes("selector") || lowerNarr.includes("marime")) tags.add("page-size");
      if (lowerNarr.includes("pager") || lowerNarr.includes("first/prev/next/last")) tags.add("pager");
      break;
    }
    case "responsive": {
      tags.add("responsive");
      if (lowerNarr.includes("'md'")) tags.add("md");
      break;
    }
    case "resilience": {
      if (lowerNarr.includes("offline")) tags.add("offline");
      if (lowerNarr.includes("lenta")) tags.add("slow");
      if (lowerNarr.includes("ttfb") || lowerNarr.includes("sla")) { tags.add("loading"); tags.add("SLA"); }
      if (lowerNarr.includes("drop") && lowerNarr.includes("acces")) { tags.add("drop"); tags.add("acces"); }
      if (lowerNarr.includes("drop") && lowerNarr.includes("interactiune")) { tags.add("drop"); tags.add("interactiune"); }
      break;
    }
    case "auth": {
      if (lowerNarr.includes("redirect")) tags.add("redirect");
      break;
    }
  }
  return Array.from(tags);
}

function renderQa(lines: ManualLine[], tip: string, title: string): string {
  const body: string[] = [];
  let idx = 1;
  for (const ln of lines) {
    if ((ln.bucket || "").toLowerCase() === "overlay") continue;
    const provided = Array.isArray(ln.facets) ? ln.facets : [];
    const inferredTags = provided.length ? provided : toQaTags(ln.bucket, ln.narrative, ln.facets || []);
    const ii = String(idx).padStart(2, "0");
    const tagStr = inferredTags.length ? ` {${inferredTags.join(", ")}}` : "";
    body.push(`${ii}. ${ln.narrative}${tagStr}`);
    idx++;
  }
  const header = [`# ${title}`, ``, `## ${tip}`, ...body, ``];
  return header.join("\n");
}

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
      facets: (BUCKET_TAGS.columns_header ?? []) as unknown as string[],
      provenance: ["uiux"],
      sort: { family: "columns", label }
    });
    // value correctness line
    pushLine(lines, {
      bucket: "columns",
      narrative: `Coloana '${label}' — valoare corecta (format, masca, constrangeri, link/CTA)`,
      facets: (BUCKET_TAGS.columns_value ?? []) as unknown as string[],
      provenance: ["uiux"],
      sort: { family: "columns", label, scenario: "value" }
    });
    if (col.sortable) {
      pushLine(lines, {
        bucket: "sorting",
        narrative: `Sortare '${label}' — ASC corecta (ASC)`,
        facets: (BUCKET_TAGS.sorting_asc ?? []) as unknown as string[],
        provenance: ["uiux"],
        sort: { family: "sorting", label, ascDesc: "ASC" }
      });
      pushLine(lines, {
        bucket: "sorting",
        narrative: `Sortare '${label}' — DESC corecta (DESC)`,
        facets: (BUCKET_TAGS.sorting_desc ?? []) as unknown as string[],
        provenance: ["uiux"],
        sort: { family: "sorting", label, ascDesc: "DESC" }
      });
    }
  }
}

// RULE 4 & 7: Presence and generic table controls
function emitPresenceAndGeneric(lines: ManualLine[], input: MergedPlan) {
  const table = input.uiux?.table || {};
  pushLine(lines, { bucket: "presence", narrative: "Container pagina/tabela/formular exista", facets: (BUCKET_TAGS.presence ?? []) as unknown as string[], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "container" } });
  pushLine(lines, { bucket: "presence", narrative: "Cautare (search) vizibila si functionala", facets: ["cautare"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "search" } });
  if (table.paginated) {
    pushLine(lines, { bucket: "pagination", narrative: "Selector marime pagina vizibil si aplica filtrul", facets: (BUCKET_TAGS.pagination_selector ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "pagination", label: "page-size" } });
    pushLine(lines, { bucket: "pagination", narrative: "Controale pager (first/prev/next/last) cu stare dezactivata la margini", facets: (BUCKET_TAGS.pagination_pager ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "pagination", label: "pager" } });
  }
  pushLine(lines, { bucket: "presence", narrative: "Rand stare incarcare (loading) / skeleton vizibil", facets: ["loading"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "loading" } });
  pushLine(lines, { bucket: "presence", narrative: "Stare fara rezultate (no results) afisata corect", facets: ["gol"], provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "presence", label: "no-results" } });
  if (table.stickyHeader) { pushLine(lines, { bucket: "presence", narrative: "Header tabel lipicios (sticky) activat", facets: ["sticky"], provenance: ["uiux"], sort: { family: "presence", label: "sticky" } }); }
  if ((input.uiux?.columns || []).length > 0 || table.columnVisibilityMenu) {
    pushLine(lines, { bucket: "presence", narrative: "Meniu vizibilitate coloane disponibil", facets: ["coloane", "vizibilitate"], provenance: ["uiux"], sort: { family: "presence", label: "column-visibility" } });
  }
}

// RULE 5: Resilience scenarios
function emitResilience(lines: ManualLine[], input: MergedPlan) {
  const r = input.uiux?.resilience || {};
  if (r.offline) pushLine(lines, { bucket: "resilience", narrative: "Offline — acces si afisare conform specificatiei", facets: (BUCKET_TAGS.resilience_offline ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "resilience", scenario: "offline" } });
  if (r.slow) pushLine(lines, { bucket: "resilience", narrative: "Retea lenta — feedback si timeouts adecvate", facets: (BUCKET_TAGS.resilience_slow ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "resilience", scenario: "slow" } });
  if (r.loadingSLAms !== undefined) pushLine(lines, { bucket: "resilience", narrative: `SLA incarcare — TTFB sub ${r.loadingSLAms}ms, spinner/schelet prezent`, facets: (BUCKET_TAGS.resilience_loading_sla ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "resilience", scenario: "sla" } });
  if (r.dropOnAccess) pushLine(lines, { bucket: "resilience", narrative: "Drop conexiune la acces — comportament UI conform", facets: (BUCKET_TAGS.resilience_drop_access ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "resilience", scenario: "drop-access" } });
  if (r.dropDuringAction) pushLine(lines, { bucket: "resilience", narrative: "Drop conexiune in timpul interactiunii — comportament UI conform", facets: (BUCKET_TAGS.resilience_drop_interaction ?? []) as unknown as string[], provenance: ["uiux"], sort: { family: "resilience", scenario: "drop-during" } });
}

// RULE 6: Responsive breakpoints
function emitResponsive(lines: ManualLine[], input: MergedPlan) {
  const bps = input.uiux?.responsive?.breakpoints || [];
  for (const bp of bps) {
    pushLine(lines, { bucket: "responsive", narrative: `Breakpoint '${bp}' — layout, colapse coloane, controale critice vizibile, overflow gestionat`, facets: ["responsive", bp], provenance: ["uiux"], sort: { family: "responsive", label: bp } });
  }
}

// RULE 8: Auth policy — no standalone outcomes
function emitAuth(lines: ManualLine[], input: MergedPlan) {
  const auth = input.uiux?.auth || {};
  // Do not emit hidden/disabled/403/error lines. Keep only unauth redirect as navigation behavior.
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
  if (opts.qaStyle) {
    // Build QA-style lines per section (deterministic and canonical tags)
    const colLabels = (input.uiux?.columns || []).map(c => ({ label: c.label, sortable: !!c.sortable }));
    const add = (bucket: string, narrative: string, facets: string[]) => pushLine(lines, { bucket, narrative, facets, provenance: input.uiux? ["uiux"]:["defaults"] });
    const addResilience = () => {
      add("resilience", "Offline — acces si afisare conform specificatiei", ["offline"]);
      add("resilience", "Retea lenta — feedback si timeouts adecvate", ["slow"]);
      add("resilience", `SLA incarcare — TTFB sub ${input.uiux?.resilience?.loadingSLAms ?? 2000}ms, spinner/schelet prezent`, ["loading","SLA"]);
      add("resilience", "Drop conexiune la acces — comportament UI conform", ["drop","acces"]);
      add("resilience", "Drop conexiune in timpul interactiunii — comportament UI conform", ["drop","interactiune"]);
      add("responsive", "Breakpoint 'md' — layout, colapse coloane, controale critice vizibile, overflow gestionat", ["responsive","md"]);
    };
    const addPermissions = (perm: string, buttonHint?: string) => {
      add("presence", `Verificarea permisiunii [${perm}]`, ["comportament"]);
      if (buttonHint) add("presence", `Ascundere buton [${buttonHint}] cand nu exista permisiune`, ["prezenta","container","container-tip_buton","comportament"]);
    };

    const addColumnsBasics = () => {
      for (const c of colLabels) {
        add("columns", `Coloana '${c.label}' — header/facets vizibilitate, aliniere, iconografie`, ["prezenta","pozitionare","text-valoare","text-traducere"]);
        add("columns", `Coloana '${c.label}' — valoare corecta (format, masca, constrangeri, link/CTA)`, ["tabel","valoare"]);
        if (c.sortable) {
          add("sorting", `Sortare '${c.label}' — ASC corecta (ASC)`, ["sortare","asc"]);
          add("sorting", `Sortare '${c.label}' — DESC corecta (DESC)`, ["sortare","desc"]);
        }
      }
    };

    const t = (tip||"").toLowerCase();
    const tn = normalizeDiacritics(t);
    if (tn.includes("vizualizare") || t.includes("read") || tn.includes("viz")) {
      add("presence", "Afisarea titlului in pagina aplicatiei", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Afisarea breadcrumb-ului si comportamentul link-urilor", ["prezenta","pozitionare","text-valoare","text-traducere","container-tip_link","container-comportament"]);
      add("presence", "Accesarea functionalitatii prin buton dedicat", ["prezenta","container","container-tip_buton","comportament"]);
      add("presence", "Accesarea repetata a functionalitatii prin buton dedicat", ["prezenta","container","container-tip_buton","comportament"]);
      add("presence", "Accesarea functionalitatii prin URL direct", ["comportament"]);
      addResilience();
      addPermissions("viewDocuments", "Documents");
      add("presence", "Afisarea tabelului cu lista de documente", ["prezenta","container"]);
      addColumnsBasics();
      add("pagination", "Selector marime pagina vizibil si aplica filtrul", ["paginare","page-size"]);
      add("pagination", "Controale pager (first/prev/next/last) cu stare dezactivata la margini", ["paginare","pager"]);
      add("presence", "Cautare (search) vizibila si functionala", ["cautare"]);
      add("presence", "Header tabel lipicios (sticky) activat", ["sticky"]);
      if (colLabels.length > 0) add("presence", "Meniu vizibilitate coloane disponibil", ["vizibilitate"]);
    } else if (tn.includes("adaug") || t.includes("create") || tn.includes("adaugare")) {
      add("presence", "Accesarea formularului prin buton 'Adauga Document'", ["prezenta","container","container-tip_buton","comportament"]);
      add("presence", "Accesarea repetata a formularului prin buton", ["prezenta","container","container-tip_buton","comportament"]);
      add("presence", "Accesarea formularului prin URL direct", ["comportament"]);
      addResilience();
      addPermissions("createDocument", "Adauga Document");
      // Fields
      add("presence", "Camp 'Nume' — eticheta si indicator obligatoriu vizibile", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Camp 'Nume' — placeholder afisat", ["text-valoare"]);
      add("presence", "Camp 'Tip' — eticheta si indicator obligatoriu vizibile", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Camp 'Tip' — placeholder afisat", ["text-valoare"]);
      add("presence", "Camp 'Descriere' — eticheta vizibila si placeholder", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Camp 'Fisier' — eticheta vizibila si hint '.docx'", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      // Buttons
      add("presence", "Buton 'Inapoi' — vizibil si functional", ["prezenta","container-tip_buton","comportament","mouseover"]);
      add("presence", "Buton 'Reseteaza' — vizibil si functional", ["prezenta","container-tip_buton","comportament","mouseover"]);
      add("presence", "Buton 'Adauga' — vizibil si functional", ["prezenta","container-tip_buton","comportament","mouseover"]);
      // Validations (subset, canonical families)
      add("presence", "Validare 'Nume' — format corect si restrictii input", ["comportament_validare_format","comportament_restricții_input","comportament_limite"]);
      add("presence", "Validare 'Nume' — mesaj eroare pentru format invalid si blocare submit", ["comportament_validare_format_invalid","comportament_feedback_eroare","comportament_interzicere_submit"]);
      add("presence", "Validare 'Nume' — camp necompletat si feedback", ["comportament_validare_necompletare","comportament_feedback_eroare"]);
      add("presence", "Validare 'Tip' — format corect si restrictii input", ["comportament_validare_format","comportament_restricții_input","comportament_limite"]);
      add("presence", "Validare 'Tip' — camp necompletat si feedback", ["comportament_validare_necompletare","comportament_feedback_eroare"]);
      // Upload suite (subset)
      add("presence", "Fisier — incarcare tip gresit blocata si afiseaza eroare", ["comportament_feedback_eroare"]);
      add("presence", "Fisier — incarcare nume gresit este blocata", ["comportament_feedback_eroare"]);
      add("presence", "Fisier — duplicat (acelasi nume si continut) detectat", ["comportament_feedback_eroare"]);
      // Messages
      add("presence", "Mesaj succes — afisat si se auto-ascunde in 5s", ["comportament_feedback_succes","auto-hide","auto-hide-timp"]);
    } else if (tn.includes("modific") || t.includes("update")) {
      add("presence", "Accesarea formularului prin buton 'Edit'", ["prezenta","container","container-tip_buton","comportament"]);
      add("presence", "Accesarea formularului prin URL direct", ["comportament"]);
      addResilience();
      addPermissions("editDocument", "Modifica Document");
      // Fields same as create
      add("presence", "Camp 'Nume' — eticheta si indicator obligatoriu vizibile", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Camp 'Tip' — eticheta si indicator obligatoriu vizibile", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Camp 'Descriere' — eticheta vizibila si placeholder", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      add("presence", "Camp 'Fisier' — eticheta vizibila si hint '.docx'", ["prezenta","pozitionare","text-valoare","text-traducere"]);
      // Buttons
      add("presence", "Buton 'Inapoi' — vizibil si functional", ["prezenta","container-tip_buton","comportament","mouseover"]);
      add("presence", "Buton 'Reseteaza' — vizibil si functional", ["prezenta","container-tip_buton","comportament","mouseover"]);
      add("presence", "Buton 'Modifica' — vizibil si functional", ["prezenta","container-tip_buton","comportament","mouseover"]);
      // Validations (subset)
      add("presence", "Validare 'Nume' — format corect si restrictii input", ["comportament_validare_format","comportament_restricții_input","comportament_limite"]);
      add("presence", "Validare 'Nume' — camp necompletat si feedback", ["comportament_validare_necompletare","comportament_feedback_eroare"]);
      add("presence", "Validare 'Tip' — camp necompletat si feedback", ["comportament_validare_necompletare","comportament_feedback_eroare"]);
      add("presence", "Mesaj succes — afisat si se auto-ascunde in 5s", ["comportament_feedback_succes","auto-hide","auto-hide-timp"]);
    } else if (tn.includes("sterg") || t.includes("delete")) {
      add("presence", "Accesare actiune 'Delete' din coloana actiuni", ["prezenta","container-tip_buton","comportament"]);
      addResilience();
      addPermissions("deleteDocument", "Delete");
      add("presence", "Confirmare stergere — dialog afisat cu optiuni", ["prezenta","comportament"]);
      add("presence", "Stergere document existent — redirect catre lista si mesaj succes", ["comportament","comportament_feedback_succes","auto-hide","auto-hide-timp"]);
      add("presence", "Stergere document inexistent — mesaj eroare afisat", ["comportament","comportament_feedback_eroare"]);
    } else if (tn.includes("activ") || t.includes("activate")) {
      add("presence", "Accesare actiune 'Activeaza' din coloana actiuni", ["prezenta","container-tip_buton","comportament"]);
      addResilience();
      addPermissions("activateDocument", "Activeaza");
      add("presence", "Dialog activare — optiuni 'Nu' si 'Da' cu comportament corect", ["prezenta","comportament"]);
      add("presence", "Activare cu succes — mesaj afisat si se auto-ascunde in 5s", ["comportament_feedback_succes","auto-hide","auto-hide-timp"]);
    }
  } else {
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
    // auth policy
    emitAuth(lines, input);
  }
  // coverage-compat auth lines (only when flag is enabled)
  if (opts.compatAuthStandalone) {
    const compat = [
      { narrative: "Neautorizat — elemente ascunse (hidden)", facets: (BUCKET_TAGS.auth_hidden ?? []) as unknown as string[] },
      { narrative: "Neautorizat — elemente dezactivate (disabled)", facets: (BUCKET_TAGS.auth_disabled ?? []) as unknown as string[] },
      { narrative: "Neautorizat — eroare la click (toast/dialog)", facets: (BUCKET_TAGS.auth_error_click ?? []) as unknown as string[] },
      { narrative: "Neautorizat — 403 la acces direct", facets: (BUCKET_TAGS.auth_403 ?? []) as unknown as string[] }
    ];
    for (const c of compat) {
      pushLine(lines, { bucket: "auth", narrative: c.narrative, facets: c.facets, provenance: input.uiux? ["uiux"]:["defaults"], sort: { family: "auth", scenario: "compat" } });
    }
  }

  const title = opts.title || `Plan de testare — ${tip || "Manual"}`;
  if (opts.qaStyle) {
    // Deterministic QA-style output without provenance
    const uniqSorted: ManualLine[] = (() => {
      const seen = new Set<string>();
      const acc: ManualLine[] = [];
      for (const l of lines) { const k = stableKeyOf(l); if (seen.has(k)) continue; seen.add(k); acc.push(l); }
      acc.sort(stableCompare);
      return acc;
    })();
    return renderQa(uniqSorted, tip, title);
  }
  const raw = render(lines, title);
  return formatManual(raw, { stripProvenance: !!opts.removeProvenance });
}


