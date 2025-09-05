import fs from "fs-extra";
import path from "node:path";

export interface PlanRow {
  module?: string;
  tipFunctionalitate?: string;
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

function pct(val: number): string { return `${(val * 100).toFixed(1)}%`; }

export async function emitAutomationMd(
  rows: PlanRow[],
  opts: { moduleName: string; docDir: string }
): Promise<string> {
  const moduleName = String(opts.moduleName || "");
  const docDir = path.resolve(opts.docDir || ".");
  await fs.ensureDir(docDir);
  const outPath = path.join(docDir, `${moduleName}_Automation.md`);

  const now = new Date().toISOString();
  const lines: string[] = [];
  lines.push(`# Plan de Automatizare — ${moduleName}`);
  lines.push("");
  lines.push(`Generat: ${now}`);
  if (rows?.[0]?.source) lines.push(`Sursă: ${rows[0]!.source}`);
  lines.push("");

  // Summary table
  lines.push("| tipFunctionalitate | bucket | feasibility | confidence | rule_tags |");
  lines.push("|---|---|---|---|---|");
  for (const r of rows || []) {
    const conf = typeof r.confidence === "number" ? pct(r.confidence) : "";
    const tags = (r.rule_tags ?? []).join(", ");
    lines.push(`| ${r.tipFunctionalitate ?? ""} | ${r.bucket ?? ""} | ${r.feasibility ?? ""} | ${conf} | ${tags} |`);
  }
  lines.push("");

  // Details per case
  for (const r of rows || []) {
    lines.push("\n---\n");
    lines.push(`## ${r.bucket ?? ""} — ${r.tipFunctionalitate ?? ""}`);
    lines.push("");
    if (r.narrative_ro) {
      lines.push("**Narațiune**");
      lines.push(r.narrative_ro);
      lines.push("");
    }
    lines.push("**Atomi (AAA)**");
    lines.push("```");
    lines.push(JSON.stringify(r.atoms ?? [], null, 0));
    lines.push("```");
    lines.push("");
    if (r.selector_needs || r.selector_strategy) {
      lines.push("**Selectori**");
      lines.push(`needs: ${r.selector_needs ?? ""}`);
      lines.push(`strategy: ${r.selector_strategy ?? ""}`);
      lines.push("");
    }
    if (r.data_profile) {
      lines.push("**Profil de date**");
      lines.push(String(r.data_profile));
      lines.push("");
    }
    lines.push("**Proveniență**");
    lines.push(`source: ${r.source ?? ""}`);
    if (r.notes) lines.push(String(r.notes));
    lines.push("");
  }

  await fs.writeFile(outPath, lines.join("\n"), { encoding: "utf8" });
  return outPath;
}


