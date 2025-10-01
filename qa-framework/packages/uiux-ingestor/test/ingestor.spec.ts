import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { runIngest } from "../src/index";
import { UiuxSchema } from "../src/schema";

describe("uiux ingestor", () => {
  const tmp = mkdtempSync(join(tmpdir(), "uiux-ingestor-"));
  const project = join(tmp, "project");
  const out = join(project, "standards/uiux/uiux.yaml");

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
    rmSync(tmp, { recursive: true, force: true });
  });

  it("parses fixture and emits deterministic yaml", async () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const res = await runIngest({ project, in: join(here, "fixtures/uiux_sample.md") });
    expect(res.outPath).toBe(out);
    const yaml = readFileSync(out, "utf8").replace(/\r\n/g, "\n");
    // zod validation
    const parsed = UiuxSchema.parse(JSON.parse(JSON.stringify({ ... (await import("yaml")).parse(yaml) })));
    expect(parsed.source).toBe("uiux_guide");
    expect(parsed.guide_hash).toEqual(res.guideHash);
    expect(parsed.uiux_version).toBe("1.0");
    expect(new Date(parsed.generated_at).toISOString()).toBe("2024-01-01T00:00:00.000Z");
    // families count
    expect(res.families).toBeGreaterThanOrEqual(10);
    // snapshot stable
    expect(yaml).toMatchSnapshot();
  });

  it.skip("smoke: uses temp guide if present", async () => {
    // intentionally skipped in CI; relies on workspace temp file
  });
});


