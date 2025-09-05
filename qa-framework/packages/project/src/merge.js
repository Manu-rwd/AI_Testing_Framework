function isObject(x) {
    return !!x && typeof x === 'object' && !Array.isArray(x);
}
function nowISO() {
    return new Date().toISOString();
}
function tag(ruleIdPrefix, key, idx) {
    const ruleId = idx != null ? `${ruleIdPrefix}:${key}:${idx}` : `${ruleIdPrefix}:${key}`;
    return { source: 'project_default', ruleId, timestamp: nowISO() };
}
/**
 * Merge defaults into a plan object, tagging provenance for every field we fill.
 * - Only fills when target is null/undefined/empty-string.
 * - For arrays, appends missing items and tags with index.
 */
export function mergeWithProvenance(plan, project) {
    const out = JSON.parse(JSON.stringify(plan ?? {}));
    out.meta = out.meta ?? {};
    out.meta.provenance = out.meta.provenance ?? {};
    const pfx = project.defaults?.provenance?.rule_id_prefix ?? 'PRJ-DEFAULT';
    // Example top-level fills for plan meta
    const fills = [];
    if (project.defaults?.plan?.titlu_prefix) {
        const currentTitle = out.titlu ?? out.title;
        if (!currentTitle || (typeof currentTitle === 'string' && currentTitle.trim() === '')) {
            fills.push(['titlu', String(project.defaults.plan.titlu_prefix) + (out.meta?.['nume'] ?? '')]);
        }
    }
    if (project.defaults?.plan?.descriere_generala) {
        const curr = out.descriere ?? out.descriere_generala;
        if (!curr || (typeof curr === 'string' && curr.trim() === '')) {
            fills.push(['descriere_generala', project.defaults.plan.descriere_generala]);
        }
    }
    if (project.defaults?.plan?.severitate_implicita && !out.severitate) {
        fills.push(['severitate', project.defaults.plan.severitate_implicita]);
    }
    if (project.defaults?.plan?.prioritate_implicita && !out.prioritate) {
        fills.push(['prioritate', project.defaults.plan.prioritate_implicita]);
    }
    // Apply simple fills with tagging
    fills.forEach(([k, v], idx) => {
        out[k] = v;
        out.meta.provenance[k] = tag(pfx, k, idx);
    });
    // Ensure data.reguli_date presence
    const rd = project.defaults?.plan?.reguli_date ?? {};
    const dataObj = isObject(out.data) ? out.data : {};
    out.data = dataObj;
    for (const [key, val] of Object.entries(rd)) {
        const curr = dataObj[key];
        if (curr == null || (typeof curr === 'string' && curr.trim() === '')) {
            dataObj[key] = val;
            out.meta.provenance['data.' + key] = tag(pfx, 'data.' + key);
        }
    }
    return out;
}
//# sourceMappingURL=merge.js.map