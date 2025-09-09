import fsx from "fs-extra";
import path from "node:path";

type Hist = Record<string, number>;

function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines: string[] = [];
  let cur = ""; let i = 0; let q = false;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '"') { if (q && text[i + 1] === '"') { cur += '"'; i += 2; continue; } q = !q; cur += ch; i++; continue; }
    if (!q && ch === "\r" && text[i + 1] === "\n") { lines.push(cur); cur = ""; i += 2; continue; }
    if (!q && ch === "\n") { lines.push(cur); cur = ""; i++; continue; }
    cur += ch; i++;
  }
  lines.push(cur);
  const split = (line: string): string[] => {
    const out: string[] = []; let s = ""; let inq = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j] as string;
      if (c === '"') { if (inq && line[j + 1] === '"') { s += '"'; j++; } else { inq = !inq; } continue; }
      if (c === ',' && !inq) { out.push(s); s = ""; continue; }
      s += c;
    }
    out.push(s);
    return out;
  };
  const header = lines.length > 0 ? split(lines[0] || "") : [];
  const rows = lines.slice(1).filter(l => l !== "").map(split);
  return { header, rows };
}

function histogram(values: string[]): Hist {
  const h: Hist = {};
  for (const v of values) h[v || "(gol)"] = (h[v || "(gol)"] || 0) + 1;
  return h;
}

function renderHistRO(title: string, h: Hist): string {
  const keys = Object.keys(h).sort();
  const lines = keys.map(k => `- ${k}: ${h[k]}`);
  return `### ${title}\n` + lines.join("\n") + "\n";
}

export async function buildMarkdownFragment(csvPath: string, validateSummary: string | undefined): Promise<string> {
  const buf = await fsx.readFile(csvPath);
  const txtAll = buf.toString("utf8");
  const txt = txtAll.charCodeAt(0) === 0xfeff ? txtAll.slice(1) : txtAll;
  const { header, rows } = parseCsv(txt);
  const dIdx = header.indexOf("disposition");
  const fIdx = header.indexOf("feasibility");
  const dispo = rows.map(r => r[dIdx] || "");
  const feas = rows.map(r => r[fIdx] || "");
  const h1 = histogram(dispo);
  const h2 = histogram(feas);
  const now = new Date();
  const tz = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "short", timeStyle: "short" }).format(now);
  let out = `- Data: ${tz}\n\n`;
  out += renderHistRO("Distribuție Dispoziții", h1) + "\n";
  out += renderHistRO("Distribuție Fezabilitate", h2) + "\n";
  if (validateSummary) out += `- Conformitate bucket: ${validateSummary}\n`;
  return out;
}

function formatDateYMD_Bucharest(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => String(parts.find(p => p.type === t)?.value || "");
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function upsertModuleDoc(
  docPath: string,
  moduleTitle: string,
  fragment: string,
  approved: boolean,
  cheatsheetPowershell: string,
  scopeLine: string
): Promise<void> {
  const exists = await fileExists(docPath);
  const statusLine = `Status: ${approved ? "Approved" : "În curs"}`;
  const today = formatDateYMD_Bucharest(new Date());
  const changelogEntry = [
    `### ${today}`,
    "- Extindere CSV cu coloane de review (disposition, feasibility, selector_needs, parameter_needs, notes)",
    "- Raport review actualizat pentru Vizualizare",
    "- Status setat: Approved",
    "",
  ].join("\n");

  if (!exists) {
    const text = [
      `# Modul Review — ${moduleTitle}`,
      "",
      "## Status & Scope",
      "",
      statusLine,
      `Modul: ${moduleTitle}`,
      `Sursă: ${scopeLine}`,
      "",
      "## Rezumat review",
      "",
      fragment.trim(),
      "",
      "## Observații & note",
      "",
      "- (nu sunt observații suplimentare)",
      "",
      "## Changelog",
      "",
      changelogEntry,
      "## Cheatsheet CLI",
      "",
      "```powershell",
      cheatsheetPowershell.trim(),
      "```",
      "",
    ].join("\n");
    await fsx.ensureDir(path.dirname(docPath));
    await fsx.writeFile(docPath, text, { encoding: "utf8" });
    return;
  }

  // Update existing
  let text = await fsx.readFile(docPath, { encoding: "utf8" });
  // Ensure title contains module title
  if (!/^#\s+Modul Review/i.test(text)) {
    text = `# Modul Review — ${moduleTitle}\n\n` + text;
  }
  // Status & Scope section and Status line
  if (!/##\s+Status\s*&\s*Scope/i.test(text)) {
    text = text + `\n\n## Status & Scope\n\n${statusLine}\nModul: ${moduleTitle}\nSursă: ${scopeLine}\n`;
  }
  text = text.replace(/Status:\s*(Approved|În curs)/i, statusLine);

  // Rezumat review: ensure section exists, then prepend latest fragment at the top of that section
  if (!/##\s+Rezumat review/i.test(text)) {
    text = text + `\n\n## Rezumat review\n\n`;
  }
  text = text.replace(/(##\s+Rezumat review[\s\S]*?)(\n##\s+|\n$)/i, (_m, p1: string, p2: string) => {
    const body = p1.endsWith("\n") ? p1 : p1 + "\n";
    return body + "\n" + fragment.trim() + "\n" + (p2 || "\n");
  });

  // Observații & note
  if (!/##\s+Observații\s*&\s*note/i.test(text)) {
    text = text + `\n\n## Observații & note\n\n- (nu sunt observații suplimentare)\n`;
  }

  // Changelog: append new entry at top of changelog section
  if (!/##\s+Changelog/i.test(text)) {
    text = text + `\n\n## Changelog\n\n`;
  }
  // Deduplicate by date: insert only if today's header not already present
  if (!new RegExp(`^###\\s+${today}\\b`, 'm').test(text)) {
    text = text.replace(/(##\s+Changelog\s*\n)/i, `$1\n${changelogEntry}`);
  }

  // Cheatsheet CLI
  if (!/##\s+Cheatsheet CLI/i.test(text)) {
    text = text + `\n\n## Cheatsheet CLI\n\n\`\`\`powershell\n${cheatsheetPowershell.trim()}\n\`\`\`\n`;
  }

  await fsx.writeFile(docPath, text, { encoding: "utf8" });
}

async function fileExists(p: string): Promise<boolean> {
  try { await fsx.stat(p); return true; } catch { return false; }
}

export async function upsertAccesareDoc(docPath: string, fragment: string, statusApproved: boolean): Promise<void> {
  const exists = await fileExists(docPath);
  if (!exists) {
    const base = `# Accesare (Adăugare)\n\n## Status\n\nStatus: ${statusApproved ? "Approved" : "În curs"}\n\n## Changelog\n\n${fragment}`;
    await fsx.ensureDir(path.dirname(docPath));
    await fsx.writeFile(docPath, base, { encoding: "utf8" });
    return;
  }
  const text = await fsx.readFile(docPath, { encoding: "utf8" });
  const statusRx = /## Status[\s\S]*?(Status:\s*)(.*)/i;
  let next = text;
  if (statusRx.test(next)) {
    next = next.replace(statusRx, (_m, p1) => `${p1}${statusApproved ? "Approved" : "În curs"}`);
  } else {
    next = next + `\n\n## Status\n\nStatus: ${statusApproved ? "Approved" : "În curs"}`;
  }
  const marker = "## Changelog";
  if (next.includes(marker)) {
    const parts = next.split(marker);
    const head = parts[0];
    const tail = parts.slice(1).join(marker);
    next = `${head}${marker}\n\n${fragment}${tail}`;
  } else {
    next = next + `\n\n## Changelog\n\n${fragment}`;
  }
  await fsx.writeFile(docPath, next, { encoding: "utf8" });
}
// Keep using fsx across the file for consistent fs-extra helpers
import { verifyFile } from "./verify.js";

export async function generateReport(inputFile: string, moduleName: string, outPath?: string): Promise<{ outFile: string }> {
  const result = await verifyFile(inputFile, moduleName, {});

  const dispCounts = new Map<string, number>();
  const idxDisp = 0; // compute from header via verifyFile if needed, but we only need counts from raw CSV again
  // Instead, quickly re-read and count dispositions without duplicating parsing logic too much
  // Keep CRLF and BOM concerns out; verifyFile already parsed rows count

  const buf = await fsx.readFile(inputFile);
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
  await fsx.mkdirp(path.dirname(outFile));

  const lines: string[] = [];
  lines.push(`# Review Summary: ${moduleName}`);
  lines.push("");
  lines.push(`Totals: rows=${totals.rows} incomplete=${totals.issues}`);
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

  await fsx.writeFile(outFile, lines.join("\r\n"), "utf8");
  console.log(`Totals: files=1 issues=${totalsIssues}`);
  console.log(`WROTE ${outFile}`);
  return { outFile };
}


