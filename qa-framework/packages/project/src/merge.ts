import { PlannerPlan, PlannerField, ProvenanceTag, ProjectProfile } from './types';

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function nowISO() {
  return new Date().toISOString();
}

export type MergeOptions = {
  ruleIdPrefix: string;
  sourceLabel: 'project_default' | 'global_default';
};

function tag(ruleIdPrefix: string, key: string, idx?: number): ProvenanceTag {
  const ruleId = idx != null ? `${ruleIdPrefix}:${key}:${idx}` : `${ruleIdPrefix}:${key}`;
  return { source: 'project_default', ruleId, timestamp: nowISO() };
}

/**
 * Merge defaults into a plan object, tagging provenance for every field we fill.
 * - Only fills when target is null/undefined/empty-string.
 * - For arrays, appends missing items and tags with index.
 */
export function mergeWithProvenance(plan: PlannerPlan, project: ProjectProfile): PlannerPlan {
  const out: PlannerPlan = JSON.parse(JSON.stringify(plan ?? {}));
  out.meta = out.meta ?? {};
  out.meta.provenance = out.meta.provenance ?? {};

  const pfx = project.defaults?.provenance?.rule_id_prefix ?? 'PRJ-DEFAULT';

  // Example top-level fills for plan meta
  const fills: Array<[string, PlannerField]> = [];

  if (project.defaults?.plan?.titlu_prefix) {
    const currentTitle = (out as any).titlu ?? (out as any).title;
    if (!currentTitle || (typeof currentTitle === 'string' && currentTitle.trim() === '')) {
      fills.push(['titlu', String(project.defaults.plan.titlu_prefix) + (out.meta?.['nume'] ?? '')]);
    }
  }

  if (project.defaults?.plan?.descriere_generala) {
    const curr = (out as any).descriere ?? (out as any).descriere_generala;
    if (!curr || (typeof curr === 'string' && curr.trim() === '')) {
      fills.push(['descriere_generala', project.defaults.plan.descriere_generala]);
    }
  }

  if (project.defaults?.plan?.severitate_implicita && !(out as any).severitate) {
    fills.push(['severitate', project.defaults.plan.severitate_implicita]);
  }
  if (project.defaults?.plan?.prioritate_implicita && !(out as any).prioritate) {
    fills.push(['prioritate', project.defaults.plan.prioritate_implicita]);
  }

  // Apply simple fills with tagging
  fills.forEach(([k, v], idx) => {
    (out as any)[k] = v as any;
    out.meta!.provenance![k] = tag(pfx, k, idx);
  });

  // Ensure data.reguli_date presence
  const rd = project.defaults?.plan?.reguli_date ?? {};
  const dataObj = isObject((out as any).data) ? ((out as any).data as Record<string, unknown>) : {};
  (out as any).data = dataObj;

  for (const [key, val] of Object.entries(rd)) {
    const curr = dataObj[key];
    if (curr == null || (typeof curr === 'string' && curr.trim() === '')) {
      dataObj[key] = val as any;
      out.meta!.provenance!['data.' + key] = tag(pfx, 'data.' + key);
    }
  }

  return out;
}


