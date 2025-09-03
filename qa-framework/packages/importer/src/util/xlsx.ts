import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "node:fs";
(XLSX as any).set_fs?.(fs);

export type Row = Record<string, any>;

export function readSheetRows(filePath: string, sheetName: string): { rows: Row[]; comments: Record<number, string> } {
  const wb = XLSX.readFile(filePath, { cellStyles: true, cellComments: true } as any);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);
  const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  const comments: Record<number, string> = {};
  Object.keys(ws).forEach((cell) => {
    const c: any = (ws as any)[cell];
    if (c && c.c && Array.isArray(c.c) && c.c.length) {
      const ref = XLSX.utils.decode_cell(cell); // { r: rowIndex, c: colIndex }
      const note = c.c.map((cc: any) => cc.t).join("\n").trim();
      if (note) comments[ref.r] = note;
    }
  });

  return { rows, comments };
}


