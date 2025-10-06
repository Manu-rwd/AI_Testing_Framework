import { SECTIONS } from "./sections";
import { BUCKET_TAGS } from "./vocabulary";
const TAG_SET = new Set(Object.values(BUCKET_TAGS).flat());
const SECTION_SET = new Set(SECTIONS);
const sectionHeaderRe = /^##\s+(Vizualizare|Adăugare|Modificare|Ștergere|Activare)\s*$/u;
const caseLineRe = /^-\s\[[^\]]+\]\s.+?\s\{facets:([a-z0-9_\-,\s]+)\}\s*$/u;
const provenanceRe = /^<!--\s*provenance:\s*(us|project|uiux|qa_library|defaults)\s*-->$/u;
export function validateManual(md, opts) {
    const issues = [];
    const lines = md.split(/\r?\n/);
    const seenSections = [];
    let currentSection = null;
    lines.forEach((raw, i) => {
        const ln = i + 1;
        if (!raw.trim())
            return;
        if (sectionHeaderRe.test(raw)) {
            const sec = raw.replace(/^##\s+/, "");
            if (!SECTION_SET.has(sec))
                issues.push({ line: ln, kind: "section", msg: `Unknown section '${sec}'`, sample: raw });
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
            const tags = captured.split(",").map(s => s.trim()).filter(Boolean);
            for (const t of tags)
                if (!TAG_SET.has(t))
                    issues.push({ line: ln, kind: "tag", msg: `Unknown tag '${t}'`, sample: raw });
            // Guard: no standalone auth outcomes in lines
            if ((opts?.noAuthStandalone ?? true) && /\b403\b|\bhidden\b|\bdisabled\b|\beroare\b/u.test(raw)) {
                issues.push({ line: ln, kind: "auth", msg: "Auth outcome must not be a standalone line; encode as permission metadata", sample: raw });
            }
            return;
        }
        if (provenanceRe.test(raw)) {
            if (opts?.allowProvenance === false)
                issues.push({ line: ln, kind: "format", msg: "Provenance comments are disabled", sample: raw });
            return;
        }
        // ignore title line or other headers, but flag foreign structures:
        if (/^#\s/.test(raw) || /^###\s/.test(raw))
            return;
        // Flag stray content
        if (!provenanceRe.test(raw)) {
            issues.push({ line: ln, kind: "format", msg: "Unexpected line format", sample: raw });
        }
    });
    // Section order check
    const orderOK = seenSections.every((s, idx) => idx < SECTIONS.length && s === SECTIONS[idx]);
    if (!orderOK)
        issues.push({ line: 0, kind: "section", msg: "Sections not in canonical order" });
    return { ok: issues.length === 0, issues };
}
export function formatManual(md, opts) {
    const lines = md.split(/\r?\n/);
    const out = [];
    const seenCase = new Set();
    for (const raw of lines) {
        if (!raw.trim())
            continue;
        if ((opts?.stripProvenance ?? false) && /^<!--\s*provenance:/i.test(raw))
            continue;
        if (/^-\s\[/.test(raw)) {
            const key = raw.replace(/\s+/g, " ").trim();
            if (seenCase.has(key))
                continue;
            seenCase.add(key);
        }
        out.push(raw.replace(/\s+$/u, "")); // trim right
    }
    // ensure trailing newline
    if (out[out.length - 1] !== "")
        out.push("");
    return out.join("\n");
}
//# sourceMappingURL=validator.js.map