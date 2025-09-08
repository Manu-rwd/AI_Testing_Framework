import * as path from "node:path";
import * as fs from "node:fs/promises";
import { verifyFile } from "./verify.js";

export async function generateReport(inputFile: string, moduleName: string, outPath?: string): Promise<{ outFile: string }> {
  const result = await verifyFile(inputFile, moduleName, {});

  const dispCounts = new Map<string, number>();
  const idxDisp = 0; // compute from header via verifyFile if needed, but we only need counts from raw CSV again
  // Instead, quickly re-read and count dispositions without duplicating parsing logic too much
  // Keep CRLF and BOM concerns out; verifyFile already parsed rows count

  const buf = await fs.readFile(inputFile);
  const text = buf.toString("utf8");
  const content = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = content.split("\r\n");
  const header = (rows[0] || "").split(",");
  const iDisp = header.indexOf("review_disposition");

  let nonEmptyRows = 0;
  for (let i = 1; i < rows.length; i++) {
    const line = rows[i] ?? "";
    if (!line) continue;
    nonEmptyRows++;
    const cells = line.split(",");
    const v = (cells[iDisp] ?? "").trim();
    const k = v || "";
    dispCounts.set(k, (dispCounts.get(k) || 0) + 1);
  }

  const totalsIssues = result.issues.length;
  const totals = { files: 1, rows: result.totals.rows, issues: totalsIssues };
  const outFile = outPath ? path.resolve(outPath) : path.resolve(process.cwd(), "qa-framework/tmp_review", `${moduleName}_Review_Summary.md`);
  await fs.mkdir(path.dirname(outFile), { recursive: true });

  const lines: string[] = [];
  lines.push(`# Review Summary: ${moduleName}`);
  lines.push("");
  lines.push(`Totals: rows=${totals.rows} issues=${totals.issues}`);
  lines.push("");
  lines.push("## Disposition Counts");
  lines.push("");
  lines.push("| Disposition | Count |");
  lines.push("| --- | ---: |");
  for (const [k, n] of dispCounts) {
    lines.push(`| ${k || "(empty)"} | ${n} |`);
  }
  if (result.issues.length) {
    lines.push("");
    lines.push("## Incomplete Rows (first 50)");
    lines.push("");
    let shown = 0;
    for (const i of result.issues) {
      if (shown >= 50) break;
      const loc = i.row ? `row ${i.row}` : "";
      lines.push(`- ${i.code} ${loc} — ${i.message}`);
      shown++;
    }
  }

  await fs.writeFile(outFile, lines.join("\r\n"), "utf8");
  return { outFile };
}


