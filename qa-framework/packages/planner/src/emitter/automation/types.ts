export type Feasibility = "A" | "B" | "C" | "D" | "E";

export interface AAAAtoms {
  setup: string[];
  action: string[];
  assert: string[];
}

export interface AutomationPlanRow {
  module: string;
  tipFunctionalitate: string;
  bucket: string;
  narrative_ro: string;
  atoms: AAAAtoms;
  selector_needs: string; // serialized/summary form for needs
  selector_strategy: string; // e.g., data-testid-preferred
  data_profile: string; // profile key or JSON-ish summary
  feasibility: Feasibility;
  source: "US" | "project" | "defaults";
  confidence: number; // 0..1
  rule_tags: string[];
  notes: string;
}

export type AutomationPlan = AutomationPlanRow[];


