#!/usr/bin/env node
import path from "node:path";
import fs from "fs-extra";
import { stringify } from "csv-stringify";
import { readSheetRows } from "./util/xlsx";
import { splitCsv, extractPlaceholders, toBool01 } from "./util/normalize";
import { NormalizedRow } from "./schemas";

type Args = { xlsx?: string; type?: string };
const argv = process.argv.slice(2);
const args: Args = {};
for (let i = 0; i < argv.length; i += 2) {
  const k = argv[i];
  const v = argv[i + 1];
  if (k === "--xlsx") args.xlsx = v;
  if (k === "--type") args.type = v;
}

const XLSX_PATH = args.xlsx || process.env.SOURCE_XLSX;
const FUNC_TYPE = args.type;

async function main() {
  if (!XLSX_PATH) throw new Error("Missing --xlsx or SOURCE_XLSX");
  if (!FUNC_TYPE) throw new Error("Missing --type (Tip functionalitate)");
  const SHEET = "Accesare";

  // Resolve xlsx path relative to monorepo root (INIT_CWD) if provided relative
  const rootCwd = process.env.INIT_CWD || process.cwd();
  const resolvedXlsxPath = path.isAbsolute(XLSX_PATH) ? XLSX_PATH : path.resolve(rootCwd, XLSX_PATH);
  const outputBase = rootCwd;

  const { rows, commentsByRow } = readSheetRows(resolvedXlsxPath, SHEET);

  const mapCol = (r: any, key: string) => {
    const variants = [key, key.toUpperCase(), key.toLowerCase()];
    for (const k of variants) if (r[k] !== undefined) return ("" + r[k]).trim();
    return "";
  };

  // Filter by Tip functionalitate contains FUNC_TYPE
  const matchType = rows.filter((r) => {
    const tf = splitCsv(mapCol(r, "Tip functionalitate"));
    return tf.includes(FUNC_TYPE!);
  });
  // Always include General valabile == 1
  const generalRows = rows.filter((r) => mapCol(r, "General valabile") === "1");
  // Union while preserving order as in sheet
  const finalRows = rows.filter((r) => matchType.includes(r) || generalRows.includes(r));

  const out = finalRows.map((r, idx) => {
    const narrative = mapCol(r, "Caz de testare");
    const placeholders = extractPlaceholders(narrative);
    const stepHint = commentsByRow[idx + 1];

    const rec = {
      module: "Accesare" as const,
      tipFunctionalitate: splitCsv(mapCol(r, "Tip functionalitate")),
      bucket: mapCol(r, "Bucket") || undefined,
      generalValabile: mapCol(r, "General valabile") === "1",
      narrative_ro: narrative,
      placeholders,
      atoms: [],
      step_hints: stepHint || undefined,
      env: {
        automat: toBool01(mapCol(r, "Automat")),
        local: toBool01(mapCol(r, "Local")),
        test: toBool01(mapCol(r, "Test")),
        prod: toBool01(mapCol(r, "Prod"))
      },
      impact: Number(mapCol(r, "Impact")) || undefined,
      efort: Number(mapCol(r, "Efort")) || undefined,
      importanta: Number(mapCol(r, "Importanta")) || undefined
    };

    return NormalizedRow.parse(rec);
  });

  await fs.mkdirp(path.resolve(outputBase, "data/templates"));
  await fs.mkdirp(path.resolve(outputBase, "exports"));
  await fs.mkdirp(path.resolve(outputBase, "docs/modules"));

  // JSON
  const jsonPath = path.resolve(outputBase, "data/templates/Accesare.normalized.json");
  await fs.writeJson(jsonPath, out, { spaces: 2 });

  // CSV
  const stringifier = stringify({
    header: true,
    columns: ["Modul","TipFunctionalitate","Bucket","GeneralValabile","Caz","Placeholders","StepHints","Automat","Local","Test","Prod","Impact","Efort","Importanta"]
  });
  const csvPath = path.resolve(outputBase, "exports/Accesare.csv");
  const ws = fs.createWriteStream(csvPath);
  stringifier.pipe(ws);
  for (const r of out) {
    stringifier.write({
      Modul: r.module,
      TipFunctionalitate: r.tipFunctionalitate.join(", "),
      Bucket: r.bucket ?? "",
      GeneralValabile: r.generalValabile ? 1 : 0,
      Caz: r.narrative_ro,
      Placeholders: r.placeholders.join(" | "),
      StepHints: (r as any).step_hints ?? "",
      Automat: r.env.automat,
      Local: r.env.local,
      Test: r.env.test,
      Prod: r.env.prod,
      Impact: r.impact ?? "",
      Efort: r.efort ?? "",
      Importanta: r.importanta ?? ""
    } as any);
  }
  stringifier.end();

  // MD (group by Bucket)
  const byBucket = new Map<string, typeof out>();
  for (const r of out) {
    const b = r.bucket ?? "Fără bucket";
    if (!byBucket.has(b)) byBucket.set(b, []);
    byBucket.get(b)!.push(r);
  }
  let md = `# Accesare — Plan normalizat (Tip: ${FUNC_TYPE})\n\n`;
  md += `*Total cazuri:* ${out.length}\n\n`;
  for (const [bucket, items] of byBucket) {
    md += `## Bucket: ${bucket}\n\n`;
    items.forEach((r, i) => {
      md += `${i + 1}. ${r.narrative_ro}\n`;
      const hint = (r as any).step_hints;
      if (hint) md += `   - _Notă_: ${hint}\n`;
    });
    md += `\n`;
  }
  const mdPath = path.resolve(outputBase, "docs/modules/Accesare.md");
  await fs.writeFile(mdPath, md, "utf8");

  console.log(`Accesare normalized: ${out.length} rows`);
  console.log(`→ ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`→ ${path.relative(process.cwd(), csvPath)}`);
  console.log(`→ ${path.relative(process.cwd(), mdPath)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });


