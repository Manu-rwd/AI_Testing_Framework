#!/usr/bin/env tsx
import path from "node:path";
import fs from "fs-extra";
import { generatePlanV2 } from "./v2/generate";

type Flags = {
  type?: string;
  rules?: string;
  us?: string;
  project?: string;
  "apply-project-fallbacks"?: string | boolean;
  buckets?: "strict" | "lax";
  "out-csv"?: string;
  "out-md"?: string;
  json?: boolean;
};

function parseArgv(argv: string[]): Flags {
  const out: any = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

async function maybeNormalizeUS(usPath: string): Promise<string> {
  if (usPath.toLowerCase().endsWith(".yaml") || usPath.toLowerCase().endsWith(".yml")) return usPath;
  if (usPath.toLowerCase().endsWith(".txt")) {
    // Try to invoke Module 2 CLI if present; else instruct the user.
    const candidates = [
      "packages/us-review/src/cli.ts",
      "packages/usreview/src/cli.ts",
      "packages/planner/src/cli_us_review.ts",
      "packages/planner/src/cli_module2.ts",
    ];
    for (const rel of candidates) {
      const full = path.resolve(process.cwd(), rel);
      if (await fs.pathExists(full)) {
        const out = path.resolve(process.cwd(), ".tmp", "US_Normalized.yaml");
        await fs.ensureDir(path.dirname(out));
        const cmd = `pnpm -s tsx ${rel} --in "${usPath}" --out "${out}"`;
        console.log(`[info] Normalizing US via: ${cmd}`);
        const cp = await import("node:child_process");
        cp.execSync(cmd, { stdio: "inherit", shell: true });
        return out;
      }
    }
    throw new Error(
      "US input is .txt but Module 2 normalizer CLI was not found. Please run Module 2 to produce docs/us/US_Normalized.yaml."
    );
  }
  throw new Error(`Unsupported US file extension: ${usPath}`);
}

async function main() {
  const flags = parseArgv(process.argv);
  const required = ["type", "rules", "us"];
  for (const r of required) {
    if (!(flags as any)[r]) {
      console.error(`Missing --${r}`);
      process.exit(2);
    }
  }
  const type = String(flags.type);
  const rulesPath = path.resolve(String(flags.rules));
  const usPathRaw = path.resolve(String(flags.us));
  const usPath = await maybeNormalizeUS(usPathRaw);
  const projectPath = flags.project ? path.resolve(String(flags.project)) : undefined;

  const plan = await generatePlanV2({
    type,
    rulesPath,
    usPath,
    projectPath,
    buckets: flags.buckets as any,
    applyProjectFallbacks:
      flags["apply-project-fallbacks"] === undefined ? true : Boolean(flags["apply-project-fallbacks"]),
    outCsv: flags["out-csv"] ? path.resolve(String(flags["out-csv"])) : undefined,
    outMd: flags["out-md"] ? path.resolve(String(flags["out-md"])) : undefined,
    json: Boolean(flags.json),
  });

  if (flags.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(`[ok] Planner v2 emitted ${plan.rows.length} row(s). Overall confidence: ${plan.overall_confidence.toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});


