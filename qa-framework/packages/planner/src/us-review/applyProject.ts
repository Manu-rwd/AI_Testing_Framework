import { TUSNormalized } from "./schema";
import path from "node:path";
import fs from "node:fs";
import YAML from "yaml";

type ProjectPack = {
  permissions?: string[];
  routes?: string[];
  regex?: Record<string, string>;
  buckets?: string[];
  messages?: { toasts?: string[]; errors?: string[]; empty_states?: string[] };
};

function safeLoadProject(projectPath: string): ProjectPack {
  try {
    const projRoot = projectPath;
    const standardsDir = path.join(projRoot, "standards");
    const pack: ProjectPack = {};
    const readIf = (p: string) => fs.existsSync(p) ? YAML.parse(fs.readFileSync(p, "utf8")) : undefined;

    const permissions = readIf(path.join(standardsDir, "permissions.yaml"));
    const routes = readIf(path.join(standardsDir, "routes.yaml")) || readIf(path.join(standardsDir, "routes.yml"));
    const regex = readIf(path.join(standardsDir, "regex.yaml")) || readIf(path.join(standardsDir, "regex.yml"));
    const buckets = readIf(path.join(standardsDir, "coverage.yaml"))?.buckets;
    const messages = readIf(path.join(standardsDir, "messages.yaml"));

    if (Array.isArray(permissions)) pack.permissions = permissions;
    if (Array.isArray(routes)) pack.routes = routes;
    if (regex && typeof regex === "object") pack.regex = regex;
    if (Array.isArray(buckets)) pack.buckets = buckets;
    if (messages && typeof messages === "object") pack.messages = messages;

    return pack;
  } catch {
    return {};
  }
}

export function applyProjectFallbacks(us: TUSNormalized, projectPath?: string): { us: TUSNormalized; filled: number } {
  if (!projectPath) return { us, filled: 0 };
  const pack = safeLoadProject(projectPath);
  let filled = 0;

  // Buckets
  if (us.buckets.length === 0 && Array.isArray(pack.buckets) && pack.buckets.length) {
    for (const b of pack.buckets) {
      us.buckets.push({ name: b, source: "project" });
      us.provenance.buckets[b] = "project";
    }
    filled++;
  }

  // Permissions
  if (us.permissions.length === 0 && Array.isArray(pack.permissions) && pack.permissions.length) {
    for (const k of pack.permissions) {
      const key = String(k).replace(/\s+/g, "_");
      us.permissions.push({ key, source: "project" });
      us.provenance.permissions[key] = "project";
    }
    filled++;
  }

  // Routes
  if (us.routes.length === 0 && Array.isArray(pack.routes) && pack.routes.length) {
    for (const r of pack.routes) {
      const val = String(r);
      us.routes.push(val);
      us.provenance.routes[val] = "project";
    }
    filled++;
  }

  // Messages
  if ((us.messages.toasts.length + us.messages.errors.length + us.messages.empty_states.length) === 0 && pack.messages) {
    for (const t of pack.messages.toasts ?? []) { us.messages.toasts.push(t); us.provenance.messages.toasts[t] = "project"; }
    for (const e of pack.messages.errors ?? []) { us.messages.errors.push(e); us.provenance.messages.errors[e] = "project"; }
    for (const em of pack.messages.empty_states ?? []) { us.messages.empty_states.push(em); us.provenance.messages.empty_states[em] = "project"; }
    filled++;
  }

  // Field regex enrichment
  if (pack.regex && Object.keys(pack.regex).length) {
    for (const f of us.fields) {
      if (!f.regex) {
        const rx = pack.regex[f.name];
        if (rx) {
          f.regex = rx;
          f.source = "project";
          us.provenance.fields[f.name] = "project";
          filled++;
        }
      }
    }
  }

  return { us, filled };
}


