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
  selector_strategy: z
    .union([
      z.array(z.enum(["data-testid","role","label","text"]).or(z.string())).default([]),
      z.object({
        primary: z.string(),
        fallbacks: z.array(z.string()),
        rationale: z.string(),
        source: z.enum(["US","project","defaults"]),
        confidence: z.number().min(0).max(1),
      }),
    ]),
  selectors: z.array(z.string()).default([]),
  selector_needs: z.array(z.string()).default([]),
  data_profile: z
    .union([
      z.object({ required: z.array(z.string()).default([]), generators: z.record(z.string()).default({}) }),
      z.object({
        minimal_valid: z.string(),
        invalid_regex: z.array(z.string()),
        edge_cases: z.array(z.object({ name: z.string(), value: z.string() })),
        generators: z.array(z.string()).optional(),
        source: z.enum(["US","project","defaults"]),
        confidence: z.number().min(0).max(1),
      }),
    ]),
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

// Shared emitter-facing type compatible with v2 rows
export interface PlanRow {
  module: string;
  tipFunctionalitate?: string;
  bucket?: string;
  narrative_ro?: string;
  atoms?: any[];
  selector_needs?: string;
  selector_strategy?: string;
  selectors?: string[];
  data_profile?: string;
  feasibility?: "A"|"B"|"C"|"D"|"E";
  source?: string;
  confidence?: number;
  rule_tags?: string[];
  notes?: string;
}

export const PlanV2Schema = z.object({
  rows: z.array(PlanRowV2Schema),
  overall_confidence: z.number().min(0).max(1),
});

export type PlanV2 = z.infer<typeof PlanV2Schema>;


