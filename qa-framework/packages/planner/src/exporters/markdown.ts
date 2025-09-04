import fs from 'node:fs/promises';

type AnyObj = Record<string, any>;

function kvTable(obj: AnyObj): string {
  const rows = Object.entries(obj)
    .filter(([k]) => !['meta','data','module','titlu','descriere_generala','severitate','prioritate','provenance'].includes(k))
    .map(([k, v]) => `| \`${k}\` | ${typeof v === 'object' ? '`[object]`' : String(v)} |`).join('\n');
  return rows || '| (niciun câmp) | |';
}

export async function writeMarkdown(plan: AnyObj, filePath: string) {
  const prov = (plan.meta?.provenance ?? {}) as Record<string, { source?: string; ruleId?: string; timestamp?: string }>; 
  const provRows = Object.entries(prov)
    .map(([k, t]) => `| \`${k}\` | ${t.source ?? ''} | ${t.ruleId ?? ''} | ${t.timestamp ?? ''} |`).join('\n') || '| (niciun câmp completat) | | | |';

  const md = `# ${plan.titlu ?? 'Plan de testare'}\n  \n**Modul:** ${plan.module ?? ''}  \n**Severitate:** ${plan.severitate ?? ''}  \n**Prioritate:** ${plan.prioritate ?? ''}\n\n${plan.descriere_generala ?? ''}\n\n## Câmpuri plan (kv)\n| Cheie | Valoare |\n|---|---|\n${kvTable(plan)}\n\n## Reguli / Regex\n| Cheie | Valoare |\n|---|---|\n${Object.entries(plan.data ?? {}).map(([k,v]) => `| \`${k}\` | ${String(v)} |`).join('\n') || '| (niciunul) | |'}\n\n## Proveniență completări\n| Cheie | Sursă | Regula | Timp |\n|---|---|---|---|\n${provRows}\n`;
  await fs.writeFile(filePath, md, 'utf8');
}


