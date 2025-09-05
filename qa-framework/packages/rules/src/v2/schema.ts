import { z } from "zod";

export const RulesV2Schema = z.object({
  type: z.string(),                       // e.g., "Adaugare"
  version: z.literal(2),
  buckets_policy: z.enum(["strict", "lax"]).default("strict"),
  min_confidence: z.number().min(0).max(1).optional(),
  aaa_templates: z.object({
    setup: z.array(z.string()).default([]),   // Arrange templates
    action: z.array(z.string()).default([]),  // Act templates
    assert: z.array(z.string()).default([]),  // Assert templates
  }),
  selector_hints: z
    .object({
      preferred: z.array(z.enum(["data-testid","role","label","text"])).default([]),
      anti_patterns: z.array(z.string()).optional(),
    })
    .optional(),
  data_profile_hints: z
    .object({
      required: z.array(z.string()).optional(),
      generators: z.record(z.string()).optional(), // "email":"faker:internet.email"
    })
    .optional(),
  oracle_kinds: z.array(z.enum(["none","visual","api","dom"])).optional(),
  rule_tags: z.array(z.string()).default([]),
  negatives: z.array(z.string()).default([]),
  required_sections: z.array(z.string()).default([]) // e.g., ["fields","routes"]
});

export type RulesV2 = z.infer<typeof RulesV2Schema>;


