export interface PlanCase {
  id: string | number;
  module?: string;
  tipFunctionalitate?: string;
  general_valabile?: number | boolean;
  nume?: string; // Romanian display name
  preconditii?: string[];
  pasi?: string[];
  rezultat_asteptat?: string[];
  observatii?: string[];
  severitate?: string;
  prioritate?: string;
  // arbitrary extra fields are ignored for strict manual doc
  [k: string]: any;
}

export interface MergedPlan {
  // free-form; we only care about "cases" array if present,
  // otherwise attempt to derive from top-level "tests" or "plan"
  cases?: PlanCase[];
  tests?: PlanCase[];
  plan?: PlanCase[];
  [k: string]: any;
}

export interface EmitOptions {
  filterTip?: string | null;
  includeGeneralOnly?: boolean; // if true, include only cases with general_valabile == 1/true
  title?: string; // document title
}


