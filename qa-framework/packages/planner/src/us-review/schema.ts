import { z } from "zod";

export const SourceEnum = z.enum(["us", "project", "defaults"]);

export const BucketSchema = z.object({
  name: z.string().min(1),
  source: SourceEnum.default("us"),
});

export const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  regex: z.string().optional(),
  source: SourceEnum.default("us"),
});

export const PermissionSchema = z.object({
  key: z.string().min(1),
  source: SourceEnum.default("us"),
});

export const RouteSchema = z.object({
  path: z.string().min(1),
  method: z.string().optional(),
  source: SourceEnum.default("us"),
});

export const MessageItemSchema = z.object({
  text: z.string().min(1),
  source: SourceEnum.default("us"),
});

export const MessagesSchema = z.object({
  toasts: z.array(MessageItemSchema).default([]),
  errors: z.array(MessageItemSchema).default([]),
  empty_states: z.array(MessageItemSchema).default([]),
});

export const ConfidenceSchema = z.object({
  per_section: z.object({
    fields: z.number().min(0).max(1),
    buckets: z.number().min(0).max(1),
    permissions: z.number().min(0).max(1),
    routes: z.number().min(0).max(1),
    messages: z.number().min(0).max(1),
    negatives: z.number().min(0).max(1),
  }),
  overall: z.number().min(0).max(1),
  weights: z.object({
    fields: z.number(),
    buckets: z.number(),
    permissions: z.number(),
    routes: z.number(),
    messages: z.number(),
    negatives: z.number(),
  }),
});

export const USNormalizedSchema = z.object({
  buckets: z.array(BucketSchema).default([]),
  fields: z.array(FieldSchema).default([]),
  permissions: z.array(PermissionSchema).default([]),
  routes: z.array(RouteSchema).default([]),
  messages: MessagesSchema.default({ toasts: [], errors: [], empty_states: [] }),
  negatives: z.array(z.object({ text: z.string(), source: SourceEnum.default("us") })).default([]),
  assumptions: z.array(z.object({ text: z.string(), source: SourceEnum.default("us") })).default([]),
  confidence: ConfidenceSchema.optional(),
});

export type SourceTag = z.infer<typeof SourceEnum>;
export type Bucket = z.infer<typeof BucketSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type MessageItem = z.infer<typeof MessageItemSchema>;
export type Messages = z.infer<typeof MessagesSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type USNormalized = z.infer<typeof USNormalizedSchema>;


