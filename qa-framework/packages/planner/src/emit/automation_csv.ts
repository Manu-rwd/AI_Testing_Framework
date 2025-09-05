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
  "data_profile",
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
  return (Math.round(n * 1000) / 1000).toString();
}

export function automationPlanToCsvBuffer(rows: PlanRow[]): Buffer {
  const bom = "\uFEFF";
  const header = AUTOMATION_CSV_COLUMNS.join(",") + "\r\n";
  const body = (rows || []).map(r => {
    const atoms = toCompactJSON(r.atoms ?? { setup: [], action: [], assert: [] });
    const tags = toCompactJSON(r.rule_tags ?? []);
    const fields = [
      r.module ?? "",
      r.tipFunctionalitate ?? "",
      r.bucket ?? "",
      r.narrative_ro ?? "",
      atoms,
      r.selector_needs ?? "",
      r.selector_strategy ?? "",
      r.data_profile ?? "",
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


