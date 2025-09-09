import path from "node:path";
import fs from "fs-extra";
import YAML from "yaml";

type Source = "US" | "project" | "defaults";

export interface EdgeCase { name: string; value: string }

export interface DataProfile {
  minimal_valid: string;
  invalid_regex: string[];
  edge_cases: EdgeCase[];
  generators?: string[];
  source: Source;
  confidence: number;
}

export interface ProjectDataProfilesDoc {
  fields?: Record<string, Partial<DataProfile>>;
  defaults?: {
    minimal_valid_by_type?: Record<string, string>;
    invalid_regex_common?: string[];
    edge_cases_common?: EdgeCase[];
  };
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

function safeArray<T>(v: unknown, d: T[] = []): T[] { return Array.isArray(v) ? (v as T[]) : d; }

function defaultsRO(): ProjectDataProfilesDoc {
  return {
    fields: {
      nume: {
        minimal_valid: "A",
        invalid_regex: ["^\\s+$"],
        edge_cases: [
          { name: "empty", value: "" },
          { name: "whitespace", value: " " },
          { name: "unicode", value: "Ăîșțâ" },
        ],
        generators: ["faker.person.firstName"],
      },
      email: {
        minimal_valid: "a@b.ro",
        invalid_regex: ["\\s", "@@"],
        edge_cases: [
          { name: "missing_tld", value: "x@y" },
          { name: "plus_alias", value: "qa+test@exemplu.ro" },
          { name: "unicode_local", value: "îșț@exemplu.ro" },
        ],
        generators: ["faker.internet.email"],
      },
      telefon: {
        minimal_valid: "0712345678",
        invalid_regex: ["[^0-9]"],
        edge_cases: [
          { name: "too_short", value: "07123" },
          { name: "too_long", value: "071234567890" },
          { name: "boundary", value: "0799999999" },
        ],
      },
      cnp: {
        minimal_valid: "1800101221144",
        invalid_regex: ["[^0-9]", "^[0-9]{1,12}$", "^[0-9]{14,}$"],
        edge_cases: [
          { name: "all_same_digits", value: "1111111111111" },
          { name: "boundary", value: "2991231999999" },
          { name: "min_len", value: "123456789012" },
        ],
      },
      iban: {
        minimal_valid: "RO49AAAA1B31007593840000",
        invalid_regex: ["[^A-Z0-9]"],
        edge_cases: [
          { name: "lowercase", value: "ro49aaaa1b31007593840000" },
          { name: "whitespace", value: "RO49 AAAA1B31007593840000" },
          { name: "too_short", value: "RO49AAAA1B31" },
        ],
      },
    },
    defaults: {
      minimal_valid_by_type: { string: "a", integer: "1", date: "2024-01-01" },
      invalid_regex_common: ["^$", "^\\s+$"],
      edge_cases_common: [
        { name: "sql_like", value: "' OR 1=1 --" },
        { name: "xss_like", value: "<script>alert(1)</script>" },
      ],
    },
  };
}

function mergeProfile(base: Partial<DataProfile>, extra: Partial<DataProfile>): Partial<DataProfile> {
  return {
    minimal_valid: extra.minimal_valid ?? base.minimal_valid,
    invalid_regex: [...safeArray(base.invalid_regex), ...safeArray(extra.invalid_regex)],
    edge_cases: [...safeArray(base.edge_cases), ...safeArray(extra.edge_cases)],
    generators: [...safeArray(base.generators), ...safeArray(extra.generators)],
  };
}

export function resolveDataProfile(
  planRow: { narrative_ro?: string; data_profile?: any },
  projectPath?: string,
  usOverrides?: Record<string, Partial<DataProfile>>
): DataProfile {
  const projDoc: ProjectDataProfilesDoc = projectPath
    ? loadYamlMaybe(path.join(projectPath, "standards", "data_profiles.yaml")) ?? {}
    : {};
  const df = defaultsRO();

  const narrative = (planRow.narrative_ro || "").toLowerCase();
  const pickKey = () => {
    if (/email/.test(narrative)) return "email";
    if (/(cnp)/.test(narrative)) return "cnp";
    if (/(iban)/.test(narrative)) return "iban";
    if (/(telefon|tel)/.test(narrative)) return "telefon";
    if (/(nume|prenume)/.test(narrative)) return "nume";
    return "nume"; // sane default
  };

  const key = pickKey();
  const projectField = projDoc.fields?.[key] ?? {};
  const defaultField = df.fields?.[key] ?? {};
  const commonInvalid = projDoc.defaults?.invalid_regex_common ?? df.defaults?.invalid_regex_common ?? [];
  const commonEdge = projDoc.defaults?.edge_cases_common ?? df.defaults?.edge_cases_common ?? [];

  // Merge precedence: US > project > defaults
  const merged: Partial<DataProfile> = mergeProfile(defaultField as any, projectField as any);
  const usField = (usOverrides && usOverrides[key]) || {};
  const merged2: Partial<DataProfile> = mergeProfile(merged, usField);

  const minimal_valid = merged2.minimal_valid ?? (projDoc.defaults?.minimal_valid_by_type?.string || df.defaults?.minimal_valid_by_type?.string || "a");
  const invalid_regex = [...new Set([...(merged2.invalid_regex ?? []), ...commonInvalid])];
  const edge_cases = [...safeArray(merged2.edge_cases), ...commonEdge];
  const generators = merged2.generators && merged2.generators.length ? merged2.generators : undefined;

  const source: Source = usField && Object.keys(usField).length ? "US" : (projectPath ? "project" : "defaults");
  const confidence = source === "US" ? 0.95 : source === "project" ? 0.9 : 0.75;

  return { minimal_valid, invalid_regex, edge_cases, generators, source, confidence };
}


