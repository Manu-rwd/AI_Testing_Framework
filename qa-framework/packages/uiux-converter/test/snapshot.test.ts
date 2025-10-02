import { describe, it, expect } from "vitest";
import { execa } from "execa";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

const cwd = path.resolve(__dirname, "..", "..");
const input = "input/Ghid UIUX - Norme si bune practici 1.pdf";
const shouldSkip = !fssync.existsSync(path.join(cwd, input));

describe("uiux-converter idempotence", () => {
  it.skipIf(shouldSkip)("produces identical bytes on repeated runs", async () => {
    const out = "temp/uiux_guide.md";

    await execa("pnpm", ["uiux:convert", "--", "--in", input, "--out", out], { cwd });
    const first = await fs.readFile(path.join(cwd, out));

    await execa("pnpm", ["uiux:convert", "--", "--in", input, "--out", out], { cwd });
    const second = await fs.readFile(path.join(cwd, out));

    expect(Buffer.compare(first, second) === 0).toBe(true);
  });
});


