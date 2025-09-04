import path from "node:path";
import { normalizeUSFromFile } from "./us-review/normalize";
import { computeConfidence, DEFAULT_WEIGHTS } from "./us-review/confidence";
import { buildGaps } from "./us-review/gaps";
import { writeGapsMd, writeUSYaml } from "./us-review/emit";
import { applyProjectFallbacks } from "./us-review/applyProject";

export interface PrecheckArgs {
  usPath: string;
  projectPath?: string;
  minConfidence?: number;
  strict?: boolean;
  outUs?: string;
  outGaps?: string;
  applyProjectFallbacks?: boolean;
}

export async function precheckUS(args: PrecheckArgs) {
  const {
    usPath,
    projectPath,
    minConfidence = 0.6,
    strict = true,
    outUs = "./docs/us/US_Normalized.yaml",
    outGaps = "./docs/us/US_Gaps.md",
    applyProjectFallbacks: applyFallbacks = true,
  } = args;

  let n = normalizeUSFromFile(usPath, { strict });
  n.confidence = computeConfidence(n, DEFAULT_WEIGHTS);
  let gaps = buildGaps(n);

  if (projectPath && applyFallbacks) {
    n = applyProjectFallbacks(n, projectPath);
    gaps = buildGaps(n);
  }

  await writeUSYaml(n, outUs);
  const gapsAbs = await writeGapsMd(gaps, outGaps);

  if ((n.confidence?.overall ?? 0) < minConfidence) {
    const err = new Error(`US Review gate a eșuat (${(n.confidence?.overall ?? 0).toFixed(3)} < ${minConfidence}). Consultați gaps: ${path.resolve(gapsAbs)}`);
    (err as any).gapsPath = path.resolve(gapsAbs);
    throw err;
  }
}


