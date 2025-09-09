import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { processOne } from "../src/review/extend_csv";

describe("review-extend-csv", () => {
  it("appends columns exactly once and is idempotent", async () => {
    const HERE = path.dirname(fileURLToPath(import.meta.url));
    const tmp = path.resolve(HERE, "tmp_review_tests/extend.csv");
    await fs.ensureDir(path.dirname(tmp));
    await fs.writeFile(tmp, "a,bucket\n1,BUCKET_A\n2,BUCKET_B\n", { encoding: "utf8" });
    const r1 = await processOne(tmp, { files: [tmp] } as any);
    expect(r1.changed).toBe(true);
    const t1 = await fs.readFile(tmp, "utf8");
    expect(t1).toMatch(/disposition,feasibility,selector_needs,parameter_needs,notes/);
    const r2 = await processOne(tmp, { files: [tmp], quiet: true } as any);
    expect(r2.changed).toBe(false);
    const t2 = await fs.readFile(tmp, "utf8");
    expect((t2.match(/disposition/g) || []).length).toBe(1);
  });
});


