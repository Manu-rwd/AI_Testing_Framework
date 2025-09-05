import type { PlanRow } from "../v2/types.js";

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
    return [
      `\n---\n`,
      `## ${i + 1}. ${r.bucket ?? "(fără bucket)"} — ${r.tipFunctionalitate ?? ""}\n`,
      `**Narațiune (RO):** ${r.narrative_ro ?? ""}\n`,
      `**Selector needs:** ${r.selector_needs ?? ""} | **Strategy:** ${r.selector_strategy ?? ""}\n`,
      `**Data profile:** ${r.data_profile ?? ""}\n`,
      `**Feasibility:** ${r.feasibility ?? ""} | **Source:** ${r.source ?? ""} | **Confidence:** ${r.confidence != null ? (Math.round(r.confidence * 1000) / 1000) : ""}\n`,
      `**Tags:** ${(r.rule_tags ?? []).join(", ")}\n`,
      `**Notes:** ${r.notes ?? ""}\n`,
      `\n<details><summary>AAA atoms</summary>\n\n` +
        "```json\n" +
        `${JSON.stringify(atoms, null, 2)}\n` +
        "```\n\n" +
      `</details>\n`
    ].join("");
  }).join("");
  return title + header + "\n" + table + "\n" + sections + "\n";
}


