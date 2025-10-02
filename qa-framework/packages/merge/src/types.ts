export type SourceTier = "us" | "project" | "uiux" | "coverage" | "qa_library" | "defaults";

export interface MergeInputs {
  us?: any;
  project?: any;
  uiux?: any;
  coverage?: any;
  qa_library?: any;
  defaults?: any;
}

export interface LineProvenance {
  source: SourceTier;
  confidence_bump: number;
}

export interface PlanLine<T = any> {
  value: T;
  __prov: LineProvenance;
}

export type PlanModel = Record<string, any>;

