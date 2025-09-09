import path from "node:path";
import fs from "fs-extra";

export interface SelectorStandards {
  preferred?: string[]; // e.g., ["data-testid","role","aria","label","text","css","xpath"]
  avoid?: string[];
}

function loadYamlMaybe(filePath: string): any {
  if (!fs.existsSync(filePath)) return undefined;
  const text = fs.readFileSync(filePath, "utf8");
  try {
    // lightweight parse to avoid bringing YAML here; rely on planner deps elsewhere
    const YAML = require("yaml");
    return YAML.parse(text);
  } catch {
    return undefined;
  }
}

export function resolveSelectorStrategy(projectPath?: string, fallbacks: string[] = ["data-testid","role","aria","label","text","css","xpath"]): { strategy: string; ordered: string[] } {
  let ordered = [...fallbacks];
  let reason = "implicit defaults";
  if (projectPath) {
    const f = path.join(projectPath, "standards", "selectors.yaml");
    const doc = loadYamlMaybe(f);
    if (doc && Array.isArray(doc.preferred) && doc.preferred.length) {
      const uniq = Array.from(new Set<string>(doc.preferred.concat(fallbacks)));
      ordered = uniq;
      reason = "project standards";
    }
  }
  const human = (() => {
    const idxOf = (k: string) => ordered.indexOf(k);
    const has = (k: string) => idxOf(k) >= 0;
    const parts: string[] = [];
    if (has("data-testid")) parts.push("data-testid (preferred)");
    if (has("role") || has("aria")) parts.push("fallback role/aria");
    if (has("label") || has("text")) parts.push("avoid text if unstable");
    if (has("css")) parts.push("css scoped");
    if (has("xpath")) parts.push("avoid xpath");
    return `${parts.join("; ")}; reason: ${reason}`;
  })();
  return { strategy: human, ordered };
}


