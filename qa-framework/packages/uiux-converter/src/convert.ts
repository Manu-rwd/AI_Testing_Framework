import { execa } from "execa";
import { promises as fs } from "fs";
import path from "path";

export type ConverterInput = {
  inputPdfPath: string;
  outputMarkdownPath: string;
  alsoHtml?: boolean;
};

async function binaryExists(command: string): Promise<boolean> {
  try {
    await execa(process.platform === "win32" ? "where" : "which", [command]);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function runPandocToMarkdown(inputPdfPath: string, outputMarkdownPath: string): Promise<void> {
  await ensureDirectory(outputMarkdownPath);
  await execa("pandoc", [
    "--from=pdf",
    "--to=gfm+tables+pipe_tables+raw_html",
    "--wrap=none",
    "--extract-media=./temp/uiux_media",
    inputPdfPath,
    "-o",
    outputMarkdownPath,
  ]);
}

export async function runPdftohtmlToHtml(inputPdfPath: string, outputHtmlPath: string): Promise<void> {
  await ensureDirectory(outputHtmlPath);
  await execa("pdftohtml", [
    "-c",
    "-noframes",
    "-s",
    inputPdfPath,
    outputHtmlPath,
  ]);
}

export async function convertPdfToMarkdownHtml(params: ConverterInput): Promise<{ mdPath: string; htmlPath?: string }> {
  const { inputPdfPath, outputMarkdownPath, alsoHtml } = params;

  const hasPandoc = await binaryExists("pandoc");
  const hasPdftohtml = await binaryExists("pdftohtml");

  if (!hasPandoc && !hasPdftohtml) {
    const installMsg = process.platform === "win32"
      ? "Install pandoc from `https://github.com/jgm/pandoc/releases` or install poppler (pdftohtml) via `choco install poppler` or `scoop install poppler`."
      : "Install pandoc (e.g., `brew install pandoc` on macOS, `apt-get install pandoc` on Debian/Ubuntu) or poppler-utils (pdftohtml).";
    throw new Error(
      `No converter found. Please install pandoc or pdftohtml. ${installMsg}`
    );
  }

  let htmlPath: string | undefined;

  if (hasPandoc) {
    await runPandocToMarkdown(inputPdfPath, outputMarkdownPath);
  } else if (hasPdftohtml) {
    // Fallback: produce HTML then convert to Markdown via Node side converter
    const tempHtml = path.join(path.dirname(outputMarkdownPath), "uiux_guide.html");
    await runPdftohtmlToHtml(inputPdfPath, tempHtml);
    htmlPath = tempHtml;
    const { NodeHtmlMarkdown } = await import("node-html-markdown");
    const html = await fs.readFile(tempHtml, "utf-8");
    const markdown = NodeHtmlMarkdown.translate(html, { keep: ["table", "tr", "td", "th"], bulletMarker: "-" });
    await ensureDirectory(outputMarkdownPath);
    await fs.writeFile(outputMarkdownPath, markdown, "utf-8");
  }

  if (alsoHtml && !htmlPath && hasPandoc) {
    // Also produce HTML via pandoc
    htmlPath = path.join(path.dirname(outputMarkdownPath), "uiux_guide.html");
    await execa("pandoc", [
      "--from=pdf",
      "--to=html",
      "--extract-media=./temp/uiux_media",
      inputPdfPath,
      "-o",
      htmlPath,
    ]);
  }

  return { mdPath: outputMarkdownPath, htmlPath };
}


