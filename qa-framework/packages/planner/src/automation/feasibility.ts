import type { AAAAtoms, Feasibility } from "../types/automation";

export type SelectorNeeds = "none" | "low" | "medium" | "high";

export interface FeasibilityInputs {
  atoms: AAAAtoms;
  preferredSelectors: string[]; // e.g., ["data-testid","role"]
  missingSelectors: string[];   // unresolved selectors
  hasDynamicContent?: boolean;
  crossRouteSteps?: number;     // number of distinct routes
  hasAuthDependencies?: boolean;
  hasNegativePaths?: boolean;
  dataProfileComplexity?: "simple" | "mixed" | "complex";
  oracleKind?: "visual" | "dom" | "api" | "none";
}

export function deriveSelectorNeeds(preferred: string[], missing: string[]): SelectorNeeds {
  const total = Math.max(preferred.length, 1);
  const unresolved = missing.filter((m) => preferred.includes(m)).length;
  const ratio = unresolved / total;
  if (unresolved === 0) return "none";
  if (ratio <= 0.33) return "low";
  if (ratio <= 0.66) return "medium";
  return "high";
}

export function scoreFeasibility(inputs: FeasibilityInputs): { feasibility: Feasibility; selector_needs: SelectorNeeds; rationale: string } {
  const selector_needs = deriveSelectorNeeds(inputs.preferredSelectors, inputs.missingSelectors);

  const steps = inputs.atoms.setup.length + inputs.atoms.action.length + inputs.atoms.assert.length;
  const isMultiRoute = (inputs.crossRouteSteps ?? 1) >= 2;
  const hasDynamic = Boolean(inputs.hasDynamicContent);
  const auth = Boolean(inputs.hasAuthDependencies);
  const negatives = Boolean(inputs.hasNegativePaths);
  const data = inputs.dataProfileComplexity ?? "mixed";
  const oracle = inputs.oracleKind ?? "dom";

  let tier: Feasibility = "C";
  const reasons: string[] = [];

  if (selector_needs === "none" && !hasDynamic && !isMultiRoute && data === "simple" && oracle !== "visual") {
    tier = "A";
    reasons.push("selectori stabili, date simple, flux unic");
  } else if ((selector_needs === "low" && !isMultiRoute) || (!hasDynamic && steps <= 8)) {
    tier = "B";
    reasons.push("complexitate moderată; selectori acceptabili");
  } else if (selector_needs === "medium" || isMultiRoute || hasDynamic) {
    tier = "C";
    reasons.push("DOM variabil sau mai multe rute");
  } else if (selector_needs === "high" || oracle === "visual" || data === "complex" || auth) {
    tier = "D";
    reasons.push("depinde de async/3rd-party sau oracol neclar");
  }

  if (negatives) reasons.push("include scenarii negative");

  return { feasibility: tier, selector_needs, rationale: reasons.join("; ") || "OK" };
}


