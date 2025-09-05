import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { repoRoot } from "../src/util/paths";
import { ManualEmitterInputSchema } from "@pkg/schemas/src";
import { emitManualMd } from "../src/emitter/manual";
import { visibleDiff } from "../src/util/visibleDiff";

describe("manual_emitter", () => {
  it("renders exact template for acc-adaugare", async () => {
    const inputPath = path.join(repoRoot, "packages/planner/test/fixtures/manual/input.acc-adaugare.json");
    const expectedPath = path.join(repoRoot, "packages/planner/test/fixtures/manual/expected.acc-adaugare.md");
    const raw = await fs.readFile(inputPath, "utf8");
    const json = JSON.parse(raw);
    const parsed = ManualEmitterInputSchema.parse(json);
    const out = await emitManualMd(parsed);
    const expectedRaw = await fs.readFile(expectedPath, "utf8");
    const expected = expectedRaw.replace(/\r\n?/g, "\n");
    const res = visibleDiff(out, expected);
    if (!res.ok) throw new Error(res.message);
    expect(true).toBe(true);
  });
});


