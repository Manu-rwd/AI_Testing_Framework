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

  // --- Fields: more forgiving parsing ---
  function grabBlock(all: string[], head: RegExp): string[] {
    const i = all.findIndex(l => head.test(stripDiacritics(l).toLowerCase()));
    if (i < 0) return [];
    const out: string[] = [];
    for (let j = i + 1; j < all.length; j++) {
      const raw = all[j];
      if (!raw.trim()) break;
      if (/^\s*[A-ZĂÂÎȘȚ][A-Za-zĂÂÎȘȚăâîșț ]{1,20}\s*:/.test(raw)) break;
      out.push(raw);
    }
    return out;
  }

  // 1) Block under "Câmpuri:" or "Fields:"
  const fieldsBlock = grabBlock(L, /^(c[aâ]mpuri|campuri|fields)\s*:/i);
  for (const ln of fieldsBlock) {
    const m = ln.match(/^\s*(?:[-*•]\s*)?(?:c[aâ]mp|camp|field)?\s*:?\s*([^,;()]+?)\s*(?:\(([^)]+)\))?\s*(?:[,;]\s*(?:tip|type)\s*[:=\-]\s*([^,;()]+))?\s*(?:[,;]\s*(?:regex|pattern|expresie)\s*[:=\-]\s*(.+))?$/i);
    if (m) {
      const name = m[1].trim(); const type = (m[2] || m[3])?.trim(); const regex = m[4]?.trim();
      if (name) { us.fields.push({ name, type, regex, source: "us" }); us.provenance.fields[name] = "us"; }
    }
  }

  // 2) Also scan inline single-line entries
  for (const ln of L) {
    const m = ln.match(/^\s*(?:[-*•]\s*)?(?:c[aâ]mp|camp|field|nume)\s*[:=\-]\s*([^,;()]+?)\s*(?:\(([^)]+)\))?\s*(?:[,;]\s*(?:tip|type)\s*[:=\-]\s*([^,;()]+))?\s*(?:[,;]\s*(?:regex|pattern|expresie)\s*[:=\-]\s*(.+))?$/i);
    if (m) {
      const name = m[1].trim(); const type = (m[2] || m[3])?.trim(); const regex = m[4]?.trim();
      if (name && !us.fields.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        us.fields.push({ name, type, regex, source: "us" }); us.provenance.fields[name] = "us";
      }
    }
    // Fallback relaxed matcher when 'regex' appears later in the line
    if (!/regex|pattern|expresie/i.test(ln)) continue;
    const m2 = ln.match(/(?:c[aâ]mp|camp|field)\s*[:=\-]\s*([^,;()]+).*?(?:\(([^)]+)\))?.*?(?:regex|pattern|expresie)\s*[:=\-]\s*(.+)$/i);
    if (m2) {
      const name = m2[1].trim(); const type = m2[2]?.trim(); const regex = m2[3]?.trim();
      if (name && !us.fields.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        us.fields.push({ name, type, regex, source: "us" }); us.provenance.fields[name] = "us";
      } else if (name) {
        const f = us.fields.find(f => f.name.toLowerCase() === name.toLowerCase());
        if (f && !f.regex && regex) f.regex = regex;
        if (f && !f.type && type) f.type = type;
      }
    }
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

  // --- Messages: header-driven block ---
  const msgs = grabBlock(L, /^mesaje\s*:/i);
  for (const raw of msgs) {
    const l = stripDiacritics(raw).toLowerCase();
    const v = raw.replace(/^\s*[-*•]\s*/, "").replace(/^(toast|eroare|error|gol|empty)\s*[:\-]\s*/i, "").trim();
    if (!v) continue;
    if (/toast/.test(l)) { us.messages.toasts.push(v); us.provenance.messages.toasts[v] = "us"; continue; }
    if (/(eroare|error)/.test(l)) { us.messages.errors.push(v); us.provenance.messages.errors[v] = "us"; continue; }
    if (/(gol|empty)/.test(l)) { us.messages.empty_states.push(v); us.provenance.messages.empty_states[v] = "us"; continue; }
    us.messages.toasts.push(v); us.provenance.messages.toasts[v] = "us";
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


