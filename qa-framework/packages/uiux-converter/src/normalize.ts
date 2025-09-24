// Text normalization utilities for Markdown idempotence

export type NormalizeOptions = {
  dehyphenate: boolean;
  normalizeWhitespace: boolean;
  fixLists: boolean;
};

const DEFAULT_OPTIONS: NormalizeOptions = {
  dehyphenate: true,
  normalizeWhitespace: true,
  fixLists: true,
};

export function normalizeMarkdown(input: string, options: Partial<NormalizeOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options } as NormalizeOptions;
  let text = input;

  if (opts.dehyphenate) {
    // Merge hyphenated line-breaks: e.g., "infor-
    // mation" -> "information"
    text = text.replace(/([A-Za-zăâîșțĂÂÎȘȚ])\-\n([A-Za-zăâîșțĂÂÎȘȚ])/g, "$1$2");
  }

  if (opts.normalizeWhitespace) {
    // Normalize Windows line-endings to \n and trim trailing spaces
    text = text.replace(/\r\n?/g, "\n");
    text = text
      .split("\n")
      .map((line) => line.replace(/[\t ]+$/g, ""))
      .join("\n");
    // Collapse 3+ blank lines to max 2
    text = text.replace(/\n{3,}/g, "\n\n");
  }

  if (opts.fixLists) {
    // Ensure list bullets use "- " and have a space
    text = text.replace(/^(\s*)([•·▪◦‣])\s*/gm, "$1- ");
    text = text.replace(/^(\s*)([\-*+])(\S)/gm, "$1$2 $3");
    // Normalize ordered lists: "1.Thing" -> "1. Thing"
    text = text.replace(/^(\s*)(\d+\.)(\S)/gm, "$1$2 $3");
  }

  // Ensure UTF-8 diacritics are preserved by returning as-is; no ASCII folding
  return text;
}


