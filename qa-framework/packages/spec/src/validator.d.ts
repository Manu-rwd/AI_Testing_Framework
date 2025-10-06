export type ValidateIssue = {
    line: number;
    kind: "section" | "tag" | "auth" | "format";
    msg: string;
    sample?: string;
};
export type ValidateResult = {
    ok: boolean;
    issues: ValidateIssue[];
    normalized?: string;
};
export declare function validateManual(md: string, opts?: {
    allowProvenance?: boolean;
    noAuthStandalone?: boolean;
}): ValidateResult;
export declare function formatManual(md: string, opts?: {
    stripProvenance?: boolean;
}): string;
