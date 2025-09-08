export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
  level: IssueLevel;
  file: string;
  row?: number; // 1-based incl. header
  col?: number; // 1-based
  code: string;
  message: string;
}

export interface CsvContext {
  file: string;
  buffer: Buffer;
  text: string;            // raw text (as-is)
  hasBOM: boolean;
  eol: "CRLF" | "LF" | "MIXED" | "NONE";
  rows: string[][];
  header: string[];
}

export type RuleId =
  | "encoding-eol"
  | "header"
  | "compact-json"
  | "selectors"
  | "review-values"
  | "module-accesare-min10";

export type RuleFn = (ctx: CsvContext, opts: { module?: string }) => ValidationIssue[];

export interface ValidateResult {
  file: string;
  issues: ValidationIssue[];
}

export interface CliOptions {
  inputs: string[];
  rules?: RuleId[];
  format: "text" | "json";
  module?: string;
}



