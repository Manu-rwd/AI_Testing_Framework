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
  // Optional UI/UX facet surface (produced by planner/merge)
  uiux?: {
    tip?: string;
    overlays?: Array<{ family: string; baseline?: string[] }>;
    columns?: Array<{
      label: string;
      sortable?: boolean;
      header?: { visible?: boolean; align?: string; icon?: string; tooltip?: string };
      value?: { format?: string; mask?: string; constraints?: string[]; link?: string };
    }>;
    table?: { paginated?: boolean; stickyHeader?: boolean; columnVisibilityMenu?: boolean };
    resilience?: { offline?: boolean; slow?: boolean; loadingSLAms?: number; dropOnAccess?: boolean; dropDuringAction?: boolean };
    responsive?: { breakpoints?: string[] };
    pagination?: { sizes?: number[] };
    auth?: { roles?: string[]; unauthRedirect?: string };
  };
  [k: string]: any;
}

export interface EmitOptions {
  filterTip?: string | null;
  includeGeneralOnly?: boolean; // if true, include only cases with general_valabile == 1/true
  title?: string; // document title
  compatAuthStandalone?: boolean; // if true, emit legacy auth outcome lines for coverage
  qaStyle?: boolean; // if true, return QA-style numbered cases instead of bucket lines
  removeProvenance?: boolean; // if true, strip provenance HTML comments
}

// Normalized manual line (used internally before rendering)
export interface ManualLine {
  bucket: string; // e.g., presence, sorting, pagination, auth, resilience
  narrative: string; // human-readable narrative; normalized text used by parity
  facets: string[]; // tokens aiding scorer matching (order-insensitive)
  provenance?: ("us"|"project"|"uiux"|"qa_library"|"defaults")[];
  // Sorting metadata to ensure stable order
  sort?: {
    family?: string; // overlay family, or facet family
    label?: string;  // column label or control label
    scenario?: string; // scenario name (e.g., offline/slow)
    ascDesc?: "ASC"|"DESC"; // sorting split
  };
}


