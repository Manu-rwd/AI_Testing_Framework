export { loadProjectProfile } from './loader';
export { mergeWithProvenance } from './merge';
export * from './types';
/**
 * Convenience function used by planner: loads a Project profile and applies defaults.
 */
import { PlannerPlan } from './types';
export declare function applyProjectStandards(plan: PlannerPlan, projectId?: string): Promise<PlannerPlan>;
