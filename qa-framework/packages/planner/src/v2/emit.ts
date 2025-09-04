import fs from "fs-extra";
import path from "node:path";
import type { PlanV2, PlanRowV2 } from "./types";

const SEP_LIST = "|";
const SEP_ATOMS = "|||";

function lineify(row: PlanRowV2): string {
  const atoms = [
    row.atoms.setup.join(SEP_ATOMS),
    row.atoms.action.join(SEP_ATOMS),
    row.atoms.assert.join(SEP_ATOMS),
  ];

  const selector_strategy = row.selector_strategy.join(SEP_LIST);
  const selector_needs = row.selector_needs.join(SEP_LIST);
  const data_required = row.data_profile.required.join(SEP_LIST);
  const rule_tags = row.rule_tags.join(SEP_LIST);

  const cols = [
    row.module,
    row.tipFunctionalitate,
    row.bucket,
    row.narrative_ro.replace(/\r?\n/g, " ").trim(),
    ...atoms,
    row.oracle_kind,
    selector_strategy,
    selector_needs,
    data_required,
    row.feasibility,
    row.source,
    String(row.confidence),
    rule_tags,
    row.notes ?? ""
  ];
  // CSV-safe: quote any values containing commas
  return cols
    .map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
    .join(",");
}

export async function emitCSV(plan: PlanV2, outCsv: string) {
  await fs.ensureDir(path.dirname(outCsv));
  const header = [
    "module",
    "tipFunctionalitate",
    "bucket",
    "narrative_ro",
    "atoms.setup",
    "atoms.action",
    "atoms.assert",
    "oracle_kind",
    "selector_strategy",
    "selector_needs",
    "data_profile.required",
    "feasibility",
    "source",
    "confidence",
    "rule_tags",
    "notes",
  ].join(",");
  const lines = [header, ...plan.rows.map(lineify)];
  await fs.writeFile(outCsv, lines.join("\n"), { encoding: "utf8" });
}

export async function emitMarkdown(plan: PlanV2, type: string, outMd: string) {
  await fs.ensureDir(path.dirname(outMd));
  const title = `# Plan ${type} v2\n\n`;
  const rowsMd = plan.rows
    .map((r, i) => {
      const atoms = [
        `- **Arrange**:\n  - ${r.atoms.setup.join("\n  - ") || "*n/a*"}`,
        `- **Act**:\n  - ${r.atoms.action.join("\n  - ") || "*n/a*"}`,
        `- **Assert**:\n  - ${r.atoms.assert.join("\n  - ") || "*n/a*"}`,
      ].join("\n");

      const badge = `**Fezabilitate:** ${r.feasibility}`;
      const meta = `**Bucket:** ${r.bucket} · **Oracle:** ${r.oracle_kind} · **Sursă:** ${r.source} · **Încredere rând:** ${r.confidence.toFixed(2)} · **Etichete:** ${r.rule_tags.join(", ")}`;

      return `## Rând ${i + 1}: ${r.narrative_ro}\n\n${badge}\n\n${meta}\n\n${atoms}\n`;
    })
    .join("\n");

  const overall = `\n---\n**Încredere plan (overall):** ${plan.overall_confidence.toFixed(2)}\n`;

  await fs.writeFile(outMd, title + rowsMd + overall, { encoding: "utf8" });
}


