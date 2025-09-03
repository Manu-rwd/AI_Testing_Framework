import { z } from "zod";

export const NormalizedRow = z.object({
  module: z.literal("Accesare"),
  tipFunctionalitate: z.array(z.string()).nonempty(),
  bucket: z.string().optional(),
  generalValabile: z.boolean().default(false),
  narrative_ro: z.string().min(1),
  placeholders: z.array(z.string()).default([]),
  atoms: z.array(z.any()).default([]),
  step_hints: z.string().optional(),
  env: z.object({
    automat: z.number().int().min(0).max(1).default(0),
    local: z.number().int().min(0).max(1).default(1),
    test: z.number().int().min(0).max(1).default(1),
    prod: z.number().int().min(0).max(1).default(1)
  }).default({ automat: 0, local: 1, test: 1, prod: 1 }),
  impact: z.number().int().optional(),
  efort: z.number().int().optional(),
  importanta: z.number().int().optional()
});

export type NormalizedRow = z.infer<typeof NormalizedRow>;


