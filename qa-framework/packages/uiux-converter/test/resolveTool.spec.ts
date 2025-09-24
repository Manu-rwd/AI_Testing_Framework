import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
vi.mock("fs");
vi.mock("which");
import * as convert from "../src/convert";
import fs from "fs";
import which from "which";

describe("resolveTool", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers explicit path when provided", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true as any);
    (which.sync as unknown as vi.Mock).mockReturnValue(null);
    const p = convert.resolveTool("pandoc", "C:/repo/qa-framework/tools/pandoc/pandoc.exe");
    const norm = String(p).replace(/\\/g, "/").toLowerCase();
    expect(norm).toContain("qa-framework/tools/pandoc/pandoc.exe");
  });

  it("falls back to repo-local path when explicit missing", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p: any) => {
      return typeof p === "string" && /tools[\\/]+pandoc[\\/]+pandoc(\.exe)?$/i.test(p);
    });
    (which.sync as unknown as vi.Mock).mockReturnValue(null);
    const p = convert.resolveTool("pandoc");
    expect(p).toBeTruthy();
    expect(String(p)).toMatch(/tools[\\/]+pandoc[\\/]+pandoc/i);
  });

  it("uses PATH entry when neither explicit nor local exist", () => {
    vi.spyOn(fs, "existsSync").mockImplementation((p: any) => {
      return String(p).toLowerCase().includes("c:/bin/pandoc.exe");
    }) as any;
    (which.sync as unknown as vi.Mock).mockReturnValue("C:/bin/pandoc.exe");
    const p = convert.resolveTool("pandoc");
    expect(p).toEqual("C:/bin/pandoc.exe");
  });

  it("returns null when nothing is found", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false as any);
    (which.sync as unknown as vi.Mock).mockReturnValue(null);
    const p = convert.resolveTool("pdftohtml");
    expect(p).toBeNull();
  });
});


