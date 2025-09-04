import fs from "node:fs";
import fse from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { TUSNormalized } from "./schema";

export async function writeNormalizedYaml(outPath: string, us: TUSNormalized) {
  await fse.ensureDir(path.dirname(outPath));
  const yaml = YAML.stringify(us);
  await fs.promises.writeFile(outPath, yaml, { encoding: "utf8" });
}

export async function writeGapsMd(outPath: string, md: string) {
  await fse.ensureDir(path.dirname(outPath));
  await fs.promises.writeFile(outPath, md, { encoding: "utf8" });
}


