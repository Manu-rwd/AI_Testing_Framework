export type SelectorKind = "data-testid" | "role" | "label" | "aria" | "text" | "css" | "xpath";

export interface SelectorPolicy {
  order: SelectorKind[];
  disallow?: SelectorKind[];
  role_name_required?: boolean;
  fallback_text_max_len?: number;
}

export interface SelectorContext {
  policy: SelectorPolicy;
  rowHints?: string; // from row.selector_needs
}

export interface StrategyResult {
  strategy: string; // final label e.g. "data-testid-preferred"
  provenance: "US" | "project" | "defaults";
  confidenceBump: number; // 0..0.02
}


