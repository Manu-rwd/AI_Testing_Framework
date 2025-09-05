export function normalizeLF(s: string) {
  return s.replace(/\r\n/g, "\n");
}

function showControlChars(s: string) {
  // Make trailing spaces and tabs visible, keep diacritics intact.
  return s
    .replace(/\t/g, "→\t")
    .replace(/(\s)$/u, "·"); // marks a single trailing space (last char)
}

export function visibleDiff(actual: string, expected: string): { ok: boolean; message?: string } {
  const a = normalizeLF(actual).split("\n");
  const e = normalizeLF(expected).split("\n");
  const max = Math.max(a.length, e.length);
  for (let i = 0; i < max; i++) {
    const ai = a[i] ?? "";
    const ei = e[i] ?? "";
    if (ai !== ei) {
      // Find first differing column (1-based)
      const len = Math.max(ai.length, ei.length);
      let col = 0;
      while (col < len && ai[col] === ei[col]) col++;
      const caret = " ".repeat(col) + "^";
      const msg =
        [
          "❌ Markdown differs at:",
          `  Line: ${i + 1}, Column: ${col + 1}`,
          "",
          "  Expected:",
          "  " + showControlChars(ei),
          "  Actual:",
          "  " + showControlChars(ai),
          "           " + caret,
          "",
          "Tip: Spaces (·), tabs (→), and exact newlines are significant.",
        ].join("\n");
      return { ok: false, message: msg };
    }
  }
  return { ok: true };
}


