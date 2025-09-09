import path from "node:path";
import fs from "fs-extra";
import YAML from "yaml";

type Source = "US" | "project" | "defaults";

export interface SelectorStrategy {
  primary: string;
  fallbacks: string[];
  rationale: string;
  source: Source;
  confidence: number;
}

export interface SelectorResolution {
  selector_strategy: SelectorStrategy;
  selectors: string[]; // ordered, first is primary
  ordered: string[];   // ordered kinds preference (e.g., ["data-testid","role",...])
}

export interface ProjectPolicy {
  selector_strategy_preference?: {
    allow_text_selectors?: boolean;
    allow_nth_child?: boolean;
    prefer_role_over_label?: boolean;
  };
  use_project_fallbacks?: boolean;
  annotate_source?: boolean;
  buckets_mode?: "strict" | "lax";
  envs?: { shadow_dom?: boolean; frames?: boolean };
}

export interface ProjectSelectorStandards {
  priority?: string[];
  role_name_overrides?: Record<string, { role: string; name: string }>;
  stable_attributes?: string[];
  disallow?: string[];
}

function loadYamlMaybe(filePath: string): any {
  if (!fs.existsSync(filePath)) return undefined;
  const text = fs.readFileSync(filePath, "utf8");
  try {
    return YAML.parse(text);
  } catch {
    return undefined;
  }
}

function confidenceFor(kind: string): number {
  switch (kind) {
    case "data-testid": return 0.95;
    case "role": return 0.9;
    case "aria": return 0.85;
    case "label": return 0.8;
    case "placeholder": return 0.7;
    case "id":
    case "name": return 0.7;
    case "text": return 0.5;
    case "css": return 0.4;
    default: return 0.6;
  }
}

function isDisallowed(selector: string, disallow: string[] = []): boolean {
  return disallow.some((pat) => {
    try {
      if (pat.startsWith("/") && pat.endsWith("/")) {
        const re = new RegExp(pat.slice(1, -1));
        return re.test(selector);
      }
      return selector.includes(pat);
    } catch {
      return false;
    }
  });
}

function formatPrimary(kind: string, value: string): string {
  switch (kind) {
    case "data-testid":
      return `getByTestId('${value}')`;
    case "role":
      return `getByRole('${value}')`;
    case "aria":
      return `getByRole('*', { name: /${value}/i })`;
    case "label":
      return `getByLabelText(/${value}/i)`;
    case "placeholder":
      return `getByPlaceholderText(/${value}/i)`;
    case "id":
      return `locator('[id="${value}"]')`;
    case "name":
      return `locator('[name="${value}"]')`;
    case "text":
      return `getByText(/${value}/i)`;
    case "css":
      return `locator('${value}')`;
    default:
      return value;
  }
}

function deriveValueHint(narrative: string): { role?: { role: string; name?: string }; textHint?: string } {
  const lower = narrative.toLowerCase();
  if (/(salvare|adaug(ă|a)|trimite)/.test(lower)) {
    return { role: { role: "button", name: "(Salvare|Adaugă|Trimite)" } };
  }
  if (/(înapoi|anuleaz(ă|a))/.test(lower)) {
    return { role: { role: "link", name: "(Înapoi|Anulează)" } };
  }
  if (/(caut(ă|a)|căutare)/.test(lower)) {
    return { role: { role: "button", name: "(Caută|Căutare)" } };
  }
  // generic input label
  if (/(nume|email|telefon|cnp|iban|adres(ă|a)|dată)/.test(lower)) {
    return { textHint: lower.match(/(nume|email|telefon|cnp|iban|adresă|adresa|dată)/)?.[0] };
  }
  return {};
}

export function resolveSelectorStrategyFromProject(
  narrative_ro: string,
  projectPath?: string
): SelectorResolution {
  const projectPolicy: ProjectPolicy = projectPath
    ? loadYamlMaybe(path.join(projectPath, "Project.yaml")) ?? {}
    : {};
  const standards: ProjectSelectorStandards = projectPath
    ? loadYamlMaybe(path.join(projectPath, "standards", "selectors.yaml")) ?? {}
    : {};

  const priority = standards.priority ?? [
    "data-testid",
    "role",
    "aria",
    "label",
    "placeholder",
    "id",
    "name",
    "text",
    "css",
  ];
  const disallow = standards.disallow ?? [];
  const preferRoleOverLabel = Boolean(projectPolicy?.selector_strategy_preference?.prefer_role_over_label);
  const allowText = Boolean(projectPolicy?.selector_strategy_preference?.allow_text_selectors ?? true);
  const allowNthChild = Boolean(projectPolicy?.selector_strategy_preference?.allow_nth_child ?? false);

  const hint = deriveValueHint(narrative_ro);

  let chosenKind = "data-testid";
  let chosenSelector = "data-testid";
  let rationale = "Preferă data-testid conform standardelor";

  for (const kind of priority) {
    if (kind === "text" && !allowText) continue;
    if (kind === "css" && !allowNthChild) {
      // If later we generate an nth-child, skip
    }
    if (kind === "role" && hint.role) {
      chosenKind = "role";
      const name = hint.role.name ? `{ name: /${hint.role.name}/i }` : "{}";
      chosenSelector = `getByRole('${hint.role.role}', ${name})`;
      rationale = "Role + accessible name conform proiectului";
      break;
    }
    if (kind === "data-testid") {
      chosenKind = "data-testid";
      chosenSelector = `getByTestId('...')`;
      rationale = "data-testid preferat (stabile)";
      break;
    }
    if (kind === "label" && !preferRoleOverLabel && hint.textHint) {
      chosenKind = "label";
      chosenSelector = `getByLabelText(/${hint.textHint}/i)`;
      rationale = "Label-based conform accesibilității";
      break;
    }
    if (kind === "aria" && hint.role?.name) {
      chosenKind = "aria";
      chosenSelector = `getByRole('*', { name: /${hint.role.name}/i })`;
      rationale = "ARIA name potrivit";
      break;
    }
    if (kind === "placeholder" && hint.textHint) {
      chosenKind = "placeholder";
      chosenSelector = `getByPlaceholderText(/${hint.textHint}/i)`;
      rationale = "Placeholder ca fallback";
      break;
    }
    if ((kind === "id" || kind === "name") && (standards.stable_attributes || []).includes(kind)) {
      chosenKind = kind;
      chosenSelector = formatPrimary(kind, "...");
      rationale = `${kind} stabil conform standardelor`;
      break;
    }
    if (kind === "text" && hint.textHint) {
      chosenKind = "text";
      chosenSelector = `getByText(/${hint.textHint}/i)`;
      rationale = "Text selector (fragil)";
      break;
    }
    if (kind === "css") {
      chosenKind = "css";
      chosenSelector = `locator('css=[data-qa="..."]')`;
      rationale = "CSS ca ultim resort";
      break;
    }
  }

  // Build fallbacks from priority order
  const baseValue = hint.role?.name || hint.textHint || "...";
  const fallbacks: string[] = [];
  for (const kind of priority) {
    if (kind === chosenKind) continue;
    if (kind === "text" && !allowText) continue;
    const formatted = kind === "role" && hint.role
      ? `getByRole('${hint.role.role}', { name: /${hint.role.name}/i })`
      : formatPrimary(kind, baseValue);
    if (!isDisallowed(formatted, disallow)) {
      fallbacks.push(formatted);
    }
  }

  // Remove disallowed choices
  const selectorsOrdered = [chosenSelector, ...fallbacks].filter((s) => !isDisallowed(s, disallow));

  const source: Source = projectPath ? "project" : "defaults";
  let confidence = confidenceFor(chosenKind);
  if (source === "project" && Boolean(projectPolicy.use_project_fallbacks)) {
    confidence = Math.min(1, confidence + 0.03);
  }

  return {
    selector_strategy: {
      primary: chosenSelector.startsWith("getByRole") ? "getByRole" : chosenSelector.startsWith("getByTestId") ? "getByTestId" : chosenSelector.split("(")[0],
      fallbacks,
      rationale,
      source,
      confidence,
    },
    selectors: selectorsOrdered,
    ordered: priority,
  };
}

export function resolveSelectorStrategy(planRow: { narrative_ro?: string }, projectPath?: string): SelectorResolution {
  const narrative = planRow?.narrative_ro || "";
  return resolveSelectorStrategyFromProject(narrative, projectPath);
}


