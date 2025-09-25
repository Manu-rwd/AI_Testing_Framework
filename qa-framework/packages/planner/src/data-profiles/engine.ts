import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import type { AutomationPlanRow } from "../emitter/automation/types.js";
import type { FieldRule, ProfileDecision } from "./types.js";
import { choosePrimaryProfile, inferGeneratorsFromFields } from "./profiles.js";

function loadRulesFromUS(usPath?: string): FieldRule[] {
  try {
    if (!usPath) return [];
    const obj = JSON.parse(fs.readFileSync(usPath, "utf8"));
    const fields = Array.isArray(obj?.fields) ? obj.fields : [];
    return fields.map((f: any) => ({
      name: String(f.name),
      type: (f.type as any) ?? "string",
      regex: f.regex,
      minLen: typeof f.minLen === "number" ? f.minLen : undefined,
      maxLen: typeof f.maxLen === "number" ? f.maxLen : undefined,
    } satisfies FieldRule));
  } catch {
    return [];
  }
}

function loadRulesFromProject(projectPath?: string): FieldRule[] {
  try {
    if (!projectPath) return [];
    const file = path.join(projectPath, "standards", "regex.yaml");
    if (!fs.existsSync(file)) return [];
    const obj = YAML.parse(fs.readFileSync(file, "utf8"));
    const fields = Array.isArray(obj?.fields) ? obj.fields : [];
    return fields.map((f: any) => ({
      name: String(f.name),
      type: (f.type as any) ?? "string",
      regex: f.regex,
      minLen: typeof f.minLen === "number" ? f.minLen : undefined,
      maxLen: typeof f.maxLen === "number" ? f.maxLen : undefined,
    } satisfies FieldRule));
  } catch {
    return [];
  }
}

function defaultFieldRules(): FieldRule[] {
  return [];
}

export function decideProfile(row: AutomationPlanRow, ctx: { projectPath?: string; usPath?: string }): ProfileDecision {
  const usFields = loadRulesFromUS(ctx?.usPath);
  const projFields = loadRulesFromProject(ctx?.projectPath);
  const effFields = usFields.length ? usFields : (projFields.length ? projFields : defaultFieldRules());

  let provenance: "US" | "project" | "defaults" = usFields.length ? "US" : (projFields.length ? "project" : "defaults");

  const profile = choosePrimaryProfile(row.bucket, row.feasibility, effFields);
  const generators = inferGeneratorsFromFields(effFields);
  const confidenceBump = provenance === "US" ? 0 : 0.02;

  return { profile, generators, provenance, confidenceBump };
}


