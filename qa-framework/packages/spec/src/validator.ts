import { SECTIONS } from "./sections.js";
import type { Tag, Section } from "./types.js";
import { BUCKET_TAGS } from "./vocabulary.js";

const TAG_SET = new Set(Object.values(BUCKET_TAGS).flat());
const SECTION_SET = new Set(SECTIONS);

export type ValidateIssue = { line: number; kind: "section" | "tag" | "auth" | "format"; msg: string; sample?: string };
export type ValidateResult = { ok: boolean; issues: ValidateIssue[]; normalized?: string };

const sectionHeaderRe = /^##\s+(Vizualizare|Adăugare|Modificare|Ștergere|Activare)\s*$/u;
const caseLineRe = /^-\s\[[^\]]+\]\s.+?\s\{facets:([A-Za-z0-9_\-,\s]+)\}\s*$/u;
const provenanceRe = /^<!--\s*provenance:\s*(us|project|uiux|qa_library|defaults)\s*-->$/u;

export function validateManual(md: string, opts?: { allowProvenance?: boolean; noAuthStandalone?: boolean }): ValidateResult {
  const issues: ValidateIssue[] = [];
  const lines = md.split(/\r?\n/);
  const seenSections: Section[] = [];
  let currentSection: Section | null = null;

  lines.forEach((raw, i) => {
    const ln = i + 1;
    if (!raw.trim()) return;

    if (sectionHeaderRe.test(raw)) {
      const sec = raw.replace(/^##\s+/, "") as Section;
      if (!SECTION_SET.has(sec)) issues.push({ line: ln, kind: "section", msg: `Unknown section '${sec}'`, sample: raw });
      seenSections.push(sec);
      currentSection = sec;
      return;
    }

    if (raw.startsWith("## ")) {
      issues.push({ line: ln, kind: "section", msg: "Section header has wrong casing/order", sample: raw });
    }

    const m = raw.match(caseLineRe);
    if (m) {
      const captured = m[1] ?? "";
      const tags = captured.split(",").map(s => s.trim()).filter(Boolean) as Tag[];
      for (const t of tags) if (!TAG_SET.has(t)) issues.push({ line: ln, kind: "tag", msg: `Unknown tag '${t}'`, sample: raw });
      // Guard: no standalone auth outcomes in lines
      if ((opts?.noAuthStandalone ?? true) && /\b403\b|\bhidden\b|\bdisabled\b|\beroare\b/u.test(raw)) {
        issues.push({ line: ln, kind: "auth", msg: "Auth outcome must not be a standalone line; encode as permission metadata", sample: raw });
      }
      return;
    }

    if (provenanceRe.test(raw)) {
      if (opts?.allowProvenance === false) issues.push({ line: ln, kind: "format", msg: "Provenance comments are disabled", sample: raw });
      return;
    }

    // ignore title line or other headers, but flag foreign structures:
    if (/^#\s/.test(raw) || /^###\s/.test(raw)) return;
    // Flag stray content
    if (!provenanceRe.test(raw)) {
      issues.push({ line: ln, kind: "format", msg: "Unexpected line format", sample: raw });
    }
  });

  // Section order check: enforce relative order according to canonical SECTIONS
  let last = -1;
  let badOrder = false;
  for (const s of seenSections) {
    const idx = SECTIONS.indexOf(s as any);
    if (idx === -1 || idx < last) { badOrder = true; break; }
    last = idx;
  }
  if (badOrder) issues.push({ line: 0, kind: "section", msg: "Sections not in canonical order" });

  return { ok: issues.length === 0, issues };
}

export function formatManual(md: string, opts?: { stripProvenance?: boolean }): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  const seenCase = new Set<string>();
  for (const raw of lines) {
    if (!raw.trim()) continue;
    if ((opts?.stripProvenance ?? false) && /^<!--\s*provenance:/i.test(raw)) continue;
    if (/^-\s\[/.test(raw)) {
      const key = raw.replace(/\s+/g, " ").trim();
      if (seenCase.has(key)) continue;
      seenCase.add(key);
    }
    out.push(raw.replace(/\s+$/u, "")); // trim right
  }
  // ensure trailing newline
  if (out[out.length - 1] !== "") out.push("");
  return out.join("\n");
}


