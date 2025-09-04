import { z } from 'zod';

export const ProvenanceTag = z.object({
  source: z.enum(['user_story','project_default','global_default']),
  ruleId: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

export type ProvenanceTag = z.infer<typeof ProvenanceTag>;

export const ProjectMeta = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().int().nonnegative(),
  language: z.string().default('ro-RO'),
  description: z.string().optional()
});

export const Defaults = z.object({
  plan: z.object({
    titlu_prefix: z.string().optional(),
    descriere_generala: z.string().optional(),
    severitate_implicita: z.string().optional(),
    prioritate_implicita: z.string().optional(),
    reguli_date: z.object({
      input_regex_generic: z.string().optional(),
      email_regex: z.string().optional(),
      telefon_regex: z.string().optional()
    }).partial().optional()
  }).partial().optional(),
  provenance: z.object({
    rule_id_prefix: z.string().default('PRJ-DEFAULT'),
    source_label: z.literal('project_default').default('project_default')
  }).partial().default({})
}).partial();

export const ModuleConfig = z.record(z.any());

export const ProjectProfile = z.object({
  meta: ProjectMeta,
  defaults: Defaults.default({}),
  modules: ModuleConfig.default({})
});

export type ProjectProfile = z.infer<typeof ProjectProfile>;

// Planner-facing structures
export type PlannerField =
  | string
  | number
  | boolean
  | null
  | undefined
  | PlannerField[]
  | { [k: string]: PlannerField };

export type PlannerPlan = {
  meta?: { [k: string]: PlannerField } & { provenance?: Record<string, ProvenanceTag> };
  data?: PlannerField;
  [k: string]: PlannerField;
};


