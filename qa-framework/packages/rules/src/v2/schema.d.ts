import { z } from "zod";
export declare const RulesV2Schema: z.ZodObject<{
    type: z.ZodString;
    version: z.ZodLiteral<2>;
    buckets_policy: z.ZodDefault<z.ZodEnum<["strict", "lax"]>>;
    min_confidence: z.ZodOptional<z.ZodNumber>;
    aaa_templates: z.ZodObject<{
        setup: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        action: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        assert: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        setup: string[];
        action: string[];
        assert: string[];
    }, {
        setup?: string[] | undefined;
        action?: string[] | undefined;
        assert?: string[] | undefined;
    }>;
    selector_hints: z.ZodOptional<z.ZodObject<{
        preferred: z.ZodDefault<z.ZodArray<z.ZodEnum<["data-testid", "role", "label", "text"]>, "many">>;
        anti_patterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        preferred: ("data-testid" | "role" | "label" | "text")[];
        anti_patterns?: string[] | undefined;
    }, {
        preferred?: ("data-testid" | "role" | "label" | "text")[] | undefined;
        anti_patterns?: string[] | undefined;
    }>>;
    data_profile_hints: z.ZodOptional<z.ZodObject<{
        required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        generators: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        required?: string[] | undefined;
        generators?: Record<string, string> | undefined;
    }, {
        required?: string[] | undefined;
        generators?: Record<string, string> | undefined;
    }>>;
    oracle_kinds: z.ZodOptional<z.ZodArray<z.ZodEnum<["none", "visual", "api", "dom"]>, "many">>;
    rule_tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    negatives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    required_sections: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: string;
    version: 2;
    buckets_policy: "strict" | "lax";
    aaa_templates: {
        setup: string[];
        action: string[];
        assert: string[];
    };
    rule_tags: string[];
    negatives: string[];
    required_sections: string[];
    min_confidence?: number | undefined;
    selector_hints?: {
        preferred: ("data-testid" | "role" | "label" | "text")[];
        anti_patterns?: string[] | undefined;
    } | undefined;
    data_profile_hints?: {
        required?: string[] | undefined;
        generators?: Record<string, string> | undefined;
    } | undefined;
    oracle_kinds?: ("none" | "visual" | "api" | "dom")[] | undefined;
}, {
    type: string;
    version: 2;
    aaa_templates: {
        setup?: string[] | undefined;
        action?: string[] | undefined;
        assert?: string[] | undefined;
    };
    buckets_policy?: "strict" | "lax" | undefined;
    min_confidence?: number | undefined;
    selector_hints?: {
        preferred?: ("data-testid" | "role" | "label" | "text")[] | undefined;
        anti_patterns?: string[] | undefined;
    } | undefined;
    data_profile_hints?: {
        required?: string[] | undefined;
        generators?: Record<string, string> | undefined;
    } | undefined;
    oracle_kinds?: ("none" | "visual" | "api" | "dom")[] | undefined;
    rule_tags?: string[] | undefined;
    negatives?: string[] | undefined;
    required_sections?: string[] | undefined;
}>;
export type RulesV2 = z.infer<typeof RulesV2Schema>;
