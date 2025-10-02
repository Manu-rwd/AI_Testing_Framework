import type { EmitOptions, MergedPlan, PlanCase } from "./types";

// Normalize input into a list of PlanCase
function collectCases(input: MergedPlan): PlanCase[] {
  const arrays = [input.cases, input.tests, input.plan].filter(Boolean) as PlanCase[][];
  if (arrays.length === 0) return [];
  // prefer "cases", then "tests", then "plan"
  const picked = arrays[0];
  return Array.isArray(picked) ? picked : [];
}

function asBool(v: any): boolean {
  if (v === 1 || v === "1" || v === true) return true;
  return false;
}

function safeLines(arr?: unknown): string[] {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr.filter(x => typeof x === "string") as string[];
  if (typeof arr === "string") return [arr];
  return [];
}

function h1(s: string) { return `# ${s}`; }
function h2(s: string) { return `## ${s}`; }
function h3(s: string) { return `### ${s}`; }

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return `${h3(title)}\n- n/a\n`;
  const bullets = lines.map(l => `- ${l}`).join("\n");
  return `${h3(title)}\n${bullets}\n`;
}

export function emitManualMarkdown(input: MergedPlan, opts: EmitOptions): string {
  const all = collectCases(input);

  // Filtering by Tip functionalitate and General valabile = 1 when requested
  const filtered = all
    .filter(c => !opts.filterTip || (c.tipFunctionalitate || c.module) === opts.filterTip)
    .filter(c => !opts.includeGeneralOnly || asBool(c.general_valabile));

  // Deterministic order: by numeric id asc, then name
  const sorted = [...filtered].sort((a, b) => {
    const ai = Number(a.id); const bi = Number(b.id);
    if (!Number.isNaN(ai) && !Number.isNaN(bi) && ai !== bi) return ai - bi;
    const an = (a.nume || "").localeCompare(b.nume || "");
    if (an !== 0) return an;
    return String(a.id).localeCompare(String(b.id));
    });

  const title = opts.title || "Plan de testare — Manual (strict parity)";

  // If no cases matched, emit exact expected minimal body
  if (sorted.length === 0) {
    return `${h1(title)}\n\n_Nu exista cazuri care sa corespunda filtrului configurat._\n\n`;
  }

  const out: string[] = [];
  out.push(h1(title));
  out.push("");

  // Strict parity block per case — headings and sections must remain exactly as below.
  // Do not leak internal fields or metadata.
  sorted.forEach((c, idx) => {
    const header = `Caz ${idx + 1}: ${c.nume || `#${c.id}`} `;
    out.push(h2(header));
    out.push("");
    out.push(`**Tip functionalitate:** ${c.tipFunctionalitate || c.module || "n/a"}`);
    out.push(`**General valabile:** ${asBool(c.general_valabile) ? "1" : "0"}`);
    if (c.severitate) out.push(`**Severitate:** ${c.severitate}`);
    if (c.prioritate) out.push(`**Prioritate:** ${c.prioritate}`);
    out.push("");

    out.push(section("Preconditii", safeLines(c.preconditii)));
    out.push(section("Pasi", safeLines(c.pasi)));
    out.push(section("Rezultat asteptat", safeLines(c.rezultat_asteptat)));
    out.push(section("Observatii", safeLines(c.observatii)));
    out.push("");
  });

  // Join with \n to enforce stable bytes
  return out.join("\n");
}


