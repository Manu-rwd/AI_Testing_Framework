import { z } from "zod";

export const Atom = z.object({
  kind: z.enum(["action", "assert"]),
  type: z.string(),
  selector: z.string().optional(),
  to: z.string().optional(),
  value: z.any().optional(),
  keys: z.string().optional(),
  state: z.string().optional(),
  matches: z.string().optional(),
  op: z.string().optional(),
  count: z.number().optional(),
  meta: z.record(z.any()).optional()
});

export type Atom = z.infer<typeof Atom>;

