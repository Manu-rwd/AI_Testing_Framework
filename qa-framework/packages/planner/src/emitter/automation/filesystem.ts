import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDirForFile(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeFileAtomic(filePath: string, data: Buffer | string): Promise<void> {
  const tempPath = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.writeFile(tempPath, data);
  await fs.rename(tempPath, filePath).catch(async () => {
    // If rename fails due to cross-device or existing file, replace
    await fs.rm(filePath, { force: true }).catch(() => {});
    await fs.rename(tempPath, filePath);
  });
}


