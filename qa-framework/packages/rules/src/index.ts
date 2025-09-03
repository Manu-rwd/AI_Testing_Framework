import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { Rules } from "./schema";

export function loadRules(filePath: string): Rules {
  const text = fs.readFileSync(filePath, "utf8");
  const raw = YAML.parse(text);
  return Rules.parse(raw);
}


