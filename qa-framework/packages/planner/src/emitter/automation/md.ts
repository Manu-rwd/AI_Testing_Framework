import { AutomationPlan } from "./types.js";

function toPercentOneDecimal(value: number): string {
  const pct = Math.round((value * 100) * 10) / 10; // one decimal
  return `${pct.toFixed(1)}%`;
}

export function automationPlanToMarkdown(plan: AutomationPlan): string {
  if (!plan || plan.length === 0) return "";
  const moduleName = plan[0]!.module;
  const lines: string[] = [];
  lines.push(`# ${moduleName} — Automation Plan`);
  for (const row of plan) {
    lines.push("");
    lines.push(`## ${row.bucket} — ${row.narrative_ro}`);
    lines.push("");
    lines.push("### Arrange");
    for (const s of row.atoms.setup || []) lines.push(`- ${s}`);
    lines.push("");
    lines.push("### Act");
    for (const s of row.atoms.action || []) lines.push(`- ${s}`);
    lines.push("");
    lines.push("### Assert");
    for (const s of row.atoms.assert || []) lines.push(`- ${s}`);
    lines.push("");
    lines.push("### Selectors");
    lines.push(`- needs: ${row.selector_needs}`);
    lines.push(`- strategy: ${row.selector_strategy}`);
    lines.push("");
    lines.push("### Data Profile");
    lines.push(`${row.data_profile}`);
    lines.push("");
    lines.push("### Feasibility");
    lines.push(`${row.feasibility} — A/B = codegen-ready; C/D/E = needs work`);
    lines.push("");
    lines.push("### Provenance");
    lines.push(`source: \`${row.source}\``);
    if (row.rule_tags?.length) {
      const tags = row.rule_tags.map((t) => `\`${t}\``).join(", ");
      lines.push(`rule tags: ${tags}`);
    }
    lines.push("");
    lines.push("### Confidence");
    lines.push(toPercentOneDecimal(row.confidence));
    if (row.notes) {
      lines.push("");
      lines.push("### Notes");
      lines.push(row.notes);
    }
  }
  return lines.join("\n");
}


