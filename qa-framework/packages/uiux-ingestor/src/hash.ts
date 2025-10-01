import { createHash } from "node:crypto";

export function sha256OfString(input: string): string {
  const hasher = createHash("sha256");
  hasher.update(input, "utf8");
  return hasher.digest("hex");
}


