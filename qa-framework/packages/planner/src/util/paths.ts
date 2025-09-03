import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function findRepoRootFrom(dir: string): string {
  let current: string = dir;
  while (true) {
    const marker = path.join(current, "pnpm-workspace.yaml");
    if (fs.existsSync(marker)) return current;
    const parent = path.dirname(current);
    if (parent === current) return dir; // fallback
    current = parent;
  }
}

const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot: string = findRepoRootFrom(currentFileDir);


