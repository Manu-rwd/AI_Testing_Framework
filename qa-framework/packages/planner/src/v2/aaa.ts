import { tmplMany } from "./templating";
import type { RulesV2 } from "@pkg/rules/v2/schema";

type US = Record<string, any>;

function pickSampleField(us: US) {
  const fields: any[] = us?.fields ?? [];
  if (fields.length === 0) return undefined;
  // Prefer a field that has a regex or example
  return fields.find(f => f.regex || f.example) ?? fields[0];
}

export function buildAAA(us: US, rules: RulesV2, bucket: string) {
  const field = pickSampleField(us) ?? { name: "valoare", example: "exemplu" };
  const ctx = {
    field,
    fields: us?.fields ?? [],
    routes: us?.routes ?? {},
    messages: us?.messages ?? {},
    assumptions: us?.assumptions ?? [],
    bucket,
  };

  return {
    setup: tmplMany(rules.aaa_templates.setup ?? [], ctx),
    action: tmplMany(rules.aaa_templates.action ?? [], ctx),
    assert: tmplMany(rules.aaa_templates.assert ?? [], ctx),
  };
}


