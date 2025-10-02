#!/usr/bin/env node
import { Command } from "commander";
import { deepMerge } from "./merge";
import fs from "node:fs";
import path from "node:path";

const program = new Command();

program
  .name("merge-plan")
  .description("Deterministically merge sources into a single plan with provenance")
  .option("--project <path>", "Project directory (for context)", "./projects/example")
  .option("--us <path>", "User story normalized file", "input/us_and_test_cases.txt")
  .option("--uiux <path>", "UI/UX guide JSON/YAML", "")
  .option("--coverage <path>", "Coverage overlay JSON", "")
  .option("--defaults <path>", "Defaults JSON", "")
  .option("--out <path>", "Output JSON", "temp/merged_plan.json")
  .action((opts: any) => {
    const inObj: any = {};
    function readMaybe(p: string) {
      if (!p) return undefined;
      const full = path.resolve(process.cwd(), p);
      if (!fs.existsSync(full)) return undefined;
      const raw = fs.readFileSync(full, "utf8");
      try {
        return JSON.parse(raw);
      } catch {
        // allow txt as pseudo input (store as blob)
        return { text: raw };
      }
    }

    inObj.defaults = readMaybe(opts.defaults);
    inObj.coverage = readMaybe(opts.coverage);
    inObj.uiux = readMaybe(opts.uiux);
    inObj.project = opts.project ? { path: opts.project } : undefined;
    inObj.us = readMaybe(opts.us);

    const merged = deepMerge(inObj);
    const outPath = path.resolve(process.cwd(), opts.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), { encoding: "utf8" });
    // print absolute path for convenience
    console.log(outPath);
  });

program.parse(process.argv);

