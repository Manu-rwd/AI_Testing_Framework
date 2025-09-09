import type { PlanRow } from "../v2/types.js";

function badgeFor(feas: string): string {
  switch (feas) {
    case "A": return "A 🟢";
    case "B": return "B 🟡";
    case "C": return "C 🟠";
    case "D": return "D 🟣";
    case "E": return "E 🔴";
    default: return String(feas || "?");
  }
}

export function automationPlanToMarkdown(moduleName: string, rows: PlanRow[]): string {
  const dt = new Date().toISOString();
  const title = `# ${moduleName}: Plan de automatizare\n\n_Generat la ${dt}_\n\n`;
  const header = [
    "| tipFunctionalitate | bucket | feasibility | source | confidence | rule_tags |",
    "|---|---|---|---|---:|---|",
  ].join("\n");
  const table = (rows || []).map(r => {
    const conf = r.confidence != null ? (Math.round(r.confidence * 1000) / 1000).toString() : "";
    const tags = (r.rule_tags ?? []).join(", ");
    return `| ${r.tipFunctionalitate ?? ""} | ${r.bucket ?? ""} | ${r.feasibility ?? ""} | ${r.source ?? ""} | ${conf} | ${tags} |`;
  }).join("\n");
  const sections = (rows || []).map((r, i) => {
    const atoms = r.atoms ?? { setup: [], action: [], assert: [] };
    const feasBadge = badgeFor(r.feasibility ?? "");
    const aaaBullets = [
      "### Arrange",
      ...(atoms.setup || []).map((s: string) => `- ${s}`),
      "",
      "### Act",
      ...(atoms.action || []).map((s: string) => `- ${s}`),
      "",
      "### Assert",
      ...(atoms.assert || []).map((s: string) => `- ${s}`),
      "",
    ].join("\n");
    return [
      `\n---\n`,
      `## ${i + 1}. ${r.bucket ?? "(fără bucket)"} — ${r.narrative_ro ?? ""}\n`,
      `**Fezabilitate:** ${feasBadge}\n`,
      `\n**Narațiune:** ${r.narrative_ro ?? ""}\n`,
      aaaBullets,
      `**Selecție & Date:** ${r.selector_strategy ?? ""} · ${r.selector_needs ?? ""} · ${r.data_profile ?? ""}\n`,
      `**Proveniență & Încredere:** ${r.source ?? ""} · ${(r.confidence ?? 0).toFixed(2)}\n`,
      (r.rule_tags?.length ? `**Etichete reguli:** ${(r.rule_tags || []).map(t => `\`${t}\``).join(", ")}\n` : ""),
      r.notes ? `**Note:** ${r.notes}\n` : "",
    ].join("");
  }).join("");
  return title + header + "\n" + table + "\n" + sections + "\n";
}


