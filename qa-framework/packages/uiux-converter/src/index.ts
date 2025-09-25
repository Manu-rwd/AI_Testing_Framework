#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import { promises as fs } from "fs";
import { convertPdfToMarkdownHtml } from "./convert.js";
import { normalizeMarkdown } from "./normalize.js";

export const program = new Command();

program
  .name("uiux-converter")
  .description("Convert UI/UX PDF to normalized Markdown (and optional HTML)")
  .option("--in <pdf>", "Input PDF path")
  .option("--out <md>", "Output Markdown path", "temp/uiux_guide.md")
  .option("--also-html", "Also write HTML output alongside MD", false)
  .option("--pandoc <path>", "Explicit path to pandoc binary")
  .option("--pdftohtml <path>", "Explicit path to pdftohtml binary")
  .action(async (opts) => {
    const inputPdf = opts.in as string | undefined;
    const outMd = (opts.out as string | undefined) ?? "temp/uiux_guide.md";
    const alsoHtml = Boolean(opts.alsoHtml);

    if (!inputPdf) {
      console.error("--in <pdf> is required");
      process.exit(2);
    }

    const inputAbs = path.resolve(process.cwd(), inputPdf);
    const outAbs = path.resolve(process.cwd(), outMd);

    try {
      const { mdPath } = await convertPdfToMarkdownHtml({
        inputPdfPath: inputAbs,
        outputMarkdownPath: outAbs,
        alsoHtml,
        pandocPath: opts.pandoc as string | undefined,
        pdftohtmlPath: opts.pdftohtml as string | undefined,
      });

      const raw = await fs.readFile(mdPath, "utf-8");
      const normalized = normalizeMarkdown(raw);
      await fs.writeFile(mdPath, normalized, "utf-8");
      console.log(`Converted and normalized → ${mdPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Conversion failed:", message);
      if (message.includes("No converter found")) {
        console.error(
          "Tip: Install pandoc or poppler-utils (pdftohtml). Example: Windows: install pandoc from GitHub releases or `choco install poppler`."
        );
      }
      process.exit(1);
    }
  });

export async function runCli(): Promise<void> {
  await program.parseAsync();
}

// ESM-friendly entry: run when executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("index.ts")) {
  runCli();
}


