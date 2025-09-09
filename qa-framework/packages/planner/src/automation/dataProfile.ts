import path from "node:path";
import fs from "fs-extra";

function loadYamlMaybe(filePath: string): any {
  if (!fs.existsSync(filePath)) return undefined;
  const text = fs.readFileSync(filePath, "utf8");
  try {
    const YAML = require("yaml");
    return YAML.parse(text);
  } catch {
    return undefined;
  }
}

export function buildDataProfile(projectPath?: string): string {
  if (projectPath) {
    const f = path.join(projectPath, "standards", "profiles.yaml");
    const doc = loadYamlMaybe(f);
    if (doc && typeof doc.default === "string") return doc.default;
    if (doc && doc.summary) return String(doc.summary).slice(0, 120);
  }
  return "user: seeded; product: generated(minimal); locale: ro-RO";
}


