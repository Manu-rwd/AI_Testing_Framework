const whitespaceRE = /\s+/g;

function normalizeToken(raw: string): string {
  const value = raw.replaceAll("\r", "").trim().replace(whitespaceRE, " ").toLowerCase();
  // Common mappings to stable tokens
  if (/(font|type).*size/.test(value)) return "font.size";
  if (/font.*weight/.test(value)) return "font.weight";
  if (/line\s*height/.test(value)) return "font.lineHeight";
  if (/letter\s*spacing/.test(value)) return "font.letterSpacing";
  if (/color/.test(value) && /#?[0-9a-f]{3,8}/.test(value)) return "color.hex";
  if (/color/.test(value)) return "color.token";
  if (/align/.test(value) && /left/.test(value)) return "align.left";
  if (/align/.test(value) && /center/.test(value)) return "align.center";
  if (/align/.test(value) && /right/.test(value)) return "align.right";
  if (/spacing|margin|padding/.test(value)) {
    if (/\bx\s*s\b|\bextra\s*small\b|\bxs\b/.test(value)) return "space.xs";
    if (/\bsmall\b|\bsm\b/.test(value)) return "space.sm";
    if (/\bmedium\b|\bmd\b/.test(value)) return "space.md";
    if (/\blarge\b|\blg\b/.test(value)) return "space.lg";
    return "space.token";
  }
  if (/hover/.test(value)) return "state.hover";
  if (/focus/.test(value)) return "state.focus";
  if (/disabled/.test(value)) return "state.disabled";
  if (/breakpoint|mobile|tablet|desktop|responsive/.test(value)) return "responsive.rule";
  return value.replaceAll(" ", ".");
}

export function normalizeFacetList(values: string[]): string[] {
  const tokens = values.map(normalizeToken);
  const unique = Array.from(new Set(tokens));
  unique.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return unique;
}

export function normalizeFacetRecord(record: Record<string, string | string[]>): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(record)) {
    const normKey = normalizeToken(key);
    if (Array.isArray(value)) out[normKey] = normalizeFacetList(value);
    else out[normKey] = normalizeToken(value);
  }
  return out;
}


