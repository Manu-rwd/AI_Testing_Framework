import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { USNormalized, SourceTag } from "./schema";
import { computeConfidence, DEFAULT_WEIGHTS, clamp01 } from "./confidence";

type AnyObj = Record<string, any>;

function safeReadYaml(p: string): any | null {
  try {
    const txt = fs.readFileSync(p, "utf8");
    return YAML.parse(txt);
  } catch {
    return null;
  }
}

function listYamlUnder(dir: string): any[] {
  try {
    const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(".yaml") || f.toLowerCase().endsWith(".yml"));
    return files.map(f => safeReadYaml(path.join(dir, f))).filter(Boolean);
  } catch {
    return [];
  }
}

export interface ApplyProjectOptions {
  bumpPerSection?: number; // default +0.15
}

export function applyProjectFallbacks(n: USNormalized, projectRoot: string, opts: ApplyProjectOptions = {}): USNormalized {
  const bump = opts.bumpPerSection ?? 0.15;
  const root = path.resolve(projectRoot);
  const projectYaml = safeReadYaml(path.join(root, "Project.yaml")) || {};
  const standardsDir = path.join(root, "standards");

  const standards = [projectYaml, ...listYamlUnder(standardsDir)];
  const merged: AnyObj = standards.reduce((acc, cur) => {
    for (const k of Object.keys(cur || {})) {
      if (acc[k] == null) acc[k] = cur[k];
    }
    return acc;
  }, {} as AnyObj);

  const out: USNormalized = JSON.parse(JSON.stringify(n)); // deep copy

  // Buckets
  if ((!out.buckets || out.buckets.length === 0) && Array.isArray(merged.buckets) && merged.buckets.length) {
    out.buckets = merged.buckets.map((b: any) => ({ name: String(b.name ?? b).trim(), source: "project" as SourceTag }));
  }

  // Fields: fill missing regex/type for existing; if none exist, adopt project fields
  const projFields: { name: string; type?: string; regex?: string }[] = Array.isArray(merged.fields) ? merged.fields : [];
  if (out.fields.length === 0 && projFields.length) {
    out.fields = projFields.map(f => ({ name: f.name, type: f.type, regex: f.regex, source: "project" as SourceTag }));
  } else if (projFields.length) {
    for (const f of out.fields) {
      const found = projFields.find(pf => pf.name?.toLowerCase() === f.name.toLowerCase());
      if (found) {
        if (!f.type && found.type) { f.type = found.type; f.source = f.source ?? "project"; }
        if (!f.regex && found.regex) { f.regex = found.regex; f.source = f.source ?? "project"; }
      }
    }
  }

  // Permissions
  if ((!out.permissions || out.permissions.length === 0) && Array.isArray(merged.permissions) && merged.permissions.length) {
    out.permissions = merged.permissions.map((k: any) => ({ key: String(k.key ?? k).trim().toLowerCase().replace(/\s+/g, "_"), source: "project" as SourceTag }));
  }

  // Routes
  if ((!out.routes || out.routes.length === 0) && Array.isArray(merged.routes) && merged.routes.length) {
    out.routes = merged.routes.map((r: any) => ({ path: String(r.path ?? r).trim(), method: r.method ? String(r.method) : undefined, source: "project" as SourceTag }));
  }

  // Messages
  if (out.messages.toasts.length === 0 && merged.messages?.toasts?.length) {
    out.messages.toasts = merged.messages.toasts.map((t: any) => ({ text: String(t.text ?? t), source: "project" as SourceTag }));
  }
  if (out.messages.errors.length === 0 && merged.messages?.errors?.length) {
    out.messages.errors = merged.messages.errors.map((t: any) => ({ text: String(t.text ?? t), source: "project" as SourceTag }));
  }
  if (out.messages.empty_states.length === 0 && merged.messages?.empty_states?.length) {
    out.messages.empty_states = merged.messages.empty_states.map((t: any) => ({ text: String(t.text ?? t), source: "project" as SourceTag }));
  }

  // Negatives / Assumptions (optional)
  if (out.negatives.length === 0 && Array.isArray(merged.negatives) && merged.negatives.length) {
    out.negatives = merged.negatives.map((t: any) => ({ text: String(t.text ?? t), source: "project" as SourceTag }));
  }
  if (out.assumptions.length === 0 && Array.isArray(merged.assumptions) && merged.assumptions.length) {
    out.assumptions = merged.assumptions.map((t: any) => ({ text: String(t.text ?? t), source: "project" as SourceTag }));
  }

  // Recompute confidence, then apply per-section bump where project filled something
  const before = computeConfidence(n, DEFAULT_WEIGHTS);
  const after = computeConfidence(out, DEFAULT_WEIGHTS);

  // Determine sections improved by project data
  const improved: (keyof typeof after.per_section)[] = [];
  (Object.keys(after.per_section) as (keyof typeof after.per_section)[]).forEach(k => {
    if (after.per_section[k] > before.per_section[k]) improved.push(k);
  });

  // Apply +0.15 bump per improved section (cap at 1.0) then recompute overall
  const bumped = { ...after.per_section };
  for (const k of improved) {
    bumped[k] = clamp01(bumped[k] + bump);
  }
  const weights = after.weights;
  const overall =
    Math.min(1,
      bumped.fields * weights.fields +
      bumped.buckets * weights.buckets +
      bumped.permissions * weights.permissions +
      bumped.routes * weights.routes +
      bumped.messages * weights.messages +
      bumped.negatives * weights.negatives
    );

  out.confidence = {
    per_section: bumped,
    overall,
    weights,
  };

  return out;
}


