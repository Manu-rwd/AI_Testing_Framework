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
    const primary = (r as any)["selector_strategy.primary"] ?? "";
    const fallbacks = (r as any)["selector_strategy.fallbacks"] ?? "";
    const sSource = (r as any)["selector_strategy.source"] ?? "";
    const sConf = (r as any)["selector_strategy.confidence"] ?? "";
    const dpMin = (r as any)["data_profile.minimal_valid"] ?? "";
    const dpEdges = (r as any)["data_profile.edge_cases"] ?? "[]";
    const dpSource = (r as any)["data_profile.source"] ?? "";
    const dpConf = (r as any)["data_profile.confidence"] ?? "";
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
      "```json",
      JSON.stringify(atoms, null, 2),
      "```",
    ].join("\n");
    return [
      `\n---\n`,
      `## ${i + 1}. ${r.bucket ?? "(fără bucket)"} — ${r.narrative_ro ?? ""}\n`,
      `**Fezabilitate:** ${feasBadge}\n`,
      `Fezabilitate: ${feasBadge}\n`,
      `\n**Narațiune:** ${r.narrative_ro ?? ""}\n`,
      aaaBullets,
      `**Selecție UI (strategie):** ${primary}${fallbacks ? `; fallback: ${fallbacks}` : ""} (sursă: ${sSource}; încredere: ${sConf})\n`,
      `**Profil date:** minimal_valid=${dpMin}; edge_cases=${dpEdges} (sursă: ${dpSource}; încredere: ${dpConf})\n`,
      `**Proveniență & Încredere rând:** ${r.source ?? ""} · ${(r.confidence ?? 0).toFixed(2)}\n`,
      (r.rule_tags?.length ? `**Etichete reguli:** ${(r.rule_tags || []).map(t => `\`${t}\``).join(", ")}\n` : ""),
      r.notes ? `**Note:** ${r.notes}\n` : "",
    ].join("");
  }).join("");
  return title + header + "\n" + table + "\n" + sections + "\n";
}


