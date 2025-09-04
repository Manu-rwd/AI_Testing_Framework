import { applyProjectStandards, PlannerPlan } from '@pkg/project';

/**
 * Apply Project Standards after the core plan is generated but before export.
 * @param plan The plan object produced by the Planner.
 * @param options.projectId Optional project profile id (e.g., 'crm'); defaults to 'default'.
 */
export async function withProjectStandards(plan: PlannerPlan, options?: { projectId?: string }) {
  return applyProjectStandards(plan, options?.projectId);
}


