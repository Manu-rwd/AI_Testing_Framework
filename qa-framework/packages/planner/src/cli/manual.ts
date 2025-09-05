#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { repoRoot } from "../util/paths";
import { emitManualMd } from "../emitter/manual";
import { ManualEmitterInputSchema } from "@pkg/schemas/src";

function normalizeLf(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

async function main() {
  const argv = process.argv.slice(2);
  let inPath = "";
  let outManualMd = "";
  let templatePath: string | undefined = undefined;
  let verifyAgainst: string | undefined = undefined;

  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    const v = argv[i + 1];
    if (k === "--in" && typeof v === "string") inPath = v;
    if (k === "--out-manual-md" && typeof v === "string") outManualMd = v;
    if (k === "--manual-template" && typeof v === "string") templatePath = v;
    if (k === "--verify-against" && typeof v === "string") verifyAgainst = v;
  }

  if (!inPath) {
    console.error("--in <path-to-json> is required");
    process.exit(1);
  }

  const resolvedIn = path.resolve(repoRoot, inPath);
  const raw = await fs.readFile(resolvedIn, "utf8");
  const json = JSON.parse(raw);

  const parsed = ManualEmitterInputSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Schema validation failed:\n" + parsed.error.toString());
    process.exit(2);
  }

  const input = parsed.data;
  const output = await emitManualMd(input, { templatePath });

  const finalOutPath = outManualMd
    ? path.resolve(repoRoot, outManualMd)
    : path.resolve(repoRoot, `docs/modules/${input.module}_Manual.md`);

  await fs.mkdir(path.dirname(finalOutPath), { recursive: true });
  await fs.writeFile(finalOutPath, normalizeLf(output), { encoding: "utf8" as any });
  console.log(`Manual plan written → ${finalOutPath}`);

  if (verifyAgainst) {
    const expectedPath = path.resolve(repoRoot, verifyAgainst);
    const expected = (await fs.readFile(expectedPath, "utf8")).replace(/\r\n?/g, "\n");
    const { visibleDiff } = await import("../util/visibleDiff");
    const res = visibleDiff(output, expected);
    if (!res.ok) {
      console.error(res.message);
      process.exit(1);
    }
    console.log(`✅ Snapshot match: ${expectedPath}`);
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(3);
});


