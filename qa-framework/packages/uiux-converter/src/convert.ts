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

  const ext = path.extname(inputPdfPath).toLowerCase();
  const pandocBin = resolvedPandocBin ?? resolveTool("pandoc", pandocPath);
  const pdftohtmlBin = resolvedPdftohtmlBin ?? resolveTool("pdftohtml", pdftohtmlPath);

  // Flags are hard overrides: if user provided explicit pandocPath or pdftohtmlPath, prefer that tool
  let preferred: { tool: "pandoc" | "pdftohtml"; bin: string } | null = null;
  let fallback: { tool: "pandoc" | "pdftohtml"; bin: string } | null = null;

  if (pandocPath && pandocBin) {
    preferred = { tool: "pandoc", bin: pandocBin };
  } else if (pdftohtmlPath && pdftohtmlBin) {
    preferred = { tool: "pdftohtml", bin: pdftohtmlBin };
  } else {
    // No hard override, choose based on extension
    if (ext === ".pdf") {
      if (pdftohtmlBin) preferred = { tool: "pdftohtml", bin: pdftohtmlBin };
      if (pandocBin) fallback = { tool: "pandoc", bin: pandocBin };
    } else {
      if (pandocBin) preferred = { tool: "pandoc", bin: pandocBin };
      if (pdftohtmlBin) fallback = { tool: "pdftohtml", bin: pdftohtmlBin };
    }
  }

  if (!preferred && fallback) preferred = fallback;

  if (!preferred) {
    const installMsg = process.platform === "win32"
      ? "Install pandoc from `https://github.com/jgm/pandoc/releases` or install poppler (pdftohtml) via `choco install poppler` or `scoop install poppler`."
      : "Install pandoc (e.g., `brew install pandoc` on macOS, `apt-get install pandoc` on Debian/Ubuntu) or poppler-utils (pdftohtml).";
    throw new Error(
      `No converter found. Please install pandoc or pdftohtml. ${installMsg}`
    );
  }

  let htmlPath: string | undefined;

  if (preferred.tool === "pandoc") {
    console.log(`Using pandoc at: ${preferred.bin}`);
    await runPandocToMarkdown(preferred.bin, inputPdfPath, outputMarkdownPath);
  } else {
    console.log(`Using pdftohtml at: ${preferred.bin}`);
    // Fallback: produce HTML then convert to Markdown via Node side converter
    const tempHtml = path.join(path.dirname(outputMarkdownPath), "uiux_guide.html");
    await runPdftohtmlToHtml(preferred.bin, inputPdfPath, tempHtml);
    htmlPath = tempHtml;
    const { NodeHtmlMarkdown } = await import("node-html-markdown");
    const html = await fs.readFile(tempHtml, "utf-8");
    const markdown = NodeHtmlMarkdown.translate(html, { keep: ["table", "tr", "td", "th"], bulletMarker: "-" });
    await ensureDirectory(outputMarkdownPath);
    await fs.writeFile(outputMarkdownPath, markdown, "utf-8");
  }

  if (alsoHtml && !htmlPath && preferred.tool === "pandoc") {
    // Also produce HTML via pandoc
    htmlPath = path.join(path.dirname(outputMarkdownPath), "uiux_guide.html");
    await execa(preferred.bin, [
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


