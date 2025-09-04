import { emptyUS, TUSNormalized } from "./schema";

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function lines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").split("\n");
}

function isHeaderLike(line: string, head: string): boolean {
  const a = stripDiacritics(line).toLowerCase();
  const b = stripDiacritics(head).toLowerCase();
  return a.startsWith(b + ":") || a === b;
}

export type NormalizeOptions = { strict?: boolean };

export function normalizeUS(text: string, opts: NormalizeOptions = {}): TUSNormalized {
  const strict = !!opts.strict;
  const us = emptyUS();
  const L = lines(text);

  // Buckets (Tabel/Formular)
  const joined = stripDiacritics(text).toLowerCase();
  const bucketSet = new Set<string>();
  if (/\b(tabel|table)\b/.test(joined)) bucketSet.add("Tabel");
  if (/\b(formular|formularul|form)\b/.test(joined)) bucketSet.add("Formular");
  for (const b of bucketSet) {
    us.buckets.push({ name: b, source: "us" });
    us.provenance.buckets[b] = "us";
  }

  // Fields: heuristic
  const fieldRe = /(?:(?:c[aâ]mp|camp|field|nume)\s*[:\-]\s*)([A-Za-z0-9 _.\-\[\]]+)(?:\s*\(([^)]+)\))?(?:.*?(?:regex\s*[:=]\s*([^\s,;]+)))?/gim;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(text)) !== null) {
    const name = m[1]?.trim();
    if (!name) continue;
    const type = m[2]?.trim();
    const regex = m[3]?.trim();
    us.fields.push({ name, type, regex, source: "us" });
    us.provenance.fields[name] = "us";
  }

  // Permissions
  for (const ln of L) {
    const l = stripDiacritics(ln).toLowerCase().trim();
    if (l.startsWith("permisiuni:") || l.startsWith("permissions:") || l.startsWith("permission & authorization") || l.startsWith("autorizare:")) {
      const rhs = ln.split(":").slice(1).join(":");
      rhs.split(/[;,]/).map(s => s.trim()).filter(Boolean).forEach(k => {
        const key = k.replace(/\s+/g, "_");
        us.permissions.push({ key, source: "us" });
        us.provenance.permissions[key] = "us";
      });
    }
  }

  // Routes
  for (const ln of L) {
    const l = stripDiacritics(ln).toLowerCase().trim();
    if (l.startsWith("ruta:") || l.startsWith("route:") || l.startsWith("url:") || l.startsWith("endpoint:")) {
      const rhs = ln.split(":").slice(1).join(":").trim();
      if (rhs) {
        us.routes.push(rhs);
        us.provenance.routes[rhs] = "us";
      }
    }
  }

  // Messages
  for (const ln of L) {
    const l = stripDiacritics(ln).toLowerCase();
    if (l.includes("toast")) {
      const v = ln.trim();
      us.messages.toasts.push(v);
      us.provenance.messages.toasts[v] = "us";
    }
    if (l.includes("eroare") || l.includes("error")) {
      const v = ln.trim();
      us.messages.errors.push(v);
      us.provenance.messages.errors[v] = "us";
    }
    if (l.includes("empty state") || l.includes("stare goala") || l.includes("gol")) {
      const v = ln.trim();
      us.messages.empty_states.push(v);
      us.provenance.messages.empty_states[v] = "us";
    }
  }

  // Negatives & Assumptions
  let capture: "neg" | "ass" | null = null;
  for (const ln of L) {
    const raw = ln.trim();
    const low = stripDiacritics(raw).toLowerCase();
    if (isHeaderLike(low, "negative") || isHeaderLike(low, "negative tests")) { capture = "neg"; continue; }
    if (isHeaderLike(low, "asumptii") || isHeaderLike(low, "presupuneri") || isHeaderLike(low, "assumptions")) { capture = "ass"; continue; }
    if (/^\s*$/.test(raw)) { capture = null; continue; }
    if (capture === "neg") {
      const v = raw.replace(/^[-*]\s*/, "");
      us.negatives.push(v);
      us.provenance.negatives[v] = "us";
    } else if (capture === "ass") {
      const v = raw.replace(/^[-*]\s*/, "");
      us.assumptions.push(v);
      us.provenance.assumptions[v] = "us";
    }
  }

  if (strict) {
    us.buckets = us.buckets.filter(b => b.name === "Tabel" || b.name === "Formular");
  }

  return us;
}


