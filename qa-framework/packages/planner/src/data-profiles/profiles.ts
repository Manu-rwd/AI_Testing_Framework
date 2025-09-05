import type { FieldRule, ProfileId } from "./types.js";

export function inferGeneratorsFromFields(fields: FieldRule[]): string[] {
  const gens = new Set<string>();
  for (const f of fields) {
    const name = f.name.toLowerCase();
    if (f.type === "email" || /email/.test(name)) gens.add("faker.internet.email");
    else if (f.type === "password" || /parola|password/.test(name)) gens.add("faker.internet.password");
    else if (f.type === "phone" || /telefon|phone/.test(name)) gens.add("faker.phone.number");
    else if (/nume|name|full.?name/.test(name)) gens.add("faker.person.fullName");
    else if (/address|addr|adresa/.test(name)) gens.add("faker.location.streetAddress");
  }
  return Array.from(gens);
}

export function choosePrimaryProfile(bucket: string, feasibility: string, fields: FieldRule[]): ProfileId {
  const hard = ["C", "D", "E"].includes(String(feasibility).toUpperCase());
  const hasMaxLen = fields.some(f => typeof f.maxLen === "number");
  const hasRegex = fields.some(f => typeof f.regex === "string" && f.regex.length > 0);

  if (/login|auth/i.test(bucket)) return "minimal_valid";
  if (hard && hasRegex) return "invalid_regex";
  if (hasMaxLen && hard) return "edge_long";
  if (!hard && hasRegex) return "minimal_valid";
  return "edge_empty";
}


