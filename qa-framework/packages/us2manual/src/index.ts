#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parseUsText } from "./parseUsText";
import { sectionToMarkdown } from "./mapToEmitter";
import type { CrudSection } from "./types";
import { validateManual, formatManual } from "@pkg/spec";

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function computeDocTitle(raw: string, fallback: string): string {
  const t = (raw || "").replace(/\r/g, "");
  const m = t.match(/###\s*(Read|Vizualizare)[\s\S]*?\*\*TITLE\:\*?[\s\S]*?^\s*-\s*[„“"']?([^"\n”]+)[”"']?/im);
  const alt = m?.[2]
    || t.match(/\*\*TITLE\:\*?[\s\S]*?^\s*-\s*[„“"']?([^"\n”]+)[”"']?/im)?.[1]
    || "";
  const title = (alt || fallback || "").replace(/["'„“”]/g, "").trim();
  return title || fallback;
}

function attributesFor(bucket: string, narrative: string, facets: string[]): string[] {
  const n = narrative.toLowerCase();
  const a = new Set<string>();
  const add = (x: string) => a.add(x);
  switch ((bucket||"").toLowerCase()) {
    case "presence":
      add("prezență");
      if (n.includes("no results") || n.includes("fara rezultate")) add("mesaje");
      if (n.includes("loading") || n.includes("skeleton")) add("spinner");
      break;
    case "columns":
      add("prezență");
      if (n.includes("header")) add("proprietăți");
      if (n.includes("valoare")) add("conținut");
      break;
    case "sorting":
      add("comportament");
      break;
    case "pagination":
      add("prezență"); add("comportament");
      break;
    case "responsive":
      add("responsive"); add("layout");
      break;
    case "auth":
      add("autorizare");
      if (n.includes("redirect")) add("comportament");
      break;
    case "resilience":
      if (n.includes("offline")) { add("comportament"); add("mesaj-eroare prietenos"); }
      else if (n.includes("retea lenta") || n.includes("lenta")) { add("spinner"); add("timeout rezonabil"); add("randare după răspuns"); }
      else if (n.includes("ttfb") || n.includes("sla")) { add("performanță"); }
      else { add("reziliență"); add("comportament"); }
      break;
  }
  return Array.from(a);
}

function formatSectionBodyAsQa(body: string): string {
  const lines = body.split(/\r?\n/).filter(l => l.trim().length > 0 && !l.startsWith("<!--"));
  const bullets = lines
    .map((l): RegExpMatchArray | null => l.match(/^\- \[(\w+)]\s*(.+?)(?:\s*\{facets:([^}]+)\})?$/))
    .filter((x): x is RegExpMatchArray => Boolean(x));
  const out: string[] = [];
  let idx = 1;
  for (const m of bullets) {
    const bucket = m[1];
    if (bucket.toLowerCase() === "overlay") continue; // drop overlays
    const narrative = m[2].replace(/\s+/g, " ").trim();
    const facets = (m[3]||"").split(/,\s*/).filter(Boolean);
    const attrs = attributesFor(bucket, narrative, facets);
    const ii = String(idx).padStart(2, "0");
    const attrStr = attrs.length ? ` {${attrs.join(", ")}}` : "";
    out.push(`${ii}. ${narrative}${attrStr}`);
    idx++;
  }
  return out.join("\n");
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("in",  { type: "string", demandOption: true, desc: "Input folder with .txt US files" })
    .option("out", { type: "string", demandOption: true, desc: "Output folder for manual .md files" })
    .option("strict-spec", { type: "boolean", default: true, desc: "Validate output against canonical spec and fail on issues" })
    .option("no-provenance", { type: "boolean", default: false, desc: "Strip provenance comments from output" })
    .strict().parse();

  const inDir = path.resolve(argv.in);
  const outDir = path.resolve(argv.out);
  ensureDir(inDir);
  ensureDir(outDir);

  const files = fs.readdirSync(inDir).filter(f => f.toLowerCase().endsWith(".txt"));
  const order: CrudSection[] = ["Read","Create","Update","Delete","Activate"];

  for (const f of files) {
    const txt = fs.readFileSync(path.join(inDir, f), "utf8");
    const planLite = parseUsText(txt);

    const baseTitleFromName = path.basename(f, path.extname(f)).replace(/[_-]+/g, " ").trim();
    let docTitle = computeDocTitle(txt, baseTitleFromName);
    if (!docTitle || /^\W+$/.test(docTitle)) docTitle = baseTitleFromName;

    const sectionsOut: string[] = [];
    for (const tip of order) {
      const sec = planLite.sections[tip];
      if (!sec) continue;

      const titleCandidateRaw = sec.featureTitle && !/^\*{1,}$/.test(sec.featureTitle) ? sec.featureTitle : docTitle;
      const titleCandidate = titleCandidateRaw.replace(/["'„“”]/g, "").trim();
      const md = sectionToMarkdown(tip, { ...sec, featureTitle: titleCandidate }, docTitle);
      const lines = md.split(/\r?\n/);
      const firstBulletIdx = lines.findIndex((l) => /^- \[/.test(l));
      const bodyRaw = firstBulletIdx >= 0 ? lines.slice(firstBulletIdx).join("\n").trimEnd() : md.trimEnd();
      const body = formatSectionBodyAsQa(bodyRaw);

      const tipRoHdr =
        tip === "Read" ? "Index (Citire / Listare)" :
        tip === "Create" ? "Adăugare (Create)" :
        tip === "Update" ? "Modificare (Update)" :
        tip === "Delete" ? "Ștergere (Delete)" : "Activare (Activate)";

      sectionsOut.push(`## ${tipRoHdr}\n${body}\n`);
    }

    const header = `# Cazuri de testare — ${docTitle} (stil QA)\n`;
    let outContent = header + sectionsOut.join("\n");
    outContent = formatManual(outContent, { stripProvenance: !!(argv as any)["no-provenance"] });
    if ((argv as any)["strict-spec"]) {
      const res = validateManual(outContent);
      if (!res.ok) {
        console.error("Spec validation failed:\n" + res.issues.map(i => `${i.line}:${i.kind}: ${i.msg}${i.sample?`\n  ${i.sample}`:""}`).join("\n"));
        process.exit(3);
      }
    }

    const slug = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
       .replace(/[^A-Za-z0-9]+/g, "_")
       .replace(/^_+|_+$/g, "");
    const outName = `${slug(docTitle)}_Manual.md`;
    fs.writeFileSync(path.join(outDir, outName), outContent + "\n", "utf8");
  }

  console.log(`US→Manual completed. Input: ${inDir} → Output: ${outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


