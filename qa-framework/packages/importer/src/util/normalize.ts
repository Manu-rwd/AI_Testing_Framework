export function splitCsv(val: string): string[] {
  return String(val || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

const rePlaceholders = /(<[^>]+>)|(\[[^\]]+\])|(\{[^}]+\})/g;

export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>();
  (text || "").replace(rePlaceholders, (m) => { found.add(m); return m; });
  return Array.from(found);
}

export function toBool01(v: any): 0 | 1 {
  const s = String(v ?? "").trim().toLowerCase();
  return (s === "1" || s === "true" || s === "da" || s === "x") ? 1 : 0;
}


