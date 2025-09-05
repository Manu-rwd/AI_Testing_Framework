import { z } from 'zod';
export declare const ProvenanceTag: z.ZodObject<{
    source: z.ZodEnum<["user_story", "project_default", "global_default"]>;
    ruleId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    source: "user_story" | "project_default" | "global_default";
    ruleId?: string | undefined;
    timestamp?: string | undefined;
}, {
    source: "user_story" | "project_default" | "global_default";
    ruleId?: string | undefined;
    timestamp?: string | undefined;
}>;
export type ProvenanceTag = z.infer<typeof ProvenanceTag>;
export declare const ProjectMeta: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodNumber;
    language: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: number;
    id: string;
    language: string;
    description?: string | undefined;
}, {
    name: string;
    version: number;
    id: string;
    language?: string | undefined;
    description?: string | undefined;
}>;
export declare const Defaults: z.ZodObject<{
    plan: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        titlu_prefix: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        descriere_generala: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        severitate_implicita: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        prioritate_implicita: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        reguli_date: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            input_regex_generic: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            email_regex: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            telefon_regex: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            input_regex_generic?: string | undefined;
            email_regex?: string | undefined;
            telefon_regex?: string | undefined;
        }, {
            input_regex_generic?: string | undefined;
            email_regex?: string | undefined;
            telefon_regex?: string | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        titlu_prefix?: string | undefined;
        descriere_generala?: string | undefined;
        severitate_implicita?: string | undefined;
        prioritate_implicita?: string | undefined;
        reguli_date?: {
            input_regex_generic?: string | undefined;
            email_regex?: string | undefined;
            telefon_regex?: string | undefined;
        } | undefined;
    }, {
        titlu_prefix?: string | undefined;
        descriere_generala?: string | undefined;
        severitate_implicita?: string | undefined;
        prioritate_implicita?: string | undefined;
        reguli_date?: {
            input_regex_generic?: string | undefined;
            email_regex?: string | undefined;
            telefon_regex?: string | undefined;
        } | undefined;
    }>>>;
    provenance: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        rule_id_prefix: z.ZodOptional<z.ZodDefault<z.ZodString>>;
        source_label: z.ZodOptional<z.ZodDefault<z.ZodLiteral<"project_default">>>;
    }, "strip", z.ZodTypeAny, {
        rule_id_prefix?: string | undefined;
        source_label?: "project_default" | undefined;
    }, {
        rule_id_prefix?: string | undefined;
        source_label?: "project_default" | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    provenance?: {
        rule_id_prefix?: string | undefined;
        source_label?: "project_default" | undefined;
    } | undefined;
    plan?: {
        titlu_prefix?: string | undefined;
        descriere_generala?: string | undefined;
        severitate_implicita?: string | undefined;
        prioritate_implicita?: string | undefined;
        reguli_date?: {
            input_regex_generic?: string | undefined;
            email_regex?: string | undefined;
            telefon_regex?: string | undefined;
        } | undefined;
    } | undefined;
}, {
    provenance?: {
        rule_id_prefix?: string | undefined;
        source_label?: "project_default" | undefined;
    } | undefined;
    plan?: {
        titlu_prefix?: string | undefined;
        descriere_generala?: string | undefined;
        severitate_implicita?: string | undefined;
        prioritate_implicita?: string | undefined;
        reguli_date?: {
            input_regex_generic?: string | undefined;
            email_regex?: string | undefined;
            telefon_regex?: string | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const ModuleConfig: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const ProjectProfile: z.ZodObject<{
    meta: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        version: z.ZodNumber;
        language: z.ZodDefault<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: number;
        id: string;
        language: string;
        description?: string | undefined;
    }, {
        name: string;
        version: number;
        id: string;
        language?: string | undefined;
        description?: string | undefined;
    }>;
    defaults: z.ZodDefault<z.ZodObject<{
        plan: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            titlu_prefix: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            descriere_generala: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            severitate_implicita: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            prioritate_implicita: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            reguli_date: z.ZodOptional<z.ZodOptional<z.ZodObject<{
                input_regex_generic: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                email_regex: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                telefon_regex: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            }, {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            titlu_prefix?: string | undefined;
            descriere_generala?: string | undefined;
            severitate_implicita?: string | undefined;
            prioritate_implicita?: string | undefined;
            reguli_date?: {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            } | undefined;
        }, {
            titlu_prefix?: string | undefined;
            descriere_generala?: string | undefined;
            severitate_implicita?: string | undefined;
            prioritate_implicita?: string | undefined;
            reguli_date?: {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            } | undefined;
        }>>>;
        provenance: z.ZodOptional<z.ZodDefault<z.ZodObject<{
            rule_id_prefix: z.ZodOptional<z.ZodDefault<z.ZodString>>;
            source_label: z.ZodOptional<z.ZodDefault<z.ZodLiteral<"project_default">>>;
        }, "strip", z.ZodTypeAny, {
            rule_id_prefix?: string | undefined;
            source_label?: "project_default" | undefined;
        }, {
            rule_id_prefix?: string | undefined;
            source_label?: "project_default" | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        provenance?: {
            rule_id_prefix?: string | undefined;
            source_label?: "project_default" | undefined;
        } | undefined;
        plan?: {
            titlu_prefix?: string | undefined;
            descriere_generala?: string | undefined;
            severitate_implicita?: string | undefined;
            prioritate_implicita?: string | undefined;
            reguli_date?: {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            } | undefined;
        } | undefined;
    }, {
        provenance?: {
            rule_id_prefix?: string | undefined;
            source_label?: "project_default" | undefined;
        } | undefined;
        plan?: {
            titlu_prefix?: string | undefined;
            descriere_generala?: string | undefined;
            severitate_implicita?: string | undefined;
            prioritate_implicita?: string | undefined;
            reguli_date?: {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            } | undefined;
        } | undefined;
    }>>;
    modules: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    defaults: {
        provenance?: {
            rule_id_prefix?: string | undefined;
            source_label?: "project_default" | undefined;
        } | undefined;
        plan?: {
            titlu_prefix?: string | undefined;
            descriere_generala?: string | undefined;
            severitate_implicita?: string | undefined;
            prioritate_implicita?: string | undefined;
            reguli_date?: {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            } | undefined;
        } | undefined;
    };
    meta: {
        name: string;
        version: number;
        id: string;
        language: string;
        description?: string | undefined;
    };
    modules: Record<string, any>;
}, {
    meta: {
        name: string;
        version: number;
        id: string;
        language?: string | undefined;
        description?: string | undefined;
    };
    defaults?: {
        provenance?: {
            rule_id_prefix?: string | undefined;
            source_label?: "project_default" | undefined;
        } | undefined;
        plan?: {
            titlu_prefix?: string | undefined;
            descriere_generala?: string | undefined;
            severitate_implicita?: string | undefined;
            prioritate_implicita?: string | undefined;
            reguli_date?: {
                input_regex_generic?: string | undefined;
                email_regex?: string | undefined;
                telefon_regex?: string | undefined;
            } | undefined;
        } | undefined;
    } | undefined;
    modules?: Record<string, any> | undefined;
}>;
export type ProjectProfile = z.infer<typeof ProjectProfile>;
export type PlannerField = string | number | boolean | null | undefined | PlannerField[] | {
    [k: string]: PlannerField;
};
export type PlannerPlan = {
    meta?: {
        [k: string]: PlannerField;
    } & {
        provenance?: Record<string, ProvenanceTag>;
    };
    data?: PlannerField;
    [k: string]: PlannerField;
};
