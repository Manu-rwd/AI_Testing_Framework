export type ParsedUS = {
  buckets: string[];
  permissions: string[];
  fields: { name: string; type?: string; regex?: string }[];
};

export function parseUS(text: string): ParsedUS {
  const buckets: string[] = [];
  if (/tabel/i.test(text)) buckets.push("Tabel");
  if (/formular/i.test(text)) buckets.push("Formular");

  const permissions = Array.from(text.matchAll(/permisiun[ae]\s*:\s*([^\n]+)/gi)).map(m => m[1].trim());

  const fields: ParsedUS["fields"] = [];
  const fieldRegex = /camp\s*([\wăîâșțA-Z0-9_ ]+)(?:\s*\(([^)]+)\))?\s*:\s*regex\s*=?\s*([^\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = fieldRegex.exec(text))) {
    fields.push({ name: m[1].trim(), type: m[2]?.trim(), regex: m[3].trim() });
  }

  return { buckets: Array.from(new Set(buckets)), permissions, fields };
}


