export type AAAAtoms = { setup: string[]; action: string[]; assert: string[] };

export type Feasibility = "A" | "B" | "C" | "D" | "E";
export type SelectorNeeds = "none" | "low" | "medium" | "high";
export type SourceProvenance = "US" | "project" | "defaults";

export interface AutomationPlanRow {
  module: string;                    // e.g., "Adăugare"
  tipFunctionalitate: string;        // Excel category
  bucket: string;                    // from US_Normalized buckets or project fallback
  narrative_ro: string;              // Romanian narrative, compact
  atoms: AAAAtoms;                   // Arrange/Act/Assert steps (strings, imperative, RO)
  selector_needs: SelectorNeeds;     // heuristic result
  selector_strategy: string;         // selected approach + short rationale
  data_profile: string;              // named profile or JSON summary
  feasibility: Feasibility;          // A–E
  source: SourceProvenance;          // provenance of fields (US/project/defaults)
  confidence: number;                // 0..1 with two decimals
  rule_tags: string[];               // tags from rule pack
  notes: string;                     // reviewer hints
}

export type AutomationPlan = AutomationPlanRow[];


