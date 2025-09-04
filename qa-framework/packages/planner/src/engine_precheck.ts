import path from "node:path";
import fs from "node:fs";
import { normalizeUS } from "./us-review/normalize";
import { computeConfidence } from "./us-review/confidence";
import { buildGaps, gapsMarkdown } from "./us-review/gaps";
import { writeGapsMd, writeNormalizedYaml } from "./us-review/emit";
import { applyProjectFallbacks } from "./us-review/applyProject";

export type PrecheckOptions = {
  usPath: string;
  projectPath?: string;
  minConfidence?: number;
  strict?: boolean;
  outDir?: string;
};

export async function precheckUS(opts: PrecheckOptions): Promise<{ ok: boolean; score: number; gapsPath: string; usPath: string; }> {
  const strict = !!opts.strict;
  const outDir = opts.outDir ?? path.resolve(process.cwd(), "docs/us");
  await fs.promises.mkdir(outDir, { recursive: true });
  const outUs = path.join(outDir, "US_Normalized.yaml");
  const outGaps = path.join(outDir, "US_Gaps.md");
  const min = opts.minConfidence ?? 0.6;

  const raw = await fs.promises.readFile(path.resolve(opts.usPath), "utf8");
  let us = normalizeUS(raw, { strict });
  us = computeConfidence(us);

  const { us: merged } = applyProjectFallbacks(us, opts.projectPath);
  us = computeConfidence(merged);

  const gaps = buildGaps(us);
  const md = gapsMarkdown(us, gaps);

  await writeNormalizedYaml(outUs, us);
  await writeGapsMd(outGaps, md);

  return { ok: us.confidence.overall >= min, score: us.confidence.overall, gapsPath: outGaps, usPath: outUs };
}


