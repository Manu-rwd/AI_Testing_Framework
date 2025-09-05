import { z } from "zod";
export declare const Step: z.ZodObject<{
    sheet: z.ZodString;
    filter: z.ZodOptional<z.ZodObject<{
        tip_functionalitate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        tip_functionalitate?: string | undefined;
    }, {
        tip_functionalitate?: string | undefined;
    }>>;
    include_general_valabile_within_filter: z.ZodDefault<z.ZodBoolean>;
    buckets: z.ZodOptional<z.ZodObject<{
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        match_from_us: z.ZodOptional<z.ZodObject<{
            source: z.ZodString;
            also_card_content: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            source: string;
            also_card_content?: boolean | undefined;
        }, {
            source: string;
            also_card_content?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        include?: string[] | undefined;
        match_from_us?: {
            source: string;
            also_card_content?: boolean | undefined;
        } | undefined;
    }, {
        include?: string[] | undefined;
        match_from_us?: {
            source: string;
            also_card_content?: boolean | undefined;
        } | undefined;
    }>>;
    field_types_from_us: z.ZodOptional<z.ZodBoolean>;
    regex_cases: z.ZodOptional<z.ZodObject<{
        positive_on: z.ZodOptional<z.ZodNumber>;
        negative_on: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        positive_on?: number | undefined;
        negative_on?: number | undefined;
    }, {
        positive_on?: number | undefined;
        negative_on?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    sheet: string;
    include_general_valabile_within_filter: boolean;
    filter?: {
        tip_functionalitate?: string | undefined;
    } | undefined;
    buckets?: {
        include?: string[] | undefined;
        match_from_us?: {
            source: string;
            also_card_content?: boolean | undefined;
        } | undefined;
    } | undefined;
    field_types_from_us?: boolean | undefined;
    regex_cases?: {
        positive_on?: number | undefined;
        negative_on?: number | undefined;
    } | undefined;
}, {
    sheet: string;
    filter?: {
        tip_functionalitate?: string | undefined;
    } | undefined;
    include_general_valabile_within_filter?: boolean | undefined;
    buckets?: {
        include?: string[] | undefined;
        match_from_us?: {
            source: string;
            also_card_content?: boolean | undefined;
        } | undefined;
    } | undefined;
    field_types_from_us?: boolean | undefined;
    regex_cases?: {
        positive_on?: number | undefined;
        negative_on?: number | undefined;
    } | undefined;
}>;
export declare const Rules: z.ZodObject<{
    name: z.ZodString;
    flow: z.ZodArray<z.ZodObject<{
        sheet: z.ZodString;
        filter: z.ZodOptional<z.ZodObject<{
            tip_functionalitate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            tip_functionalitate?: string | undefined;
        }, {
            tip_functionalitate?: string | undefined;
        }>>;
        include_general_valabile_within_filter: z.ZodDefault<z.ZodBoolean>;
        buckets: z.ZodOptional<z.ZodObject<{
            include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            match_from_us: z.ZodOptional<z.ZodObject<{
                source: z.ZodString;
                also_card_content: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                source: string;
                also_card_content?: boolean | undefined;
            }, {
                source: string;
                also_card_content?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            include?: string[] | undefined;
            match_from_us?: {
                source: string;
                also_card_content?: boolean | undefined;
            } | undefined;
        }, {
            include?: string[] | undefined;
            match_from_us?: {
                source: string;
                also_card_content?: boolean | undefined;
            } | undefined;
        }>>;
        field_types_from_us: z.ZodOptional<z.ZodBoolean>;
        regex_cases: z.ZodOptional<z.ZodObject<{
            positive_on: z.ZodOptional<z.ZodNumber>;
            negative_on: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            positive_on?: number | undefined;
            negative_on?: number | undefined;
        }, {
            positive_on?: number | undefined;
            negative_on?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        sheet: string;
        include_general_valabile_within_filter: boolean;
        filter?: {
            tip_functionalitate?: string | undefined;
        } | undefined;
        buckets?: {
            include?: string[] | undefined;
            match_from_us?: {
                source: string;
                also_card_content?: boolean | undefined;
            } | undefined;
        } | undefined;
        field_types_from_us?: boolean | undefined;
        regex_cases?: {
            positive_on?: number | undefined;
            negative_on?: number | undefined;
        } | undefined;
    }, {
        sheet: string;
        filter?: {
            tip_functionalitate?: string | undefined;
        } | undefined;
        include_general_valabile_within_filter?: boolean | undefined;
        buckets?: {
            include?: string[] | undefined;
            match_from_us?: {
                source: string;
                also_card_content?: boolean | undefined;
            } | undefined;
        } | undefined;
        field_types_from_us?: boolean | undefined;
        regex_cases?: {
            positive_on?: number | undefined;
            negative_on?: number | undefined;
        } | undefined;
    }>, "many">;
    outputs: z.ZodDefault<z.ZodObject<{
        csv: z.ZodDefault<z.ZodBoolean>;
        md: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        csv: boolean;
        md: boolean;
    }, {
        csv?: boolean | undefined;
        md?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    flow: {
        sheet: string;
        include_general_valabile_within_filter: boolean;
        filter?: {
            tip_functionalitate?: string | undefined;
        } | undefined;
        buckets?: {
            include?: string[] | undefined;
            match_from_us?: {
                source: string;
                also_card_content?: boolean | undefined;
            } | undefined;
        } | undefined;
        field_types_from_us?: boolean | undefined;
        regex_cases?: {
            positive_on?: number | undefined;
            negative_on?: number | undefined;
        } | undefined;
    }[];
    outputs: {
        csv: boolean;
        md: boolean;
    };
}, {
    name: string;
    flow: {
        sheet: string;
        filter?: {
            tip_functionalitate?: string | undefined;
        } | undefined;
        include_general_valabile_within_filter?: boolean | undefined;
        buckets?: {
            include?: string[] | undefined;
            match_from_us?: {
                source: string;
                also_card_content?: boolean | undefined;
            } | undefined;
        } | undefined;
        field_types_from_us?: boolean | undefined;
        regex_cases?: {
            positive_on?: number | undefined;
            negative_on?: number | undefined;
        } | undefined;
    }[];
    outputs?: {
        csv?: boolean | undefined;
        md?: boolean | undefined;
    } | undefined;
}>;
export type Rules = z.infer<typeof Rules>;
