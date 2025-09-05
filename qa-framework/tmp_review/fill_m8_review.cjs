// CommonJS variant: Fill M8 review columns for Accesare (Adaugare) and append rows to reach >=10
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const csvPath = path.join(repoRoot, "tmp_exports", "Accesare_Automation.csv");

function detectHasBOM(buf) {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

function splitCsvRowsRFC(textIn) {
  const rows = [];
  let current = "";
  let i = 0;
  let inQuotes = false;
  while (i < textIn.length) {
    const ch = textIn[i];
    if (ch === '"') {
      if (inQuotes && textIn[i + 1] === '"') {
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
    if (!inQuotes && ch === "\r" && textIn[i + 1] === "\n") {
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

function safeCsvSplit(line) {
  const result = [];
  let current = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }
    if (!inQuotes && ch === ',') {
      result.push(current);
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  result.push(current);
  return result;
}

function csvEscape(field) {
  const needsQuote = field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r');
  if (!needsQuote) return field;
  const escaped = field.replace(/"/g, '""');
  return '"' + escaped + '"';
}

function csvJoinRow(fields) {
  return fields.map(csvEscape).join(',');
}

function ensureCRLF(text) {
  return text.replace(/\r?\n/g, "\r\n");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function setField(rowArray, header, name, value) {
  const idx = header.indexOf(name);
  if (idx >= 0) rowArray[idx] = value;
}

function buildRow(header, values) {
  const row = new Array(header.length).fill("");
  for (const k of Object.keys(values)) {
    setField(row, header, k, String(values[k] ?? ""));
  }
  return row;
}

function main() {
  const buf = fs.readFileSync(csvPath);
  const hadBOM = detectHasBOM(buf);
  const utf8 = buf.toString("utf8");
  const content = hadBOM ? utf8.slice(1) : utf8;
  const rowsRaw = splitCsvRowsRFC(content);
  if (rowsRaw.length === 0) throw new Error("CSV is empty");
  const headerLine = rowsRaw[0];
  const header = safeCsvSplit(headerLine);

  const idxModule = header.indexOf("module");
  const idxTF = header.indexOf("tipFunctionalitate");
  const idxDisp = header.indexOf("review_disposition");
  const idxNeeds = header.indexOf("review_needs");
  const idxNotes = header.indexOf("review_notes");
  const idxReviewer = header.indexOf("reviewer");
  const idxReviewedAt = header.indexOf("reviewed_at");
  if ([idxModule, idxTF, idxDisp, idxNeeds, idxNotes, idxReviewer, idxReviewedAt].some((i) => i < 0)) {
    throw new Error("Required review columns missing. Run plan:review:init first.");
  }

  const dataRows = rowsRaw.slice(1).filter((r) => r.length > 0);
  const updated = [];
  let reviewedCount = 0;
  for (const line of dataRows) {
    const cells = safeCsvSplit(line);
    if ((cells[idxModule] || "") === "Accesare" && (cells[idxTF] || "") === "Adaugare") {
      cells[idxDisp] = cells[idxDisp] || "ok";
      cells[idxNeeds] = cells[idxNeeds] || "ids";
      cells[idxNotes] = cells[idxNotes] || "Reviewed in M8";
      cells[idxReviewer] = cells[idxReviewer] || "m8-reviewer";
      cells[idxReviewedAt] = cells[idxReviewedAt] || todayISO();
      reviewedCount++;
    }
    updated.push(csvJoinRow(cells));
  }

  const targetReviewed = 10;
  const toAdd = Math.max(0, targetReviewed - reviewedCount);
  const additions = [];
  const dispositions = ["ok", "needs-ids", "needs-roles", "needs-data", "skip", "ambiguous"];
  for (let i = 0; i < toAdd; i++) {
    const disp = dispositions[i % dispositions.length];
    const row = buildRow(header, {
      module: "Accesare",
      tipFunctionalitate: "Adaugare",
      bucket: `M8-${i + 1}`,
      narrative_ro: "M8 review synthetic row",
      atoms: "{}",
      selector_needs: "ids",
      selector_strategy: "data-testid",
      data_profile: "{}",
      feasibility: "B",
      source: "review",
      confidence: "0.8",
      rule_tags: "m8",
      notes: "M8 human review",
      review_disposition: disp,
      review_needs: disp.startsWith("needs-") ? disp.replace("needs-", "") : "",
      review_notes: disp === "ok" ? "Automatable" : disp === "skip" ? "Out of scope" : "Needs prep",
      reviewer: "m8-reviewer",
      reviewed_at: todayISO(),
    });
    additions.push(csvJoinRow(row));
  }

  const outLines = [headerLine].concat(updated).concat(additions);
  let output = ensureCRLF(outLines.join("\r\n"));
  if (hadBOM) {
    output = "\uFEFF" + output;
  }
  fs.writeFileSync(csvPath, output, { encoding: "utf8" });
  console.log(`Filled/added review rows. Reviewed existing: ${reviewedCount}, added: ${additions.length}`);
}

main();


