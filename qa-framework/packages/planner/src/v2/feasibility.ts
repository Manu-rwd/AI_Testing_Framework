import type { RulesV2 } from "@pkg/rules/v2/schema";
import type { PlanRowV2 } from "./types";

export type FeasibilityResult = { tier: "A"|"B"|"C"|"D"|"E"; notes: string };

export function assessFeasibility(row: PlanRowV2, rules: RulesV2): FeasibilityResult {
  const preferred = rules.selector_hints?.preferred ?? [];
  const hasPreferred = preferred.length > 0;
  const dpReq = row.data_profile.required ?? [];
  const dpComplete = dpReq.length > 0;

  let tier: FeasibilityResult["tier"] = "C";
  const reasons: string[] = [];

  if (!hasPreferred) reasons.push("No preferred selector strategy");
  if (!dpComplete) reasons.push("Missing data_profile.required");
  if (row.selector_needs.length > 0) reasons.push(`Selector needs: ${row.selector_needs.join(", ")}`);

  if (hasPreferred && dpComplete && row.selector_needs.length === 0) {
    tier = "A";
  } else if ((hasPreferred && dpComplete) || (hasPreferred && row.selector_needs.length <= 1)) {
    tier = "B";
  } else if (!hasPreferred && dpComplete) {
    tier = "C";
  } else if (!dpComplete && hasPreferred) {
    tier = "D";
  } else {
    tier = "E";
  }

  return { tier, notes: reasons.join(" | ") || "OK" };
}


