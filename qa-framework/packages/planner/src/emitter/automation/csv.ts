import { AutomationPlan, AutomationPlanRow } from "./types.js";

const COLUMNS: ReadonlyArray<keyof AutomationPlanRow> = [
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
];

function serializeAtoms(atoms: AutomationPlanRow["atoms"]): string {
  return JSON.stringify({ setup: atoms.setup, action: atoms.action, assert: atoms.assert });
}

function serializeRuleTags(tags: string[]): string {
  return JSON.stringify(tags);
}

function formatConfidence(conf: number): string {
  // Ensure max 3 decimals, without trailing zeros if not necessary
  return Number.isFinite(conf) ? conf.toFixed(3).replace(/\.0+$/g, (m) => (m === ".000" ? "" : m.replace(/0+$/g, ""))) : "";
}

function csvEscape(field: string): string {
  const needsQuote = /[",\n\r]/.test(field);
  if (needsQuote) {
    const doubled = field.replace(/"/g, '""');
    return `"${doubled}"`;
  }
  return field;
}

function rowToCsv(row: AutomationPlanRow): string {
  const values = COLUMNS.map((col) => {
    switch (col) {
      case "atoms":
        return serializeAtoms(row.atoms);
      case "rule_tags":
        return serializeRuleTags(row.rule_tags || []);
      case "confidence":
        return formatConfidence(row.confidence ?? 0);
      default:
        // Cast to any to index dynamically
        return String((row as any)[col] ?? "");
    }
  });
  return values.map(csvEscape).join(",");
}

export function automationPlanToCsvBuffer(plan: AutomationPlan): Buffer {
  const header = COLUMNS.join(",");
  const lines = [header, ...plan.map(rowToCsv)];
  // Ensure CRLF endings
  const contentCrlf = lines.join("\r\n") + "\r\n";
  // Prepend UTF-8 BOM
  const BOM = "\uFEFF";
  const withBom = BOM + contentCrlf;
  return Buffer.from(withBom, "utf8");
}

export { COLUMNS as AUTOMATION_CSV_COLUMNS };


