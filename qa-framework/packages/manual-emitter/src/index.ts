#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { emitManualMarkdown } from "./emit";
import type { MergedPlan } from "./types";
import { validateManual, formatManual } from "@pkg/spec";

const program = new Command();
program
  .name("manual-emit")
  .description("Emit Romanian manual QA Markdown with strict parity")
  .requiredOption("--in <path>", "Merged plan JSON")
  .option("--out <path>", "Output Markdown", "docs/modules/Manual_Strict.md")
  .option("--filter-tip <name>", "Filter by Tip functionalitate", "")
  .option("--include-general-only", "Include only rows where General valabile = 1", false)
  .option("--title <text>", "Document title", "Plan de testare — Manual (strict parity)")
  .option("--strict-spec", "Validate against canonical spec", false)
  .option("--no-provenance", "Strip provenance comments before writing", false)
  .option("--compat-auth-standalone", "Emit auth standalone lines for coverage compatibility", false)
  .option("--qa-style", "Emit QA-style numbered cases and strip provenance", false)
  .action((opts) => {
    const inPath = path.resolve(process.cwd(), opts.in);
    if (!fs.existsSync(inPath)) {
      console.error(`Input not found: ${inPath}`);
      process.exit(2);
    }
    const raw = fs.readFileSync(inPath, "utf8");
    const json = JSON.parse(raw) as MergedPlan;
    let md = emitManualMarkdown(json, {
      filterTip: opts.filterTip || null,
      includeGeneralOnly: !!opts.includeGeneralOnly,
      title: opts.title,
      compatAuthStandalone: !!opts.compatAuthStandalone,
      qaStyle: !!opts.qaStyle,
      removeProvenance: !!(opts.noProvenance || opts.qaStyle)
    });

    // Normalize and optionally strip provenance
    md = formatManual(md, { stripProvenance: !!(opts.noProvenance || opts.qaStyle) });

    if (opts.strictSpec) {
      const vr = validateManual(md);
      if (!vr.ok) {
        console.error("Spec validation failed:\n" + vr.issues.map(i => `${i.line}:${i.kind}: ${i.msg}${i.sample?`\n  ${i.sample}`:""}`).join("\n"));
        process.exit(3);
      }
    }

    const outPath = path.resolve(process.cwd(), opts.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, md, { encoding: "utf8" });
    console.log(outPath);
  });

program.parse(process.argv);


