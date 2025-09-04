export { loadProjectProfile } from './loader';
export { mergeWithProvenance } from './merge';
export * from './types';

/**
 * Convenience function used by planner: loads a Project profile and applies defaults.
 */
import { PlannerPlan } from './types';
import { loadProjectProfile } from './loader';
import { mergeWithProvenance } from './merge';

export async function applyProjectStandards(plan: PlannerPlan, projectId?: string): Promise<PlannerPlan> {
  const profile = await loadProjectProfile(projectId);
  return mergeWithProvenance(plan, profile);
}


