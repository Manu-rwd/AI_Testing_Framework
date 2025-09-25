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

  it("logs chosen pandoc path", async () => {
    // Force resolver to return our explicit path
    vi.spyOn(convert, "resolveTool").mockImplementation((name: any, explicit?: string) => {
      return name === "pandoc" ? (explicit ?? "C:/repo/tools/pandoc/pandoc.exe") : null;
    });
    vi.spyOn(convert, "runPandocToMarkdown").mockResolvedValue();
    await convert.convertPdfToMarkdownHtml({
      inputPdfPath: "qa-framework/input/Ghid UIUX - Norme si bune practici 1.pdf",
      outputMarkdownPath: "qa-framework/temp/uiux_guide.md",
      alsoHtml: false,
      pandocPath: "C:/repo/tools/pandoc/pandoc.exe",
      resolvedPandocBin: "C:/repo/tools/pandoc/pandoc.exe",
    });
    expect((console.log as any).mock.calls.some((c: any) => String(c[0]).includes("Using pandoc at:"))).toBe(true);
  });

  it("logs chosen pdftohtml path when pandoc missing", async () => {
    vi.spyOn(convert, "resolveTool").mockImplementation((name: any, explicit?: string) => {
      return name === "pdftohtml" ? (explicit ?? "C:/repo/tools/poppler/bin/pdftohtml.exe") : null;
    });
    vi.spyOn(convert, "runPdftohtmlToHtml").mockResolvedValue();
    const fs = await import("fs");
    vi.spyOn(fs.promises, "readFile").mockResolvedValue("<html><body>ok</body></html>" as any);
    vi.spyOn(fs.promises, "writeFile").mockResolvedValue(void 0 as any);
    await convert.convertPdfToMarkdownHtml({
      inputPdfPath: "qa-framework/input/Ghid UIUX - Norme si bune practici 1.pdf",
      outputMarkdownPath: "qa-framework/temp/uiux_guide.md",
      alsoHtml: false,
      pdftohtmlPath: "C:/repo/tools/poppler/bin/pdftohtml.exe",
      resolvedPdftohtmlBin: "C:/repo/tools/poppler/bin/pdftohtml.exe",
    });
    expect((console.log as any).mock.calls.some((c: any) => String(c[0]).includes("Using pdftohtml at:"))).toBe(true);
  });
});


