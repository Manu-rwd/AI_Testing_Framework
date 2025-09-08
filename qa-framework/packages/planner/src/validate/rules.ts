import { CsvContext, RuleFn } from "./types.js";
import {
  MODULE5_HEADER, REVIEW_SUFFIX,
  SELECTOR_NEEDS_ALLOWED, SELECTOR_STRATEGY_ALLOWED,
  isCompactJsonString, decimalsAtMost, pickCols,
  REVIEW_DISPOSITION_ALLOWED,
} from "./utils.js";

// 1) Encoding/EOL
export const ruleEncodingEol: RuleFn = (ctx) => {
  const issues = [] as ReturnType<RuleFn>;
  if (!ctx.hasBOM) issues.push({ level:"error", file:ctx.file, code:"E001", message:"Missing UTF-8 BOM" });
  if (ctx.eol !== "CRLF") issues.push({ level:"error", file:ctx.file, code:"E002", message:`Line endings must be CRLF, found ${ctx.eol}` });
  // Quick RFC4180 sanity: header must parse to multiple columns
  if ((ctx.header?.length ?? 0) < 2) issues.push({ level:"error", file:ctx.file, code:"E003", message:"CSV header parse failed / single column" });
  return issues;
};

// 2) Header shape (module5 + optional review suffix)
export const ruleHeader: RuleFn = (ctx) => {
  const issues = [] as ReturnType<RuleFn>;
  const h = ctx.header;
  const need = MODULE5_HEADER;
  for (let i=0;i<need.length;i++){
    if (h[i] !== need[i]) {
      issues.push({ level:"error", file:ctx.file, code:"H001", message:`Header mismatch at index ${i}: expected "${need[i]}", got "${h[i] ?? ""}"` });
      return issues;
    }
  }
  // if more columns exist, they must equal review suffix exactly
  if (h.length > need.length) {
    const tail = h.slice(need.length);
    const exp = Array.from(REVIEW_SUFFIX);
    if (tail.length !== exp.length || !tail.every((v,idx)=>v===exp[idx])) {
      issues.push({ level:"error", file:ctx.file, code:"H002", message:`Review columns must be appended exactly: ${exp.join(",")}` });
    }
  }
  return issues;
};

// helpers for row scanning
function* dataRows(ctx: CsvContext) {
  for (let r=1; r<ctx.rows.length; r++) {
    const row = ctx.rows[r]!;
    if (row.length === 1 && row[0] === "") continue;
    yield [r+1, row] as const; // 1-based incl header
  }
}

// 3) Compact JSON & confidence
export const ruleCompactJson: RuleFn = (ctx) => {
  const issues = [] as ReturnType<RuleFn>;
  const h = ctx.header;
  const idxAtoms = h.indexOf("atoms");
  const idxRuleTags = h.indexOf("rule_tags");
  const idxConf = h.indexOf("confidence");
  for (const [rowNum, row] of dataRows(ctx)) {
    if (idxAtoms >= 0) {
      const v = row[idxAtoms] ?? "";
      if (v && !isCompactJsonString(v)) {
        issues.push({ level:"error", file:ctx.file, row:rowNum, code:"J001", message:`atoms must be compact JSON` });
      }
    }
    if (idxRuleTags >= 0) {
      const v = row[idxRuleTags] ?? "";
      if (v && !isCompactJsonString(v)) {
        issues.push({ level:"error", file:ctx.file, row:rowNum, code:"J002", message:`rule_tags must be compact JSON array` });
      }
    }
    if (idxConf >= 0) {
      const v = row[idxConf] ?? "";
      if (!decimalsAtMost(v, 3)) {
        issues.push({ level:"error", file:ctx.file, row:rowNum, code:"J003", message:`confidence must have ≤3 decimals` });
      }
    }
  }
  return issues;
};

// 4) Selector / data_profile constraints
export const ruleSelectors: RuleFn = (ctx) => {
  const issues = [] as ReturnType<RuleFn>;
  const h = ctx.header;
  const iStrategy = h.indexOf("selector_strategy");
  const iNeeds = h.indexOf("selector_needs");
  const iProfile = h.indexOf("data_profile");
  for (const [rowNum, row] of dataRows(ctx)) {
    if (iStrategy >= 0) {
      const v = (row[iStrategy] ?? "").trim();
      if (!v || !SELECTOR_STRATEGY_ALLOWED.has(v)) {
        issues.push({ level:"error", file:ctx.file, row:rowNum, code:"S001", message:`selector_strategy invalid: "${v}"` });
      }
    }
    if (iNeeds >= 0) {
      const raw = (row[iNeeds] ?? "").toLowerCase();
      const parts = raw.split(/[\s,|]+/).filter(Boolean);
      for (const p of parts) {
        if (!SELECTOR_NEEDS_ALLOWED.has(p)) {
          issues.push({ level:"error", file:ctx.file, row:rowNum, code:"S002", message:`selector_needs invalid value: "${p}"` });
        }
      }
    }
    if (iProfile >= 0) {
      const v = row[iProfile] ?? "";
      if (v) {
        try {
          const obj = JSON.parse(v);
          if (typeof obj !== "object" || Array.isArray(obj)) throw new Error("data_profile must be JSON object");
        } catch {
          issues.push({ level:"error", file:ctx.file, row:rowNum, code:"S003", message:`data_profile must be valid JSON object` });
        }
      }
    }
  }
  return issues;
};

// 5) Review values validity
export const ruleReviewValues: RuleFn = (ctx) => {
  const issues = [] as ReturnType<RuleFn>;
  const h = ctx.header;
  const hasReview = h.length > 13;
  if (!hasReview) return issues;

  const dispIdx = h.indexOf("review_disposition");
  const feas2Idx = h.lastIndexOf("feasibility"); // the review one (duplicate name)
  const ALLOWED_DISP = REVIEW_DISPOSITION_ALLOWED;
  const FEAS = new Set(["High","Medium","Low","H","M","L"]);

  for (const [rowNum, row] of dataRows(ctx)) {
    const disp = (row[dispIdx] ?? "").trim();
    const feas = (row[feas2Idx] ?? "").trim();
    if (disp && !ALLOWED_DISP.has(disp)) {
      issues.push({ level:"error", file:ctx.file, row:rowNum, code:"R001", message:`review_disposition invalid: "${disp}"` });
    }
    if (feas && !FEAS.has(feas)) {
      issues.push({ level:"error", file:ctx.file, row:rowNum, code:"R002", message:`review feasibility invalid: "${feas}"` });
    }
  }
  return issues;
};

// 6) Module-specific: Accesare ≥10 reviewed Adăugare rows
export const ruleModuleAccesareMin10: RuleFn = (ctx, opts) => {
  const issues = [] as ReturnType<RuleFn>;
  if ((opts.module ?? "").toLowerCase() !== "accesare") return issues;
  const h = ctx.header;
  const hasReview = h.length > 13;
  if (!hasReview) return issues;

  const idxTF = h.indexOf("tipFunctionalitate");
  const idxDisp = h.indexOf("review_disposition");
  const idxModule = h.indexOf("module");
  let count = 0;
  for (const [_, row] of dataRows(ctx)) {
    const isAcc = (row[idxModule] ?? "").trim().toLowerCase() === "accesare";
    const tf = (row[idxTF] ?? "").toLowerCase();
    const isAdaugare = tf.includes("adaugare");
    const disp = (row[idxDisp] ?? "").trim();
    if (isAcc && isAdaugare && disp) count++;
  }
  if (count < 10) {
    issues.push({ level:"error", file:ctx.file, code:"M001", message:`Accesare requires ≥10 reviewed Adăugare rows; found ${count}` });
  }
  return issues;
};


