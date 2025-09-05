import { AutomationPlan } from "./types.js";
import { automationPlanToCsvBuffer } from "./csv.js";
import { automationPlanToMarkdown } from "./md.js";
import { ensureDirForFile, writeFileAtomic } from "./filesystem.js";

export async function emitAutomationCsv(plan: AutomationPlan, outFile: string): Promise<void> {
  await ensureDirForFile(outFile);
  const buf = automationPlanToCsvBuffer(plan);
  await writeFileAtomic(outFile, buf);
  console.log(`Automation CSV written → ${outFile} (${plan.length} rows)`);
}

export async function emitAutomationMarkdown(plan: AutomationPlan, outFile: string): Promise<void> {
  await ensureDirForFile(outFile);
  const md = automationPlanToMarkdown(plan);
  await writeFileAtomic(outFile, md);
  console.log(`Automation Markdown written → ${outFile} (${plan.length} rows)`);
}

export async function emitAutomation(
  plan: AutomationPlan,
  opts: { csvFile?: string; mdFile?: string }
): Promise<void> {
  const { csvFile, mdFile } = opts;
  if (!csvFile && !mdFile) return;
  if (csvFile) await emitAutomationCsv(plan, csvFile);
  if (mdFile) await emitAutomationMarkdown(plan, mdFile);
}

export * from "./types.js";


