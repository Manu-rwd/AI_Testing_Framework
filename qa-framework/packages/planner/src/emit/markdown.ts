import fs from "fs-extra";

export async function emitMarkdown(filePath: string, type: string, grouped: Map<string, any[]>) {
  let md = `# Plan RO — Tip: ${type}\n\n`;
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


