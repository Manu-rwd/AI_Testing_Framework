import { z } from "zod";

export const SourceTag = z.enum(["us", "project", "defaults"]);

export const Bucket = z.object({
  name: z.string().min(1),
  source: SourceTag.default("us"),
});

export const Field = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  regex: z.string().optional(),
  source: SourceTag.default("us"),
});

export const Permission = z.object({
  key: z.string().min(1),
  source: SourceTag.default("us"),
});

export const Messages = z.object({
  toasts: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
  empty_states: z.array(z.string()).default([]),
});

export const Confidence = z.object({
  per_section: z.record(z.number().min(0).max(1)).default({}),
  overall: z.number().min(0).max(1).default(0),
  weights: z.object({
    fields: z.number().default(0.35),
    buckets: z.number().default(0.25),
    permissions: z.number().default(0.15),
    routes: z.number().default(0.1),
    messages: z.number().default(0.1),
    negatives: z.number().default(0.05),
  }).default({} as any),
});

export const Provenance = z.object({
  buckets: z.record(SourceTag).default({}),
  fields: z.record(SourceTag).default({}),
  permissions: z.record(SourceTag).default({}),
  routes: z.record(SourceTag).default({}),
  messages: z.object({
    toasts: z.record(SourceTag).default({}),
    errors: z.record(SourceTag).default({}),
    empty_states: z.record(SourceTag).default({}),
  }).default({} as any),
  negatives: z.record(SourceTag).default({}),
  assumptions: z.record(SourceTag).default({}),
});

export const USNormalized = z.object({
  buckets: z.array(Bucket).default([]),
  fields: z.array(Field).default([]),
  permissions: z.array(Permission).default([]),
  routes: z.array(z.string()).default([]),
  messages: Messages.default({} as any),
  negatives: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  confidence: Confidence.default({} as any),
  provenance: Provenance.default({} as any),
});

export type TUSNormalized = z.infer<typeof USNormalized>;
export type TSourceTag = z.infer<typeof SourceTag>;

export function emptyUS(): TUSNormalized {
  return USNormalized.parse({});
}


