import { z } from "zod";

export const ManualCaseSchema = z.object({
  nr: z.number().int().positive(),
  narrative_ro: z.string(),
  importanta: z.union([z.string(), z.number()]).optional(),
  impact: z.number().int().optional(),
  efort: z.number().int().optional(),
  env: z.enum(["Local", "Test", "Prod"]).optional(),
  notes: z.string().optional()
});

export type ManualCase = z.infer<typeof ManualCaseSchema>;

export const ManualGroupSchema = z.object({
  title: z.string(),
  cases: z.array(ManualCaseSchema).nonempty()
});

export type ManualGroup = z.infer<typeof ManualGroupSchema>;

export const ManualSectionSchema = z.object({
  title: z.string(),
  groups: z.array(ManualGroupSchema).nonempty()
});

export type ManualSection = z.infer<typeof ManualSectionSchema>;

export const ManualEmitterInputSchema = z.object({
  module: z.string(),
  tipFunctionalitate: z.string(),
  usTitle: z.string(),
  env: z.enum(["Local", "Test", "Prod"]).default("Local"),
  notes: z.string().optional(),
  sections: z.array(ManualSectionSchema).nonempty()
});

export type ManualEmitterInput = z.infer<typeof ManualEmitterInputSchema>;


