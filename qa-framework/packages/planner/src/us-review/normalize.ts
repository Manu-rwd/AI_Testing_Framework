import fs from "node:fs";
import path from "node:path";
import { USNormalized, BucketSchema, FieldSchema, PermissionSchema, RouteSchema, MessageItemSchema } from "./schema";

const DIACRITICS = "ăâîșţțȘȚĂÂÎ";
const word = `[\\p{L}${DIACRITICS}0-9_\\- ]+`;
const reLine = (p: string, flags = "iu") => new RegExp(p, flags);

export interface NormalizeOptions {
  strict?: boolean; // buckets policy
}

/**
 * normalizeUS: best-effort Romanian-friendly parsing heuristics
 */
export function normalizeUSText(text: string, opts: NormalizeOptions = {}): USNormalized {
  const strict = !!opts.strict;
  const lines = text.split(/\r?\n/);

  const buckets: USNormalized["buckets"] = [];
  const fields: USNormalized["fields"] = [];
  const permissions: USNormalized["permissions"] = [];
  const routes: USNormalized["routes"] = [];
  const messages: USNormalized["messages"] = { toasts: [], errors: [], empty_states: [] };
  const negatives: USNormalized["negatives"] = [];
  const assumptions: USNormalized["assumptions"] = [];

  // --- Buckets detection (Formular/Tabel)
  const joined = lines.join("\n");
  if (reLine(`\\bformular\\b`).test(joined)) buckets.push(BucketSchema.parse({ name: "Formular", source: "us" }));
  if (reLine(`\\btabel\\b`).test(joined)) buckets.push(BucketSchema.parse({ name: "Tabel", source: "us" }));

  // --- Fields
  // Patterns:
  // 1) "câmp: Nume, tip: text, regex: ^[A-Z]+$"
  // 2) "- câmp Nume (tip: text) regex: ..."
  // 3) "field: Email regex: .*@.*"
  const fieldPatterns = [
    reLine(`^(?:[-*•]\\s*)?(?:câmp|camp|field)\\s*[:\\-]\\s*(${word}?)(?:[,;]\\s*(?:tip|type)\\s*[:\\-]\\s*(${word}?))?(?:[,;]\\s*(?:regex|expresie|pattern)\\s*[:\\-]\\s*(.+))?$`),
    reLine(`^(?:[-*•]\\s*)?(${word}?)\\s*\\((?:tip|type)\\s*[:=]\\s*(${word}?)\\)\\s*(?:regex|pattern)\\s*[:=]\\s*(.+)$`),
  ];

  for (const raw of lines) {
    const line = raw.trim();
    for (const r of fieldPatterns) {
      const m = line.match(r);
      if (m) {
        const name = (m[1] || "").trim();
        if (!name) continue;
        const type = (m[2] || "").trim() || undefined;
        const regex = (m[3] || "").trim() || undefined;
        fields.push(FieldSchema.parse({ name, type, regex, source: "us" }));
        break;
      }
    }
  }

  // --- Permissions: "Permisiuni: admin, editor; vizualizare"
  const permIdx = lines.findIndex(l => reLine("^\\s*permisiuni\\s*[:]").test(l));
  if (permIdx >= 0) {
    const tokens = lines[permIdx].split(":").slice(1).join(":")
      .split(/[;,]/).map(s => s.trim()).filter(Boolean);
    for (const t of tokens) {
      const key = t.toLowerCase().replace(/\s+/g, "_");
      permissions.push(PermissionSchema.parse({ key, source: "us" }));
    }
  }

  // --- Routes: lines like "Ruta: /conturi/adauga [POST]"
  for (const raw of lines) {
    const m = raw.match(reLine(`^\\s*(?:ruta|route)\\s*[:]\\s*([^\\s]+)(?:\\s*\\[([A-Z]+)\\])?`));
    if (m) {
      routes.push(RouteSchema.parse({ path: m[1], method: m[2] || undefined, source: "us" }));
    }
  }

  // --- Messages block: "Mesaje:" then bullets: "toast: Salvat", "eroare: ...", "gol: ..."
  const msgStart = lines.findIndex(l => reLine("^\\s*mesaje\\s*[:]").test(l));
  if (msgStart >= 0) {
    for (let i = msgStart + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l) break;
      const toast = l.match(reLine("^(?:[-*•]\\s*)?(?:toast)\\s*[:\\-]\\s*(.+)$"));
      const err = l.match(reLine("^(?:[-*•]\\s*)?(?:eroare|error)\\s*[:\\-]\\s*(.+)$"));
      const empty = l.match(reLine("^(?:[-*•]\\s*)?(?:gol|empty)\\s*[:\\-]\\s*(.+)$"));
      if (toast) messages.toasts.push(MessageItemSchema.parse({ text: toast[1].trim(), source: "us" }));
      else if (err) messages.errors.push(MessageItemSchema.parse({ text: err[1].trim(), source: "us" }));
      else if (empty) messages.empty_states.push(MessageItemSchema.parse({ text: empty[1].trim(), source: "us" }));
      else if (l.startsWith("-") || l.startsWith("*") || l.startsWith("•")) {
        // generic bullet -> treat as toast
        const t = l.replace(/^[-*•]\s*/, "");
        if (t) messages.toasts.push(MessageItemSchema.parse({ text: t, source: "us" }));
      } else {
        break;
      }
    }
  }

  // --- Negatives / Assumptions
  const negIdx = lines.findIndex(l => reLine("^\\s*negative\\s*[:]").test(l));
  if (negIdx >= 0) {
    for (let i = negIdx + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l || reLine("^\\s*\\w+\\s*:").test(l)) break;
      if (l.replace(/^[-*•]\s*/, "").length > 0) {
        negatives.push({ text: l.replace(/^[-*•]\s*/, ""), source: "us" });
      }
    }
  }
  const asmIdx = lines.findIndex(l => reLine("^\\s*(presupuneri|asumptii|asumții)\\s*[:]").test(l));
  if (asmIdx >= 0) {
    for (let i = asmIdx + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l || reLine("^\\s*\\w+\\s*:").test(l)) break;
      if (l.replace(/^[-*•]\s*/, "").length > 0) {
        assumptions.push({ text: l.replace(/^[-*•]\s*/, ""), source: "us" });
      }
    }
  }

  // If strict bucket policy and none found, leave empty; if lax, we won't auto-add here.
  const normalized: USNormalized = {
    buckets,
    fields,
    permissions,
    routes,
    messages,
    negatives,
    assumptions,
  };
  return normalized;
}

export function normalizeUSFromFile(usPath: string, opts: NormalizeOptions = {}): USNormalized {
  const abs = path.resolve(usPath);
  const content = fs.readFileSync(abs, { encoding: "utf8" });
  return normalizeUSText(content, opts);
}


