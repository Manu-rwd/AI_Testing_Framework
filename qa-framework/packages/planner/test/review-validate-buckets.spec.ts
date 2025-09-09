import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { validateBucketsStrict } from "../src/review/validateBuckets";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = (p: string) => path.resolve(HERE, "fixtures/module8/", p);

describe("review-validate-buckets", () => {
  it("passes when CSV buckets are subset of US buckets", async () => {
    const csv = FIX("Accesare.csv");
    const us = FIX("US_Normalized.yaml");
    // filter out the row with BUCKET_C to be compliant
    const text = await fs.readFile(csv, "utf8");
    const lines = text.trimEnd().split(/\r?\n/);
    const ok = lines.filter((l) => !l.includes(",BUCKET_C,"));
    const tmp = path.resolve(process.cwd(), "packages/planner/test/tmp_validation/acc-ok.csv");
    await fs.ensureDir(path.dirname(tmp));
    await fs.writeFile(tmp, ok.join("\n"), { encoding: "utf8" });
    const res = await validateBucketsStrict({ csvPath: tmp, usPath: us });
    expect((res as any).ok).toBe(true);
  });

  it("fails when CSV includes a disallowed bucket, reporting rows and names", async () => {
    const csv = FIX("Accesare.csv");
    const us = FIX("US_Normalized.yaml");
    const res = await validateBucketsStrict({ csvPath: csv, usPath: us });
    expect((res as any).ok).toBe(false);
    const msg = (res as any).message as string;
    expect(msg).toMatch(/EȘEC|Esec|ESec/i);
    expect(msg).toMatch(/BUCKET_C/);
  });
});


