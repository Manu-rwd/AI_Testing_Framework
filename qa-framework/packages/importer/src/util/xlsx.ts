import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "node:fs";
(XLSX as any).set_fs?.(fs);

export type Row = Record<string, any>;

export function readSheetRows(
  filePath: string,
  sheetName: string
): { rows: Row[]; caseColIndex: number; commentsByRow: Record<number, string> } {
  const wb = XLSX.readFile(filePath, { cellStyles: true, cellComments: true } as any);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);

  // 1) Find header row & the index of "Caz de testare"
  const headerMatrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true } as any);
  if (!headerMatrix.length) throw new Error("Empty sheet");
  const headerRow = headerMatrix[0].map((h: any) => String(h || "").trim());
  const caseColIndex = headerRow.findIndex((h) => h.toLowerCase() === "caz de testare");
  if (caseColIndex < 0) throw new Error(`Header "Caz de testare" not found`);

  // 2) Structured rows (data only)
  const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  // 3) Map comments strictly for the "Caz de testare" column cells
  const commentsByRow: Record<number, string> = {};
  const ref = (ws as any)["!ref"] as string;
  const range = XLSX.utils.decode_range(ref);
  const dataStartSheetRow = range.s.r + 1; // data starts just after header

  for (let r = dataStartSheetRow; r <= range.e.r; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: range.s.c + caseColIndex });
    const cell: any = (ws as any)[addr];
    if (cell && cell.c && Array.isArray(cell.c) && cell.c.length) {
      const note = cell.c.map((cc: any) => cc.t).join("\n").trim();
      const dataRowIndex = r - dataStartSheetRow + 1; // 1-based index aligned with rows[]
      if (note) commentsByRow[dataRowIndex] = note;
    }
  }

  return { rows, caseColIndex, commentsByRow };
}


