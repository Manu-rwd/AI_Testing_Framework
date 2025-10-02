import type { SourceTier, LineProvenance } from "./types";

const BUMPS: Record<SourceTier, number> = {
  us: 0,
  project: 0.03,
  uiux: 0.02,
  coverage: 0.01,
  qa_library: 0.01, // alias accepted by spec
  defaults: 0
};

export function provenance(source: SourceTier): LineProvenance {
  return { source, confidence_bump: BUMPS[source] ?? 0 };
}

