import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { repoRoot } from "../util/paths";
import { ManualEmitterInputSchema } from "@pkg/schemas/src";

export async function emitManualMd(input: unknown, options?: { templatePath?: string }): Promise<string> {
  const validated = ManualEmitterInputSchema.parse(input);
  const defaultTemplatePath = path.join(repoRoot, "docs/templates/manual/standard_v1.md.hbs");
  const templatePath = options?.templatePath ? path.resolve(repoRoot, options.templatePath) : defaultTemplatePath;
  const templateSource = await fs.readFile(templatePath, { encoding: "utf8" });
  const template = Handlebars.compile(templateSource, { noEscape: true, strict: true });
  const rendered = template(validated);
  const normalized = rendered.replace(/\r\n?/g, "\n");
  const withFinalNl = normalized.endsWith("\n") ? normalized : normalized + "\n";
  return withFinalNl;
}


