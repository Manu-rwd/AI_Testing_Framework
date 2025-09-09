import type { PlanRow } from "../v2/types.js";

/** Keep in sync with tests & AC */
export const AUTOMATION_CSV_COLUMNS = [
  "module",
  "tipFunctionalitate",
  "bucket",
  "narrative_ro",
  "atoms",
  "selector_needs",
  "selector_strategy",
  "selector_strategy.primary",
  "selector_strategy.fallbacks",
  "selector_strategy.source",
  "selector_strategy.confidence",
  "selectors",
  "data_profile",
  "data_profile.minimal_valid",
  "data_profile.invalid_regex",
  "data_profile.edge_cases",
  "data_profile.source",
  "data_profile.confidence",
  "feasibility",
  "source",
  "confidence",
  "rule_tags",
  "notes",
] as const;

function csvEscape(field: string): string {
  const needsQuote = /[",\r\n]/.test(field);
  if (!needsQuote) return field;
  return `"${field.replace(/"/g, '""')}"`;
}

function toCompactJSON(value: unknown): string {
  return JSON.stringify(value);
}

function formatConfidence(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : "";
}

export function automationPlanToCsvBuffer(rows: PlanRow[]): Buffer {
  const bom = "\uFEFF";
  const header = AUTOMATION_CSV_COLUMNS.join(",") + "\r\n";
  const body = (rows || []).map(r => {
    const atoms = toCompactJSON(r.atoms ?? { setup: [], action: [], assert: [] });
    const tags = toCompactJSON(r.rule_tags ?? []);
    const selectors = Array.isArray((r as any).selectors) ? (r as any).selectors.join(";") : "";
    const fields = [
      r.module ?? "",
      r.tipFunctionalitate ?? "",
      r.bucket ?? "",
      r.narrative_ro ?? "",
      atoms,
      r.selector_needs ?? "",
      r.selector_strategy ?? "",
      (r as any)["selector_strategy.primary"] ?? "",
      (r as any)["selector_strategy.fallbacks"] ?? "",
      (r as any)["selector_strategy.source"] ?? "",
      (r as any)["selector_strategy.confidence"] ?? "",
      selectors,
      r.data_profile ?? "",
      (r as any)["data_profile.minimal_valid"] ?? "",
      (r as any)["data_profile.invalid_regex"] ?? "",
      (r as any)["data_profile.edge_cases"] ?? "",
      (r as any)["data_profile.source"] ?? "",
      (r as any)["data_profile.confidence"] ?? "",
      r.feasibility ?? "",
      r.source ?? "",
      r.confidence != null ? formatConfidence(r.confidence) : "",
      tags,
      r.notes ?? "",
    ].map(v => csvEscape(String(v)));
    return fields.join(",") + "\r\n";
  }).join("");
  return Buffer.from(bom + header + body, "utf8");
}


