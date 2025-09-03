import fs from "fs-extra";

export async function emitMarkdown(filePath: string, type: string, grouped: Map<string, any[]>, us?: { fields?: any[] }) {
  let md = `# Plan RO — Tip: ${type}\n\n`;
  if (us?.fields && us.fields.length) {
    md += `### Câmpuri & regex din US\n\n`;
    for (const f of us.fields) {
      md += `- **${f.name}**${f.type ? ` (${f.type})` : ""}: \`${f.regex || "-"}\`\n`;
    }
    md += `\n---\n\n`;
  }
  for (const [section, items] of grouped) {
    md += `## ${section}\n\n`;
    items.forEach((r, i) => {
      md += `${i + 1}. ${r.narrative_ro}\n`;
      if (r.step_hints) md += `   - _Notă_: ${r.step_hints}\n`;
    });
    md += `\n`;
  }
  await fs.writeFile(filePath, md, "utf8");
}


