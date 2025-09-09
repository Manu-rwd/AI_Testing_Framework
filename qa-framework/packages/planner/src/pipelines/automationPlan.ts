import type { PlanV2 } from "../v2/types";
import type { AutomationPlanRow } from "../types/automation";
import { resolveSelectorStrategy } from "../automation/selectorStrategy";
import { buildDataProfile } from "../automation/dataProfile";
import { scoreFeasibility } from "../automation/feasibility";

export interface AutomationPipelineArgs {
  plan: PlanV2;
  moduleName: string;
  projectPath?: string;
}

function deriveShortTitle(narrative: string): string {
  const trimmed = narrative.replace(/\s+/g, " ").trim();
  return trimmed.length > 80 ? trimmed.slice(0, 77) + "…" : trimmed;
}

export function buildAutomationPlanRows(args: AutomationPipelineArgs): AutomationPlanRow[] {
  const { plan, moduleName, projectPath } = args;
  const out: AutomationPlanRow[] = [];
  for (const r of plan.rows) {
    const sel = resolveSelectorStrategy(projectPath);
    const dataProfile = buildDataProfile(projectPath);
    const feas = scoreFeasibility({
      atoms: r.atoms,
      preferredSelectors: sel.ordered,
      missingSelectors: r.selector_needs as any,
      hasDynamicContent: r.oracle_kind === "visual",
      crossRouteSteps: 1,
      dataProfileComplexity: (r.data_profile?.required?.length || 0) <= 1 ? "simple" : "mixed",
      oracleKind: r.oracle_kind as any,
    });
    const mapSource = (s: any): "US" | "project" | "defaults" => {
      if (String(s).toLowerCase() === "us") return "US";
      if (String(s).toLowerCase() === "project") return "project";
      return "defaults";
    };
    const row: AutomationPlanRow = {
      module: moduleName,
      tipFunctionalitate: r.tipFunctionalitate,
      bucket: r.bucket,
      narrative_ro: deriveShortTitle(r.narrative_ro),
      atoms: r.atoms,
      selector_needs: feas.selector_needs,
      selector_strategy: sel.strategy,
      data_profile: dataProfile,
      feasibility: feas.feasibility,
      source: mapSource(r.source),
      confidence: Math.min(1, Math.max(0, Number((r.confidence ?? 0).toFixed(2)) || 0)),
      rule_tags: r.rule_tags || [],
      notes: [feas.rationale].filter(Boolean).join(""),
    };
    out.push(row);
  }
  return out;
}


