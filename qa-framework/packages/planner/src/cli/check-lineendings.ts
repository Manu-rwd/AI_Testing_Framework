#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as path from "node:path";

type Args = { paths: string[]; since?: string; exts: string[] };
function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const paths: string[] = [];
  const exts: string[] = [".md", ".mdx", ".ts", ".tsx", ".js", ".json", ".hbs", ".yaml", ".yml"];
  let since: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--paths") {
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) paths.push(argv[++i]);
    } else if (a === "--since") {
      since = argv[++i];
    } else if (a === "--exts") {
      const raw = argv[++i] ?? "";
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((e) => exts.push(e.startsWith(".") ? e : `.${e}`));
    }
  }
  return { paths, since, exts: Array.from(new Set(exts)) };
}

function gitListFiles(args: Args): string[] {
  const baseCmd = args.since
    ? ["git", "diff", "--name-only", "--diff-filter=ACMR", `${args.since}...HEAD`]
    : ["git", "ls-files"];
  const out = execSync(baseCmd.concat(args.paths).join(" "), { encoding: "utf8" });
  return out.split(/\r?\n/).filter(Boolean);
}

function looksBinary(buf: Buffer): boolean {
  return buf.includes(0);
}

function checkFile(fp: string): { ok: boolean; msg?: string } {
  const buf = readFileSync(fp);
  if (looksBinary(buf)) return { ok: true };
  const text = buf.toString("utf8");
  const hasCRLF = /\r\n/.test(text);
  const endsWithNL = text.endsWith("\n");
  if (hasCRLF || !endsWithNL) {
    const rel = fp.replace(/\\/g, "/");
    return { ok: false, msg: `Line-ending check failed: ${rel} (CRLF=${hasCRLF}, finalNL=${endsWithNL})` };
  }
  return { ok: true };
}

function main() {
  const args = parseArgs();
  const files = gitListFiles(args)
    .filter((fp) => args.exts.includes(path.extname(fp).toLowerCase()))
    .filter((fp) => {
      try {
        execSync(`git check-attr eol -- ${fp}`, { encoding: "utf8" });
        return true;
      } catch {
        return true;
      }
    });

  let failed = false;
  for (const f of files) {
    const res = checkFile(f);
    if (!res.ok) {
      failed = true;
      console.log(res.msg);
    }
  }
  if (failed) {
    console.error("Line-ending check failed.");
    process.exit(1);
  }
  console.log("Line-ending check passed.");
}
main();


