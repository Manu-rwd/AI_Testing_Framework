import fs from "fs-extra";
import path from "node:path";
import { loadRules } from "@pkg/rules";
import { parseUS } from "./us-parse";
import { repoRoot } from "./util/paths";

export async function runPlanner(opts: { rulesPath: string; usPath: string; type: string }) {
  const rules = loadRules(opts.rulesPath);
  const usText = await fs.readFile(opts.usPath, "utf8");
  const us = parseUS(usText);

  const outputs: any[] = [];
  for (const step of rules.flow) {
    const sheet = step.sheet;
    const normPath = path.join(repoRoot, `data/templates/${sheet}.normalized.json`);
    if (!fs.existsSync(normPath)) continue;
    const rows: any[] = JSON.parse(await fs.readFile(normPath, "utf8"));
    // 1) filter by Tip functionalitate
    let scoped = rows.filter(r => (r.tipFunctionalitate || []).includes(opts.type));

    // 2) optional bucket restriction (only if rules request it)
    const wantsBucketMatch = (step as any)?.buckets?.match_from_us;
    if (wantsBucketMatch) {
      const usBuckets = (us.buckets || []).map(b => b.toLowerCase());
      if (usBuckets.length > 0) {
        scoped = scoped.filter(r => {
          const b = (r.bucket || "").toLowerCase();
          // keep empty bucket rows too (they're often general)
          return b === "" || usBuckets.includes(b);
        });
      }
    }

    outputs.push(...scoped.map(r => ({ ...r, _sheet: sheet })));
  }

  return { us, outputs };
}


