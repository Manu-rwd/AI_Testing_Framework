import fs from 'node:fs/promises';

type AnyObj = Record<string, any>;
type Prov = { source?: string; ruleId?: string; timestamp?: string };

function toCsv(rows: string[][]) {
  const esc = (s: string) => '"' + s.replace(/\"/g, '""') + '"';
  return rows.map(r => r.map(c => esc((c ?? '') as string)).join(',')).join('\n') + '\n';
}

export async function writeCsv(plan: AnyObj, filePath: string) {
  const prov = (plan.meta?.provenance ?? {}) as Record<string, Prov>;
  const rows: string[][] = [['key','value','prov.source','prov.ruleId','prov.timestamp']];

  const pushKV = (prefix: string, obj: AnyObj) => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        pushKV(key, v as AnyObj);
      } else {
        const val = v == null ? '' : String(v);
        const p = prov[key] ?? prov[`data.${k}`] ?? {};
        rows.push([key, val, p.source ?? '', p.ruleId ?? '', p.timestamp ?? '']);
      }
    }
  };

  const root: AnyObj = {};
  for (const k of ['titlu','descriere_generala','severitate','prioritate','module']) {
    if (plan[k] != null) root[k] = plan[k];
  }
  pushKV('', root);
  pushKV('data', plan.data ?? {});
  await fs.writeFile(filePath, toCsv(rows), 'utf8');
}


