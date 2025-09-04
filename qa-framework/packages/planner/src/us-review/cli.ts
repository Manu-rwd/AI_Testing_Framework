#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizeUS } from "./normalize";
import { computeConfidence } from "./confidence";
import { buildGaps, gapsMarkdown } from "./gaps";
import { writeGapsMd, writeNormalizedYaml } from "./emit";
import { applyProjectFallbacks } from "./applyProject";

type Args = {
  us?: string;
  project?: string;
  applyProjectFallbacks?: boolean;
  strict?: boolean;
  lax?: boolean;
  minConfidence?: number;
  outUs?: string;
  outGaps?: string;
  json?: boolean;
};

function parseArgv(argv: string[]): Args {
  const a: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    switch (k) {
      case "--us": a.us = v; i++; break;
      case "--project": a.project = v; i++; break;
      case "--apply-project-fallbacks": a.applyProjectFallbacks = true; break;
      case "--strict": a.strict = true; break;
      case "--lax": a.lax = true; break;
      case "--min-confidence": a.minConfidence = Number(v); i++; break;
      case "--out-us": a.outUs = v; i++; break;
      case "--out-gaps": a.outGaps = v; i++; break;
      case "--json": a.json = true; break;
    }
  }
  return a;
}

async function main() {
  const args = parseArgv(process.argv.slice(2));
  if (!args.us) {
    console.error("Lipsă argument: --us <path-către-user-story>");
    process.exit(1);
  }
  const strict = args.strict ?? !args.lax;
  const minConfidence = args.minConfidence ?? 0.6;
  const cwd = process.cwd();
  const defaultOutDir = (/[\\\/]packages[\\\/]planner$/i.test(cwd)
    ? path.resolve(cwd, "../../docs/us")
    : path.resolve(cwd, "docs/us"));
  const outUs = path.resolve(args.outUs ?? path.join(defaultOutDir, "US_Normalized.yaml"));
  const outGaps = path.resolve(args.outGaps ?? path.join(defaultOutDir, "US_Gaps.md"));
  const projectPath = args.project ? path.resolve(args.project) : undefined;

  const raw = await fs.promises.readFile(path.resolve(args.us), "utf8");
  let us = normalizeUS(raw, { strict });
  us = computeConfidence(us);

  if (args.applyProjectFallbacks ?? true) {
    const { us: merged } = applyProjectFallbacks(us, projectPath);
    us = computeConfidence(merged);
  }

  const gaps = buildGaps(us);
  const md = gapsMarkdown(us, gaps);

  await writeNormalizedYaml(outUs, us);
  console.log(`Scris: ${outUs}`);
  await writeGapsMd(outGaps, md);
  console.log(`Scris: ${outGaps}`);

  console.log(`Scor încredere (overall): ${us.confidence.overall}`);

  if (args.json) {
    console.log(JSON.stringify(us, null, 2));
  }

  if (us.confidence.overall < minConfidence) {
    console.error(`Prag de încredere neîndeplinit: ${us.confidence.overall} < ${minConfidence}. Consultați: ${outGaps}`);
    process.exit(2);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


