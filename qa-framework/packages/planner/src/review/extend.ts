import path from "node:path";
import fs from "node:fs/promises";

function detectHasBOM(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

function ensureCRLF(text: string): string {
  const normalized = text.replace(/\r?\n/g, "\n");
  return normalized.replace(/\n/g, "\r\n");
}

function splitCsvRowsRFC(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        current += ch;
        i++;
        continue;
      }
    }
    if (!inQuotes && ch === "\r" && text[i + 1] === "\n") {
      rows.push(current);
      current = "";
      i += 2;
      continue;
    }
    current += ch;
    i++;
  }
  rows.push(current);
  return rows;
}

function safeCsvSplit(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function csvJoinRow(fields: string[]): string {
  return fields
    .map((f) => {
      const needsQuote = /[",\r\n]/.test(f);
      if (needsQuote) {
        const escaped = f.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return f;
    })
    .join(",");
}

const DEFAULT_COLUMNS: string[] = [
  "review_disposition",
  "feasibility",
  "review_needs",
  "review_notes",
  "reviewer",
  "reviewed_at",
];

export async function extendReviewColumns(
  inputCsvPath: string,
  opts?: { inPlace?: boolean; outDir?: string; columns?: string[] }
): Promise<{ outputCsvPath: string }> {
  const columnsToAdd = (opts?.columns && opts.columns.length > 0) ? opts.columns : DEFAULT_COLUMNS;
  const buf = await fs.readFile(inputCsvPath);
  const hasBOM = detectHasBOM(buf);
  const contentUtf8 = buf.toString("utf8");
  const text = hasBOM ? contentUtf8.slice(1) : contentUtf8;
  const rowsRaw = splitCsvRowsRFC(text);
  const headerLine = rowsRaw[0] || "";
  const headerCells = safeCsvSplit(headerLine);
  const existingHeaderSet = new Set(headerCells);
  const toAppend: string[] = [];
  for (const c of columnsToAdd) {
    if (!existingHeaderSet.has(c)) {
      toAppend.push(c);
    }
  }
  const newHeader = headerCells.concat(toAppend);
  const outRows: string[] = [];
  outRows.push(csvJoinRow(newHeader));
  for (let i = 1; i < rowsRaw.length; i++) {
    const line = rowsRaw[i] ?? "";
    if (line === "") {
      // preserve trailing empty line if present
      continue;
    }
    const cells = safeCsvSplit(line);
    const extended = cells.concat(new Array(toAppend.length).fill(""));
    outRows.push(csvJoinRow(extended));
  }
  let output = outRows.join("\r\n");
  output = ensureCRLF(output);
  const withBOM = "\uFEFF" + output;
  let outputCsvPath: string;
  if (opts?.inPlace) {
    outputCsvPath = inputCsvPath;
  } else {
    const base = path.basename(inputCsvPath);
    const name = base.replace(/\.csv$/i, "") + ".review.csv";
    const dir = opts?.outDir ? opts.outDir : path.dirname(inputCsvPath);
    outputCsvPath = path.join(dir, name);
  }
  await fs.mkdir(path.dirname(outputCsvPath), { recursive: true });
  await fs.writeFile(outputCsvPath, withBOM, "utf8");
  return { outputCsvPath };
}


