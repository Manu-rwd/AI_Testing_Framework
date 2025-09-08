import { CsvContext, RuleFn, RuleId, ValidateResult } from "./types.js";
import { loadCsv } from "./utils.js";
import {
  ruleEncodingEol, ruleHeader, ruleCompactJson, ruleSelectors, ruleReviewValues, ruleModuleAccesareMin10
} from "./rules.js";

export const RULES: Record<RuleId, RuleFn> = {
  "encoding-eol": ruleEncodingEol,
  "header": ruleHeader,
  "compact-json": ruleCompactJson,
  "selectors": ruleSelectors,
  "review-values": ruleReviewValues,
  "module-accesare-min10": ruleModuleAccesareMin10,
};

export async function validateFile(file: string, selected?: RuleId[], opts?: { module?: string }): Promise<ValidateResult> {
  const ctx: CsvContext = await loadCsv(file);
  const ruleKeys = selected?.length ? selected : (Object.keys(RULES) as RuleId[]);
  const issues = ruleKeys.flatMap(k => RULES[k](ctx, { module: opts?.module }));
  return { file, issues };
}



