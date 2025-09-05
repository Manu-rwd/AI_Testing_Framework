export { loadProjectProfile } from './loader';
export { mergeWithProvenance } from './merge';
export * from './types';
import { loadProjectProfile } from './loader';
import { mergeWithProvenance } from './merge';
export async function applyProjectStandards(plan, projectId) {
    const profile = await loadProjectProfile(projectId);
    return mergeWithProvenance(plan, profile);
}
//# sourceMappingURL=index.js.map