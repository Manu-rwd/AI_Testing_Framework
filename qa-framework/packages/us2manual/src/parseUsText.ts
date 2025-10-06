import { CrudSection, PlanLite, PlanLiteSection, ColumnSpec } from "./types";

function canonSection(label: string): CrudSection | null {
  const l = label.toLowerCase();
  if (/(^|\s)(read|vizualizare)\b/.test(l)) return "Read";
  if (/(^|\s)(create|adaugare|adăugare)\b/.test(l)) return "Create";
  if (/(^|\s)(update|modificare|editare)\b/.test(l)) return "Update";
  if (/(^|\s)(delete|stergere|ștergere)\b/.test(l)) return "Delete";
  if (/(^|\s)(activate|activare)\b/.test(l)) return "Activate";
  return null;
}

export function parseUsText(txt: string): PlanLite {
  const t = (txt || "").replace(/\r/g, "");
  const sections: PlanLite["sections"] = {};

  // Try to find a document-level title as fallback
  const docTitle = (
    t.match(/\*\*TITLE\:\*?\s*[-–]\s*["“]?([^"\n]+)["”]?/i)?.[1] ||
    t.match(/\b(TITLU|TITLE)\b[\s:–-]+["“]?([^"\n]+)["”]?/i)?.[2] ||
    "Document"
  ).trim();

  const headerRe = /^\s*###\s*([^\n]+)$/gim;
  const headers: Array<{ label: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(t))) {
    headers.push({ label: m[1].trim(), index: m.index });
  }

  const blocks: Array<{ tip: CrudSection; block: string }> = [];
  for (let i = 0; i < headers.length; i++) {
    const tip = canonSection(headers[i].label);
    if (!tip) continue;
    const start = headers[i].index + (t.slice(headers[i].index).match(/^.*$/m)?.[0].length || 0);
    const end = i + 1 < headers.length ? headers[i + 1].index : t.length;
    const block = t.slice(start, end);
    blocks.push({ tip, block });
  }

  let lastTitle = docTitle;
  for (const { tip, block } of blocks) {
    const featureTitle = ((): string => {
      const inline = block.match(/\*\*TITLE\:\*?[^\n]*?["“]?([^"\n]+)["”]?/i)?.[1];
      if (inline && inline.trim()) return inline.trim();
      const bullet = block.match(/\*\*TITLE\:\*?[\s\S]*?^\s*-\s*["“]?([^"\n]+)["”]?/im)?.[1];
      if (bullet && bullet.trim()) return bullet.trim();
      const generic = block.match(/\b(TITLU|TITLE)\b[\s:–-]+["“]?([^"\n]+)["”]?/i)?.[2];
      if (generic && generic.trim()) return generic.trim();
      return (lastTitle || docTitle || "Document").trim();
    })();
    lastTitle = featureTitle || lastTitle;

    const colBlocks = block.match(/^\s*\*\*[A-Za-zăâîșț ĂÂÎȘȚ]+ Column:\*\*[\s\S]*?(?=^\s*\*\*|^\s*$)/gmi) || [];
    const columns: ColumnSpec[] = colBlocks.map(cb => {
      const rawName =
        cb.match(/Name:\s*[„"“]?([^"\n(]+)["”]?/i)?.[1]?.trim() ||
        cb.match(/^\s*\*\*([A-Za-zăâîșț ĂÂÎȘȚ]+)\s*Column:\*\*/i)?.[1]?.trim() ||
        "Coloana";
      const name = rawName
        .replace(/[„“”]/g, "")
        .replace(/^["']+|["']+$/g, "")
        .trim();
      const sortable = /Sort:\s*True/i.test(cb);
      const filter = cb.match(/Column Filter:\s*([A-Za-z\- ]+)/i)?.[1]?.trim();
      const regex = cb.match(/Regex:\s*`([^`]+)`/i)?.[1]?.trim();
      return { name, sortable, filter, regex };
    });

    const pagination = /Pagination:\s*Enabled/i.test(block)
      ? { enabled: true, defaultPageSize: parseInt(block.match(/default items number:\s*(\d+)/i)?.[1] ?? "", 10) || null }
      : undefined;

    const sortingFields = (() => {
      const mm = block.match(/Implement sort logic[^]*?for the ([A-Za-zăâîșț ĂÂÎȘȚ, ]+) columns?/i);
      if (!mm) return undefined;
      return mm[1].split(",").map(s => s.trim()).filter(Boolean);
    })();

    const auth = {
      unauthorized403Direct: /403/i.test(block),
      unauthorizedHidden: /ascunse?|hidden/i.test(block),
      unauthorizedDisabled: /dezactivate?|disabled/i.test(block),
      unauthorizedErrorOnClick: /eroare la click|error on click|toast|dialog/i.test(block),
      unauthRedirect: block.match(/redirect[^"']+["']([^"']+)["']/i)?.[1] ?? null,
      nonAdminRole: /non-?admin|rol\s+non-?admin/i.test(block),
    };

    const resilience = {
      offline: /offline/i.test(block),
      slowNetwork: /\blent[ăa]\b|slow/i.test(block),
      loadingSLAms: (() => {
        const mm2 = block.match(/SLA.*?(?:TTFB|loading).*?(\d{3,5})\s*ms/i);
        return mm2 ? parseInt(mm2[1], 10) : null;
      })(),
      connDropOnAccess: /drop conexiune.*acces/i.test(block),
      connDropDuringInteraction: /drop conexiune.*interactiune|during interaction/i.test(block),
    };

    const signals = {
      pagination,
      sortingFields,
      breakpoints: ["md"],
      resilience,
      authPatterns: auth,
    };

    const plSection: PlanLiteSection = { featureTitle, columns, signals };
    sections[tip] = plSection;
  }

  return { sections };
}


