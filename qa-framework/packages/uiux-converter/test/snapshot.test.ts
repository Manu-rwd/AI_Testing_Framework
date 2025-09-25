import { describe, it, expect } from "vitest";
import { execa } from "execa";
import { promises as fs } from "fs";
import path from "path";

async function hasBinary(cmd: string): Promise<boolean> {
  try {
    await execa(process.platform === "win32" ? "where" : "which", [cmd]);
    return true;
  } catch {
    return false;
  }
}

describe("uiux-converter idempotence", () => {
  it("produces identical bytes on repeated runs", async () => {
    const hasPandoc = await hasBinary("pandoc");
    const hasPdftohtml = await hasBinary("pdftohtml");
    if (!hasPandoc && !hasPdftohtml) {
      return; // skip if no converter available
    }

    const cwd = path.resolve(__dirname, "../../.."); // qa-framework
    const input = "input/Ghid UIUX - Norme si bune practici 1.pdf";
    const out = "temp/uiux_guide.md";

    await execa("pnpm", ["uiux:convert", "--", "--in", input, "--out", out], { cwd });
    const first = await fs.readFile(path.join(cwd, out));
    await execa("pnpm", ["uiux:convert", "--", "--in", input, "--out", out], { cwd });
    const second = await fs.readFile(path.join(cwd, out));

    expect(Buffer.compare(first, second)).toBe(0);
  }, 120000);
});


