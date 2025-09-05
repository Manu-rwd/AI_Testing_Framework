import fs from "fs-extra";
import path from "node:path";

export interface PlanRow {
  module?: string;
  tipFunctionalitate?: string;
  featureKind?: string;
  bucket?: string;
  narrative_ro?: string;
  atoms?: any[];
  selector_needs?: string;
  selector_strategy?: string;
  data_profile?: string;
  feasibility?: "A" | "B" | "C" | "D" | "E" | string;
  source?: string;
  confidence?: number;
  rule_tags?: string[];
  notes?: string;
}

const HEADER: ReadonlyArray<string> = [
  "module",
  "tipFunctionalitate",
  "bucket",
  "narrative_ro",
  "atoms",
  "selector_needs",
  "selector_strategy",
  "data_profile",
  "feasibility",
  "source",
  "confidence",
  "rule_tags",
  "notes",
];

function csvEscape(value: string): string {
  const needsQuote = /[",\n\r]/.test(value);
  let out = value.replace(/"/g, '""');
  if (needsQuote) out = `"${out}"`;
  return out;
}

export async function emitAutomationCsv(
  rows: PlanRow[],
  opts: { moduleName: string; outDir: string }
): Promise<string> {
  const moduleName = String(opts.moduleName || "");
  const outDir = path.resolve(opts.outDir || ".");
  await fs.ensureDir(outDir);
  const outPath = path.join(outDir, `${moduleName}_Automation.csv`);

  const lines: string[] = [];
  lines.push(HEADER.join(","));
  for (const row of rows || []) {
    const rec = {
      module: moduleName,
      tipFunctionalitate: row.tipFunctionalitate || row.featureKind || "",
      bucket: row.bucket || "",
      narrative_ro: row.narrative_ro || "",
      atoms: JSON.stringify(row.atoms ?? [], null, 0),
      selector_needs: row.selector_needs || "",
      selector_strategy: row.selector_strategy || "",
      data_profile: row.data_profile || "",
      feasibility: row.feasibility || "",
      source: row.source || "",
      confidence: Number(row.confidence ?? 0).toFixed(2),
      rule_tags: (row.rule_tags ?? []).join("|"),
      notes: String(row.notes ?? "").replace(/\r?\n/g, "  "),
    } as Record<string, string>;
    const vals = HEADER.map((h) => csvEscape(String((rec as any)[h] ?? "")));
    lines.push(vals.join(","));
  }

  await fs.writeFile(outPath, lines.join("\n"), { encoding: "utf8" });
  return outPath;
}


