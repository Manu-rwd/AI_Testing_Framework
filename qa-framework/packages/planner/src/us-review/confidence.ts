import { TUSNormalized } from "./schema";

export type Weights = {
  fields: number; buckets: number; permissions: number; routes: number; messages: number; negatives: number;
};

const DEFAULT_WEIGHTS: Weights = { fields: 0.35, buckets: 0.25, permissions: 0.15, routes: 0.10, messages: 0.10, negatives: 0.05 };

export function computeConfidence(us: TUSNormalized, weights: Partial<Weights> = {}): TUSNormalized {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const per: Record<string, number> = {};

  const fieldCount = us.fields.length;
  const fieldsWithRegex = us.fields.filter(f => !!f.regex).length;
  per.fields = fieldCount === 0 ? 0 : Math.min(1, 0.5 + 0.5 * (fieldsWithRegex / fieldCount));

  per.buckets = us.buckets.length > 0 ? 1 : 0;
  per.permissions = us.permissions.length > 0 ? 1 : 0;
  per.routes = us.routes.length > 0 ? 1 : 0;

  const msgParts = [
    us.messages.toasts.length > 0 ? 1 : 0,
    us.messages.errors.length > 0 ? 1 : 0,
    us.messages.empty_states.length > 0 ? 1 : 0,
  ];
  per.messages = msgParts.reduce((a, b) => a + b, 0) / msgParts.length;

  per.negatives = us.negatives.length > 0 ? 1 : 0;

  const overall =
    per.fields * w.fields +
    per.buckets * w.buckets +
    per.permissions * w.permissions +
    per.routes * w.routes +
    per.messages * w.messages +
    per.negatives * w.negatives;

  us.confidence = {
    per_section: per,
    overall: Number(overall.toFixed(3)),
    weights: w as any,
  };

  return us;
}


