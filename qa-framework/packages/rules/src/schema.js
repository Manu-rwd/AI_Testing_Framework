import { z } from "zod";
export const Step = z.object({
    sheet: z.string(),
    filter: z.object({ tip_functionalitate: z.string().optional() }).partial().optional(),
    include_general_valabile_within_filter: z.boolean().default(true),
    buckets: z.object({
        include: z.array(z.string()).optional(),
        match_from_us: z.object({ source: z.string(), also_card_content: z.boolean().optional() }).optional()
    }).optional(),
    field_types_from_us: z.boolean().optional(),
    regex_cases: z.object({ positive_on: z.number().optional(), negative_on: z.number().optional() }).optional()
});
export const Rules = z.object({
    name: z.string(),
    flow: z.array(Step),
    outputs: z.object({ csv: z.boolean().default(true), md: z.boolean().default(true) }).default({ csv: true, md: true })
});
//# sourceMappingURL=schema.js.map