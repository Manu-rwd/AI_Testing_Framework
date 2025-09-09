import type { PlanV2 } from "../v2/types";
import type { AutomationPlanRow } from "../types/automation";
import { resolveSelectorStrategy } from "../selectors/selectorResolver";
import { resolveDataProfile } from "../dataProfiles/dataProfileResolver";
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
    const sel = resolveSelectorStrategy({ narrative_ro: r.narrative_ro }, projectPath);
    const dataProfile = resolveDataProfile({ narrative_ro: r.narrative_ro, data_profile: r.data_profile }, projectPath);
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
    const row: AutomationPlanRow & any = {
      module: moduleName,
      tipFunctionalitate: r.tipFunctionalitate,
      bucket: r.bucket,
      narrative_ro: deriveShortTitle(r.narrative_ro),
      atoms: r.atoms,
      selector_needs: feas.selector_needs,
      selector_strategy: `${sel.selector_strategy.primary} | ${(sel.selector_strategy.fallbacks || []).join(" -> ")}`,
      data_profile: JSON.stringify(dataProfile),
      feasibility: feas.feasibility,
      source: mapSource(r.source),
      confidence: Math.min(1, Math.max(0, Number((r.confidence ?? 0).toFixed(2)) || 0)),
      rule_tags: r.rule_tags || [],
      notes: [feas.rationale].filter(Boolean).join(""),
    };
    // Extended fields for CSV columns
    row.selectors = sel.selectors;
    row["selector_strategy.primary"] = sel.selector_strategy.primary;
    row["selector_strategy.fallbacks"] = sel.selector_strategy.fallbacks.join("|");
    row["selector_strategy.source"] = sel.selector_strategy.source;
    row["selector_strategy.confidence"] = sel.selector_strategy.confidence.toFixed(2);
    row["data_profile.minimal_valid"] = dataProfile.minimal_valid;
    row["data_profile.invalid_regex"] = (dataProfile.invalid_regex || []).join("|");
    row["data_profile.edge_cases"] = JSON.stringify(dataProfile.edge_cases || []);
    row["data_profile.source"] = dataProfile.source;
    row["data_profile.confidence"] = dataProfile.confidence.toFixed(2);
    out.push(row);
  }
  return out;
}


