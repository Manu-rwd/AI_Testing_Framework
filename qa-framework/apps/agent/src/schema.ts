import { z } from "zod";

export const ManualLineSchema = z.object({
  bucket: z.string().min(1),
  narrative: z.string().min(1),
  facets: z.array(z.string().min(1)).optional()
});

export const ManualOutputSchema = z.object({
  lines: z.array(ManualLineSchema).min(1)
});

export type ManualLine = z.infer<typeof ManualLineSchema>;
export type ManualOutput = z.infer<typeof ManualOutputSchema>;

export const StyleIssueSchema = z.object({
  line: z.number().int().nonnegative(),
  issue: z.string()
});

export const ParityMissSchema = z.object({
  type: z.enum(["missing", "mismatch", "extra", "order", "tag_mismatch"]).optional(),
  gold_narrative: z.string().optional(),
  bucket: z.string().optional(),
  narrative: z.string().optional(),
  facets: z.array(z.string()).optional()
});

export const FixInputSchema = z.object({
  last_output: ManualOutputSchema,
  errors: z.object({
    style_issues: z.array(StyleIssueSchema).optional(),
    parity_misses: z.array(ParityMissSchema).optional()
  })
});

export type FixInput = z.infer<typeof FixInputSchema>;

export const RefinerUserPayloadSchema = z.object({
  task: z.literal("refine_manual"),
  module: z.string(),
  tip: z.string(),
  schema: z.any(),
  context: z.object({
    spec_rules: z.string(),
    bucket_vocab: z.record(z.array(z.string())).optional(),
    examples: z.array(ManualLineSchema).optional()
  }),
  inputs: z.object({
    us: z.string().optional(),
    generated: z.string().optional(),
    gold_optional: z.string().optional()
  })
});

export type RefinerUserPayload = z.infer<typeof RefinerUserPayloadSchema>;

export const SuggesterInputSchema = z.object({
  task: z.literal("suggest_repo_edits"),
  misses: z.array(ManualLineSchema).optional(),
  mapping_targets: z.array(z.string())
});

export type SuggesterInput = z.infer<typeof SuggesterInputSchema>;


