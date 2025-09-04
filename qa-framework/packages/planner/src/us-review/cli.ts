#!/usr/bin/env tsx
import path from "node:path";
import fs from "fs-extra";
import { normalizeUSFromFile } from "./normalize";
import { computeConfidence, DEFAULT_WEIGHTS } from "./confidence";
import { buildGaps } from "./gaps";
import { writeGapsMd, writeUSYaml } from "./emit";
import { applyProjectFallbacks } from "./applyProject";

function parseArgs(argv: string[]) {
  const out: Record<string, any> = {
    "apply-project-fallbacks": true,
    strict: true,
    "min-confidence": 0.6,
    "out-us": "./docs/us/US_Normalized.yaml",
    "out-gaps": "./docs/us/US_Gaps.md",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    const setBool = (k: string, v: boolean) => { out[k] = v; };
    if (a === "--us") { out.us = next; i++; }
    else if (a === "--project") { out.project = next; i++; }
    else if (a === "--apply-project-fallbacks") { setBool("apply-project-fallbacks", true); }
    else if (a === "--no-apply-project-fallbacks") { setBool("apply-project-fallbacks", false); }
    else if (a === "--strict") { setBool("strict", true); }
    else if (a === "--lax") { setBool("strict", false); }
    else if (a === "--min-confidence") { out["min-confidence"] = parseFloat(next); i++; }
    else if (a === "--out-us") { out["out-us"] = next; i++; }
    else if (a === "--out-gaps") { out["out-gaps"] = next; i++; }
    else if (a === "--json") { out.json = true; }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.us) {
    console.error("Eroare: --us <path> este obligatoriu.");
    process.exit(1);
  }

  let n = normalizeUSFromFile(args.us, { strict: !!args.strict });
  // Initial confidence & gaps
  n.confidence = computeConfidence(n, DEFAULT_WEIGHTS);
  let gaps = buildGaps(n);

  // Optional project fallbacks
  if (args.project && args["apply-project-fallbacks"]) {
    n = applyProjectFallbacks(n, args.project);
    // Recompute gaps against new normalized
    gaps = buildGaps(n);
  }

  // Emit outputs
  const usOut = await writeUSYaml(n, args["out-us"]);
  const gapsOut = await writeGapsMd(gaps, args["out-gaps"]);

  if (args.json) {
    process.stdout.write(JSON.stringify(n, null, 2) + "\n");
  } else {
    console.log(`Scris: ${usOut}`);
    console.log(`Scris: ${gapsOut}`);
    console.log(`Scor încredere (overall): ${n.confidence?.overall?.toFixed(3)}`);
  }

  const minc = Number(args["min-confidence"] ?? 0);
  if (n.confidence && n.confidence.overall < minc) {
    console.error(`Prag de încredere neîndeplinit: ${n.confidence.overall.toFixed(3)} < ${minc}. Consultați: ${path.resolve(gapsOut)}`);
    process.exit(2);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


