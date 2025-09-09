import path from "node:path";
import fs from "fs-extra";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { processOne } from "../../src/review/extend_csv";

const fixturesDir = path.join(process.cwd(), "packages", "planner", "test", "_fixtures", "review");
const tmpDir = path.join(process.cwd(), "packages", "planner", "test", "tmp_review_tests");

async function writeFixture(name: string, content: string) {
  const p = path.join(fixturesDir, name);
  await fs.ensureDir(fixturesDir);
  await fs.writeFile(p, content, { encoding: "utf8" });
  return p;
}

describe("review:extend library", () => {
  beforeAll(async () => {
    await fs.remove(tmpDir);
    await fs.mkdirp(tmpDir);
    await fs.remove(fixturesDir);
    await fs.mkdirp(fixturesDir);

    // simple.csv (comma)
    await writeFixture(
      "simple.csv",
      [
        "id,name",
        "1,Alpha",
        "2,Bravo",
        "",
      ].join("\r\n")
    );

    // semi.csv (semicolon)
    await writeFixture(
      "semi.csv",
      [
        "id;name",
        "1;John",
        "2;Jane",
        "",
      ].join("\r\n")
    );

    // bom.csv (with BOM)
    const bomContent = "\uFEFF" + ["id,name", "1,Foo"].join("\r\n");
    await fs.writeFile(path.join(fixturesDir, "bom.csv"), bomContent, { encoding: "utf8" });

    // preextended_partial.csv
    await writeFixture(
      "preextended_partial.csv",
      [
        "id,name,disposition,feasibility",
        "1,Alpha,a,A",
        "",
      ].join("\r\n")
    );

    // preextended_full.csv
    await writeFixture(
      "preextended_full.csv",
      [
        "id,name,disposition,feasibility,selector_needs,parameter_needs,notes",
        "1,Alpha,,,,",
        "",
      ].join("\r\n")
    );
  });

  afterAll(async () => {
    // keep tmpDir for inspection if needed
  });

  it("appends 5 review columns to simple.csv without altering existing cells", async () => {
    const src = path.join(fixturesDir, "simple.csv");
    const tmp = path.join(tmpDir, "simple.csv");
    await fs.copyFile(src, tmp);
    await processOne(tmp, { files: [], quiet: true } as any);
    const out = await fs.readFile(tmp, "utf8");
    const text = out.startsWith("\uFEFF") ? out.slice(1) : out;
    const lines = text.split(/\r\n/);
    expect(lines[0]).toBe("id,name,disposition,feasibility,selector_needs,parameter_needs,notes");
    expect(lines[1]).toBe("1,Alpha,,,,,");
  });

  it("preserves semicolon delimiter", async () => {
    const src = path.join(fixturesDir, "semi.csv");
    const tmp = path.join(tmpDir, "semi.csv");
    await fs.copyFile(src, tmp);
    await processOne(tmp, { files: [], quiet: true } as any);
    const out = await fs.readFile(tmp, "utf8");
    const text = out.startsWith("\uFEFF") ? out.slice(1) : out;
    const lines = text.split(/\r\n/);
    expect(lines[0]).toBe("id;name;disposition;feasibility;selector_needs;parameter_needs;notes");
    expect(lines[1]).toBe("1;John;;;;;");
  });

  it("preserves BOM on output if present", async () => {
    const tmp = path.join(tmpDir, "bom.csv");
    await fs.copyFile(path.join(fixturesDir, "bom.csv"), tmp);
    await processOne(tmp, { files: [], quiet: true } as any);
    const buf = await fs.readFile(tmp);
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
  });

  it("idempotent: running twice yields same result", async () => {
    const src = path.join(fixturesDir, "simple.csv");
    const tmp = path.join(tmpDir, "simple2.csv");
    await fs.copyFile(src, tmp);
    await processOne(tmp, { files: [], quiet: true } as any);
    const after1 = await fs.readFile(tmp, "utf8");
    await processOne(tmp, { files: [], quiet: true } as any);
    const after2 = await fs.readFile(tmp, "utf8");
    expect(after2).toEqual(after1);
  });

  it("skips write when all columns present (in-place)", async () => {
    const src = path.join(fixturesDir, "preextended_full.csv");
    const tmp = path.join(tmpDir, "preextended_full.csv");
    await fs.copyFile(src, tmp);
    const before = await fs.readFile(tmp, "utf8");
    await processOne(tmp, { files: [], quiet: true } as any);
    const after = await fs.readFile(tmp, "utf8");
    expect(after).toEqual(before);
  });
});


