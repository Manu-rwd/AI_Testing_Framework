export interface CoverageItem {
  bucket: string;
  narrative: string;
  facets?: string[];
}
export interface CoverageDoc { items: CoverageItem[] }

export interface ManualItem {
  bucket: string;
  narrative: string;
  facets?: string[];
}
export interface MatchPair { cov: CoverageItem; man: ManualItem; jaccard: number }

export interface ScoreResult {
  overall: { percent: number; matched: number; total: number; threshold: number; pass: boolean };
  matched: MatchPair[];
  missing: CoverageItem[];
  extra: ManualItem[];
  mismatched: MatchPair[];
}


