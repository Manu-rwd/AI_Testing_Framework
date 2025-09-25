import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
vi.mock("execa", () => ({ execa: vi.fn().mockResolvedValue({}) }));
import * as convert from "../src/convert";

describe("Converter logging", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    (console.log as any).mockRestore?.();
  });

  it("prefers pandoc for non-PDF inputs", async () => {
    // For .docx, prefer pandoc
    vi.spyOn(convert, "resolveTool").mockImplementation((name: any, explicit?: string) => {
      if (name === "pandoc") return explicit ?? "C:/bin/pandoc.exe";
      return null;
    });
    vi.spyOn(convert, "runPandocToMarkdown").mockResolvedValue();
    await convert.convertPdfToMarkdownHtml({
      inputPdfPath: "qa-framework/input/sample.docx",
      outputMarkdownPath: "qa-framework/temp/uiux_guide.md",
      alsoHtml: false,
      pandocPath: "C:/bin/pandoc.exe",
      resolvedPandocBin: "C:/bin/pandoc.exe",
    });
    expect((console.log as any).mock.calls.some((c: any) => String(c[0]).includes("Using pandoc at:"))).toBe(true);
  });

  it("prefers pdftohtml for PDF inputs", async () => {
    vi.spyOn(convert, "resolveTool").mockImplementation((name: any, explicit?: string) => {
      if (name === "pdftohtml") return explicit ?? "C:/bin/pdftohtml.exe";
      return null;
    });
    vi.spyOn(convert, "runPdftohtmlToHtml").mockResolvedValue();
    const fs = await import("fs");
    vi.spyOn(fs.promises, "readFile").mockResolvedValue("<html><body>ok</body></html>" as any);
    vi.spyOn(fs.promises, "writeFile").mockResolvedValue(void 0 as any);
    await convert.convertPdfToMarkdownHtml({
      inputPdfPath: "qa-framework/input/Ghid UIUX - Norme si bune practici 1.pdf",
      outputMarkdownPath: "qa-framework/temp/uiux_guide.md",
      alsoHtml: false,
      pdftohtmlPath: "C:/bin/pdftohtml.exe",
      resolvedPdftohtmlBin: "C:/bin/pdftohtml.exe",
    });
    expect((console.log as any).mock.calls.some((c: any) => String(c[0]).includes("Using pdftohtml at:"))).toBe(true);
  });
});


