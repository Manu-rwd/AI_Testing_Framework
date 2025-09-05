import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import type { AutomationPlanRow } from "../emitter/automation/types.js";
import { rankSelectorKinds } from "./rankers.js";
import type { SelectorContext, SelectorPolicy, StrategyResult } from "./types.js";

function defaultPolicy(): SelectorPolicy {
  return {
    order: ["data-testid", "role", "label", "aria", "text", "css", "xpath"],
    disallow: [],
    role_name_required: false,
    fallback_text_max_len: 80,
  };
}

function loadProjectPolicy(projectPath?: string): { policy: SelectorPolicy; provenance: "project" | "defaults" } {
  try {
    if (!projectPath) return { policy: defaultPolicy(), provenance: "defaults" };
    const file = path.join(projectPath, "standards", "selectors.yaml");
    if (!fs.existsSync(file)) return { policy: defaultPolicy(), provenance: "defaults" };
    const yamlText = fs.readFileSync(file, "utf8");
    const obj = YAML.parse(yamlText) || {};
    const p: SelectorPolicy = {
      order: Array.isArray(obj?.preferences?.order) ? obj.preferences.order : defaultPolicy().order,
      disallow: Array.isArray(obj?.disallow) ? obj.disallow : [],
      role_name_required: Boolean(obj?.role_name_required),
      fallback_text_max_len: typeof obj?.fallback_text_max_len === "number" ? obj.fallback_text_max_len : 80,
    };
    return { policy: p, provenance: "project" };
  } catch {
    return { policy: defaultPolicy(), provenance: "defaults" };
  }
}

function strategyLabel(kind: string, policy: SelectorPolicy, rowHints?: string): string {
  switch (kind) {
    case "data-testid":
      return "data-testid-preferred";
    case "role":
      // If policy requires role name, or hint includes roles/role/name, favor role-with-name
      if (policy.role_name_required || /\b(role|roles|name)\b/i.test(String(rowHints || ""))) {
        return "role-with-name";
      }
      return "role";
    case "label":
      return "label";
    case "aria":
      return "aria-fallback";
    case "text":
      return "text-fallback";
    case "css":
      return "css-fallback";
    case "xpath":
      return (policy.disallow || []).includes("xpath") ? "xpath-discouraged" : "xpath";
    default:
      return String(kind);
  }
}

export function selectStrategy(row: AutomationPlanRow, ctx: { projectPath?: string }): StrategyResult {
  const { policy, provenance: policyProv } = loadProjectPolicy(ctx?.projectPath);
  const ranked = rankSelectorKinds({ policy, rowHints: row.selector_needs } satisfies SelectorContext);
  const top = ranked[0] || { kind: "data-testid", score: 0 } as any;
  const label = strategyLabel(top.kind, policy, row.selector_needs);

  let provenance: "US" | "project" | "defaults" = policyProv;
  const hasUsHint = Boolean(row.selector_needs && row.selector_needs.length);
  if (hasUsHint) provenance = "US";

  const confidenceBump = provenance === "US" ? 0 : 0.02;
  return { strategy: label, provenance, confidenceBump };
}

export { SelectorPolicy, SelectorContext, StrategyResult };


