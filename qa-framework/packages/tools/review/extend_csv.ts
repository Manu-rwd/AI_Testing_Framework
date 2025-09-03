import fs from "fs-extra";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const REVIEW_COLS = ["disposition","feasibility","selector_needs","parameter_needs","notes"];

async function main() {
  const inPath = process.argv[2];
  if (!inPath) { console.error("Usage: tsx extend_csv.ts <file.csv>"); process.exit(1); }
  const text = await fs.readFile(inPath, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true });
  const header = rows.length ? Object.keys(rows[0]) : [];
  const missing = REVIEW_COLS.filter(c => !header.includes(c));
  if (missing.length === 0) { console.log("Already up to date:", inPath); return; }
  const nextRows = rows.map((r: any) => {
    for (const c of missing) r[c] = r[c] ?? "";
    return r;
  });
  const out = stringify(nextRows, { header: true, columns: [...header, ...missing] });
  await fs.writeFile(inPath, out, "utf8");
  console.log("Updated:", inPath, "added:", missing.join(", "));
}
main().catch(e => { console.error(e); process.exit(1); });


