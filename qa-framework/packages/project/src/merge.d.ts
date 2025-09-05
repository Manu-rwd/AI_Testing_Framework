import { PlannerPlan, ProjectProfile } from './types';
export type MergeOptions = {
    ruleIdPrefix: string;
    sourceLabel: 'project_default' | 'global_default';
};
/**
 * Merge defaults into a plan object, tagging provenance for every field we fill.
 * - Only fills when target is null/undefined/empty-string.
 * - For arrays, appends missing items and tags with index.
 */
export declare function mergeWithProvenance(plan: PlannerPlan, project: ProjectProfile): PlannerPlan;
