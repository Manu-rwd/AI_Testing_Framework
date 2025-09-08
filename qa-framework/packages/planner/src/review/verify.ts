import * as path from "node:path";
import * as fs from "node:fs/promises";
import { loadCsv, REVIEW_SUFFIX, REVIEW_DISPOSITION_ALLOWED } from "../validate/utils.js";
import { CsvContext } from "../validate/types.js";

export interface VerifyIssue {
  code: string; // RV001..RV006
  message: string;
  row?: number;
}

export interface VerifyResult {
  file: string;
  issues: VerifyIssue[];
  totals: { rows: number };
}

function headerEndsWithReviewSuffix(header: string[]): boolean {
  if (header.length < REVIEW_SUFFIX.length) return false;
  const tail = header.slice(-REVIEW_SUFFIX.length);
  const exp = Array.from(REVIEW_SUFFIX);
  if (tail.length === exp.length && tail.every((v, i) => v === exp[i])) return true;
  // allow 5-col tail without feasibility
  const tail5 = header.slice(-5);
  const exp5 = ["review_disposition","review_needs","review_notes","reviewer","reviewed_at"];
  return tail5.length === 5 && tail5.every((v, i) => v === exp5[i]);
}

function isIsoDateOrYMD(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  // ISO-8601 date-time
  const d = new Date(v);
  return !isNaN(d.getTime());
}

function* dataRows(ctx: CsvContext) {
  for (let r = 1; r < ctx.rows.length; r++) {
    const row = ctx.rows[r]!;
    if (row.length === 1 && row[0] === "") continue;
    yield [r + 1, row] as const; // 1-based incl header
  }
}

export async function verifyFile(file: string, moduleName?: string, opts?: { strict?: boolean }): Promise<VerifyResult> {
  const ctx = await loadCsv(file);
  const issues: VerifyIssue[] = [];

  // RV001: header ends with review suffix (5 or 6)
  if (!headerEndsWithReviewSuffix(ctx.header)) {
    issues.push({ code: "RV001", message: "Header must end with review columns (accepts 6-col or 5-col suffix)" });
    return { file, issues, totals: { rows: Math.max(0, ctx.rows.length - 1) } };
  }

  const idxDisp = ctx.header.indexOf("review_disposition");
  const idxNeeds = ctx.header.indexOf("review_needs");
  const idxNotes = ctx.header.indexOf("review_notes");
  const idxReviewer = ctx.header.indexOf("reviewer");
  const idxReviewedAt = ctx.header.indexOf("reviewed_at");

  for (const [rowNum, row] of dataRows(ctx)) {
    const disp = (row[idxDisp] ?? "").trim();
    const needs = (row[idxNeeds] ?? "").trim();
    const notes = (row[idxNotes] ?? "").trim();
    const reviewer = (row[idxReviewer] ?? "").trim();
    const reviewedAt = (row[idxReviewedAt] ?? "").trim();

    // RV002 disposition allowed (shared enum)
    if (disp && !REVIEW_DISPOSITION_ALLOWED.has(disp)) {
      issues.push({ code: "RV002", row: rowNum, message: `review_disposition invalid: "${disp}"` });
    }
    // RV003 reviewer non-empty
    if (!reviewer) {
      issues.push({ code: "RV003", row: rowNum, message: "reviewer must be non-empty" });
    }
    // RV004 reviewed_at valid date/time
    if (reviewedAt && !isIsoDateOrYMD(reviewedAt)) {
      issues.push({ code: "RV004", row: rowNum, message: "reviewed_at must be ISO-8601 or YYYY-MM-DD" });
    }
    // RV005 require needs and notes when disposition not OK
    const isOk = disp.toLowerCase() === "ok";
    if (disp && !isOk) {
      if (!needs || !notes) {
        issues.push({ code: "RV005", row: rowNum, message: "Non-OK disposition requires review_needs and review_notes" });
      }
    }
    // RV006 strict: require needs and notes even for OK
    if (opts?.strict) {
      if (isOk && (!needs || !notes)) {
        issues.push({ code: "RV006", row: rowNum, message: "Strict mode requires review_needs and review_notes for OK" });
      }
    }
  }

  return { file, issues, totals: { rows: Math.max(0, ctx.rows.length - 1) } };
}

export async function verifyAndPrint(file: string, moduleName?: string, opts?: { strict?: boolean; limit?: number }): Promise<number> {
  const res = await verifyFile(file, moduleName, { strict: opts?.strict });
  const cwd = process.cwd();
  const rel = path.relative(cwd, res.file);
  console.log(rel);
  if (!res.issues.length) {
    console.log("  OK\n");
    return 0;
  }
  const limit = typeof opts?.limit === "number" ? Math.max(1, opts!.limit!) : 50;
  let shown = 0;
  for (const i of res.issues) {
    if (shown >= limit) break;
    const loc = i.row ? `row ${i.row}` : "";
    console.log(`  [error] ${i.code} ${loc} — ${i.message}`);
    shown++;
  }
  console.log("");
  return res.issues.length ? 1 : 0;
}


