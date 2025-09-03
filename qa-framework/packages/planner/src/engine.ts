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
    let scoped = rows.filter(r => (r.tipFunctionalitate || []).includes(opts.type));
    outputs.push(...scoped.map(r => ({ ...r, _sheet: sheet })));
  }

  return { us, outputs };
}


