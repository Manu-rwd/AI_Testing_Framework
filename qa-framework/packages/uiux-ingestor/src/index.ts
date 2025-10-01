import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import YAML from "yaml";
import matter from "gray-matter";
import { sha256OfString } from "./hash";
import { parseMarkdownSections } from "./parseMd";
import { mapSectionsToComponents } from "./mapToComponents";
import { UiuxSchema } from "./schema";

type Args = {
  project: string;
  in: string;
  out?: string;
};

function parseArgs(argv: string[]): Args {
  const args: any = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project") args.project = argv[++i];
    else if (a === "--in") args.in = argv[++i];
    else if (a === "--out") args.out = argv[++i];
  }
  if (!args.project) throw new Error("--project is required");
  args.in = args.in || "qa-framework/temp/uiux_guide.md";
  if (!args.out) args.out = join(args.project, "standards/uiux/uiux.yaml");
  return args as Args;
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n/g, "\n");
}

export async function runIngest(args: Args): Promise<{ outPath: string; guideHash: string; families: number }> {
  let inputPath = args.in;
  if (!args.out) {
    args.out = join(args.project, "standards/uiux/uiux.yaml");
  }
  if (!existsSync(inputPath)) {
    const pdf = "qa-framework/input/Ghid UIUX - Norme si bune practici 1.pdf";
    if (existsSync(pdf)) {
      await execa("pnpm", ["-C", "qa-framework", "uiux:convert", "--", "--in", pdf, "--out", "qa-framework/temp/uiux_guide.md"], { stdio: "inherit" });
      inputPath = "qa-framework/temp/uiux_guide.md";
    }
  }
  if (!existsSync(inputPath)) throw new Error(`Input not found: ${inputPath}`);

  const raw = readFileSync(inputPath, "utf8");
  const md = matter(raw).content; // ignore frontmatter if any
  const sections = await parseMarkdownSections(md);
  const components = mapSectionsToComponents(sections);
  const guideHash = sha256OfString(md);
  const doc = {
    source: "uiux_guide",
    guide_hash: guideHash,
    uiux_version: "1.0",
    generated_at: new Date().toISOString(),
    components
  };
  const parsed = UiuxSchema.parse(doc);

  // Deep sort object keys for deterministic YAML
  const sortObject = (o: any): any => {
    if (Array.isArray(o)) return o.map(sortObject);
    if (o && typeof o === "object") {
      return Object.keys(o)
        .sort()
        .reduce((acc: any, k) => {
          acc[k] = sortObject(o[k]);
          return acc;
        }, {});
    }
    return o;
  };

  const sorted = sortObject(parsed);
  const yaml = YAML.stringify(sorted, { sortMapEntries: true });
  const outPath = resolve(args.out!);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, normalizeNewlines(yaml), "utf8");

  const families = Object.values(sorted.components).filter((v: any) => {
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return !!v;
  }).length;

  return { outPath, guideHash, families };
}

async function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);
  const { outPath, guideHash, families } = await runIngest(parsed);
  console.log(outPath);
  console.log(String(families));
  console.log(guideHash);
}

// Run when executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // running as script
  main().catch(err => {
    console.error(err?.stack || String(err));
    process.exit(1);
  });
}


