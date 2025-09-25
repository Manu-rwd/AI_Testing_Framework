import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { RulesV2Schema, type RulesV2 } from "@pkg/rules/v2/schema";
import { PlanV2Schema, type PlanV2, type PlanRowV2 } from "./types";
import { buildAAA } from "./aaa";
import { pickWithProvenance, bumpConfidence } from "./../v2/provenance";
import { assessFeasibility } from "./feasibility";
import { emitCSV, emitMarkdown } from "./emit";

type GenerateArgs = {
  type: string;
  rulesPath: string;
  usPath: string;
  projectPath?: string;
  buckets?: "strict" | "lax";
  applyProjectFallbacks?: boolean;
  outCsv?: string;
  outMd?: string;
  json?: boolean;
};

function loadYaml(file: string): any {
  const txt = fs.readFileSync(file, "utf8");
  return YAML.parse(txt);
}

function weightedMean(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

export async function generatePlanV2(args: GenerateArgs): Promise<PlanV2> {
  const {
    type,
    rulesPath,
    usPath,
    projectPath,
    buckets,
    applyProjectFallbacks = true,
    outCsv = `exports/Plan_${type}_v2.csv`,
    outMd = `docs/Plan_${type}_v2.md`,
    json = false,
  } = args;

  if (!(await fs.pathExists(rulesPath))) {
    throw new Error(`RulesV2 YAML not found: ${rulesPath}`);
  }
  if (!(await fs.pathExists(usPath))) {
    throw new Error(`US file not found: ${usPath}`);
  }

  const rules: RulesV2 = RulesV2Schema.parse(loadYaml(rulesPath));
  const us = loadYaml(usPath);
  const project = projectPath && (await fs.pathExists(projectPath)) ? loadObject(projectPath) : {};

  // buckets policy
  const effectiveBuckets = (() => {
    const usBuckets: string[] = Array.isArray(us?.buckets) ? us.buckets : [];
    if ((buckets ?? rules.buckets_policy) === "strict") return usBuckets.length ? usBuckets : ["General"];
    // lax: try to extend with project coverage if present
    const projBuckets: string[] = Array.isArray(project?.coverage?.buckets) ? project.coverage.buckets : [];
    const merged = new Set<string>([...usBuckets, ...projBuckets]);
    return merged.size ? Array.from(merged) : ["General"];
  })();

  // default selector strategy comes from rules
  const defaultSelectorStrategy = rules.selector_hints?.preferred ?? [];

  const rows: PlanRowV2[] = [];
  for (const bucket of effectiveBuckets) {
    // Narrative in RO
    const narrative_ro =
      type === "Adaugare"
        ? `Verifică fluxul de adăugare în bucket-ul ${bucket}.`
        : `Verifică fluxul de vizualizare în bucket-ul ${bucket}.`;

    const aaa = buildAAA(us, rules, bucket);

    // Selector needs: if preferred includes data-testid/role and US lacks hints, mark as needs
    const usSelectorHints: string[] = Array.isArray(us?.selector_strategy) ? us.selector_strategy : [];
    const missing = defaultSelectorStrategy.filter((p) => !usSelectorHints.includes(p));
    const selectorNeeds = missing;

    // Data profile
    const dpReq = rules.data_profile_hints?.required ?? [];
    const dpGen = rules.data_profile_hints?.generators ?? {};

    // Oracle selection
    const oracle = (rules.oracle_kinds && rules.oracle_kinds[0]) || "dom";

    // Provenance examples for fields/messages (US > Project > Defaults)
    const pFields = pickWithProvenance(us?.fields, project?.fields, []);
    const pMessages = pickWithProvenance(us?.messages, project?.messages, {});
    const usedProject = pFields.source === "project" || pMessages.source === "project";

    const baseConfidence: number =
      typeof us?.confidence?.overall === "number" ? us.confidence.overall : rules.min_confidence ?? 0.6;

    const row: PlanRowV2 = {
      module: type,
      tipFunctionalitate: type,
      bucket,
      narrative_ro,
      atoms: aaa,
      oracle_kind: oracle as any,
      selector_strategy: defaultSelectorStrategy as any,
      selector_needs: selectorNeeds,
      data_profile: { required: dpReq, generators: dpGen },
      feasibility: "C",
      source: pFields.source, // coarse source indicator
      provenance: {
        fields: { all: pFields.source },
        messages: { all: pMessages.source },
      },
      confidence: bumpConfidence(baseConfidence, applyProjectFallbacks && usedProject),
      rule_tags: rules.rule_tags ?? [],
      notes: undefined,
    };

    const feas = assessFeasibility(row, rules);
    row.feasibility = feas.tier;
    row.notes = feas.notes || row.notes;

    rows.push(row);
  }

  const plan: PlanV2 = { rows, overall_confidence: weightedMean(rows.map((r) => r.confidence)) };
  // Validate
  PlanV2Schema.parse(plan);

  // Emit side-effects unless only JSON requested
  if (!json) {
    await emitCSV(plan, outCsv);
    await emitMarkdown(plan, type, outMd);
  }

  return plan;
}

function loadObject(p: string): any {
  // Allow reading either a YAML file or a directory w/ standards
  if (fs.statSync(p).isFile()) {
    const ext = path.extname(p).toLowerCase();
    if (ext === ".yaml" || ext === ".yml") return loadYaml(p);
    if (ext === ".json") return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  // try conventional project pack structure
  const projYaml = path.join(p, "Project.yaml");
  if (fs.existsSync(projYaml)) return loadYaml(projYaml);
  return {};
}


