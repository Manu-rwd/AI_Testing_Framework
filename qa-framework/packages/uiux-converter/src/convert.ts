import { execa } from "execa";
import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import which from "which";

export type ConverterInput = {
  inputPdfPath: string;
  outputMarkdownPath: string;
  alsoHtml?: boolean;
  pandocPath?: string;
  pdftohtmlPath?: string;
  // Testing or advanced usage: provide already-resolved binaries to skip detection
  resolvedPandocBin?: string;
  resolvedPdftohtmlBin?: string;
};

function fileExistsSync(p?: string): boolean {
  return !!p && fsSync.existsSync(p);
}

function exeName(name: string): string {
  return process.platform === "win32" ? `${name}.exe` : name;
}

function localToolCandidates(name: "pandoc" | "pdftohtml"): string[] {
  const cwd = process.cwd();
  const baseCandidates = [
    cwd,
    path.resolve(cwd, ".."),
    path.resolve(cwd, "../.."),
  ];
  const toolDirs: string[] = [];
  for (const base of baseCandidates) {
    const qaRoot = path.basename(base) === "qa-framework" ? base : path.join(base, "qa-framework");
    toolDirs.push(path.join(qaRoot, "tools"));
  }
  const results: string[] = [];
  for (const dir of Array.from(new Set(toolDirs))) {
    if (name === "pandoc") {
      results.push(path.join(dir, "pandoc", exeName("pandoc")));
    } else {
      results.push(path.join(dir, "poppler", "bin", exeName("pdftohtml")));
    }
  }
  return results;
}

export function resolveTool(
  name: "pandoc" | "pdftohtml",
  explicitPath?: string
): string | null {
  const candidates: string[] = [];
  if (explicitPath) {
    candidates.push(path.resolve(explicitPath));
  }
  for (const c of localToolCandidates(name)) {
    candidates.push(c);
  }
  const onPath = which.sync(name, { nothrow: true });
  if (onPath) {
    candidates.push(onPath);
  }
  for (const c of candidates) {
    if (fileExistsSync(c)) return c;
  }
  return null;
}

async function ensureDirectory(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function runPandocToMarkdown(pandocBin: string, inputPdfPath: string, outputMarkdownPath: string): Promise<void> {
  await ensureDirectory(outputMarkdownPath);
  await execa(pandocBin, [
    "--from=pdf",
    "--to=gfm+tables+pipe_tables+raw_html",
    "--wrap=none",
    "--extract-media=./temp/uiux_media",
    inputPdfPath,
    "-o",
    outputMarkdownPath,
  ]);
}

export async function runPdftohtmlToHtml(pdftohtmlBin: string, inputPdfPath: string, outputHtmlPath: string): Promise<void> {
  await ensureDirectory(outputHtmlPath);
  await execa(pdftohtmlBin, [
    "-c",
    "-noframes",
    "-s",
    inputPdfPath,
    outputHtmlPath,
  ]);
}

export async function convertPdfToMarkdownHtml(params: ConverterInput): Promise<{ mdPath: string; htmlPath?: string }> {
  const { inputPdfPath, outputMarkdownPath, alsoHtml, pandocPath, pdftohtmlPath, resolvedPandocBin, resolvedPdftohtmlBin } = params;

  const pandocBin = resolvedPandocBin ?? resolveTool("pandoc", pandocPath);
  const pdftohtmlBin = resolvedPdftohtmlBin ?? resolveTool("pdftohtml", pdftohtmlPath);

  if (!pandocBin && !pdftohtmlBin) {
    const installMsg = process.platform === "win32"
      ? "Install pandoc from `https://github.com/jgm/pandoc/releases` or install poppler (pdftohtml) via `choco install poppler` or `scoop install poppler`."
      : "Install pandoc (e.g., `brew install pandoc` on macOS, `apt-get install pandoc` on Debian/Ubuntu) or poppler-utils (pdftohtml).";
    throw new Error(
      `No converter found. Please install pandoc or pdftohtml. ${installMsg}`
    );
  }

  let htmlPath: string | undefined;

  if (pandocBin) {
    console.log(`Using pandoc at: ${pandocBin}`);
    await runPandocToMarkdown(pandocBin, inputPdfPath, outputMarkdownPath);
  } else if (pdftohtmlBin) {
    console.log(`Using pdftohtml at: ${pdftohtmlBin}`);
    // Fallback: produce HTML then convert to Markdown via Node side converter
    const tempHtml = path.join(path.dirname(outputMarkdownPath), "uiux_guide.html");
    await runPdftohtmlToHtml(pdftohtmlBin, inputPdfPath, tempHtml);
    htmlPath = tempHtml;
    const { NodeHtmlMarkdown } = await import("node-html-markdown");
    const html = await fs.readFile(tempHtml, "utf-8");
    const markdown = NodeHtmlMarkdown.translate(html, { keep: ["table", "tr", "td", "th"], bulletMarker: "-" });
    await ensureDirectory(outputMarkdownPath);
    await fs.writeFile(outputMarkdownPath, markdown, "utf-8");
  }

  if (alsoHtml && !htmlPath && pandocBin) {
    // Also produce HTML via pandoc
    htmlPath = path.join(path.dirname(outputMarkdownPath), "uiux_guide.html");
    await execa(pandocBin, [
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


