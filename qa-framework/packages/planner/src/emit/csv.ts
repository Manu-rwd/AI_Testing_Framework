import fs from "fs-extra";
import { stringify } from "csv-stringify";

export async function emitCSV(filePath: string, rows: any[]) {
  const stringifier = stringify({
    header: true,
    columns: ["Modul","TipFunctionalitate","Bucket","GeneralValabile","Caz","Placeholders","StepHints","Automat","Local","Test","Prod","Impact","Efort","Importanta"]
  });
  const ws = fs.createWriteStream(filePath);
  stringifier.pipe(ws);
  for (const r of rows) {
    stringifier.write({
      Modul: r.module || r._sheet,
      TipFunctionalitate: (r.tipFunctionalitate || []).join(", "),
      Bucket: r.bucket ?? "",
      GeneralValabile: r.generalValabile ? 1 : 0,
      Caz: r.narrative_ro,
      Placeholders: (r.placeholders || []).join(" | "),
      StepHints: r.step_hints ?? "",
      Automat: r.env?.automat ?? "",
      Local: r.env?.local ?? "",
      Test: r.env?.test ?? "",
      Prod: r.env?.prod ?? "",
      Impact: r.impact ?? "",
      Efort: r.efort ?? "",
      Importanta: r.importanta ?? ""
    } as any);
  }
  stringifier.end();
}


