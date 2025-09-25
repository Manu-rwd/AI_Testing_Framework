import { z } from "zod";

export const PlanRowV2Schema = z.object({
  module: z.string(),
  tipFunctionalitate: z.string(),
  bucket: z.string(),
  narrative_ro: z.string(),
  atoms: z.object({
    setup: z.array(z.string()),
    action: z.array(z.string()),
    assert: z.array(z.string()),
  }),
  oracle_kind: z.enum(["none","visual","api","dom"]),
  selector_strategy: z.array(z.enum(["data-testid","role","label","text"])).default([]),
  selector_needs: z.array(z.string()).default([]),
  data_profile: z.object({
    required: z.array(z.string()).default([]),
    generators: z.record(z.string()).default({}),
  }),
  feasibility: z.enum(["A","B","C","D","E"]),
  source: z.enum(["us","project","defaults"]),
  provenance: z
    .object({
      fields: z.record(z.enum(["us","project","defaults"])).optional(),
      messages: z.record(z.enum(["us","project","defaults"])).optional(),
    })
    .optional(),
  confidence: z.number().min(0).max(1),
  rule_tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type PlanRowV2 = z.infer<typeof PlanRowV2Schema>;

export const PlanV2Schema = z.object({
  rows: z.array(PlanRowV2Schema),
  overall_confidence: z.number().min(0).max(1),
});

export type PlanV2 = z.infer<typeof PlanV2Schema>;


