import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { USNormalized } from "./schema";
import { gapsMarkdown } from "./gaps";

export async function writeUSYaml(n: USNormalized, outPath: string) {
  const abs = path.resolve(outPath);
  await fs.ensureDir(path.dirname(abs));
  const doc = YAML.stringify(n);
  await fs.writeFile(abs, doc, { encoding: "utf8" });
  return abs;
}

export async function writeGapsMd(gaps: { message: string }[], outPath: string) {
  const abs = path.resolve(outPath);
  await fs.ensureDir(path.dirname(abs));
  const md = gapsMarkdown(gaps);
  await fs.writeFile(abs, md, { encoding: "utf8" });
  return abs;
}


