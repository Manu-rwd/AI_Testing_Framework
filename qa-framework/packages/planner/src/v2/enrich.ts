import type { AutomationPlanRow } from "../emitter/automation/types.js";
import { selectStrategy } from "../selector/engine.js";
import { decideProfile } from "../data-profiles/engine.js";

export async function enrichRows(
  rows: AutomationPlanRow[],
  ctx: { projectPath?: string; usPath?: string }
): Promise<AutomationPlanRow[]> {
  return rows.map((row) => {
    const sel = selectStrategy(row, { projectPath: ctx.projectPath });
    const prof = decideProfile(row, { projectPath: ctx.projectPath, usPath: ctx.usPath });
    const confidence = Math.min(1, (row.confidence ?? 0) + sel.confidenceBump + prof.confidenceBump);
    return {
      ...row,
      selector_strategy: sel.strategy,
      data_profile: prof.profile,
      confidence,
      notes: appendNotes(row.notes, sel, prof),
    } as AutomationPlanRow;
  });
}

function appendNotes(
  notes: string | undefined,
  sel: { provenance: string },
  prof: { provenance: string; generators?: string[] }
) {
  const extras: string[] = [];
  extras.push(`selector_provenance=${sel.provenance}`);
  extras.push(`profile_provenance=${prof.provenance}`);
  if (prof.generators?.length) extras.push(`generators=${prof.generators.join("|")}`);
  return [notes, extras.join(" ; ")].filter(Boolean).join("\n");
}


