import { USNormalized, Confidence } from "./schema";

export interface ConfidenceWeights {
  fields: number;
  buckets: number;
  permissions: number;
  routes: number;
  messages: number;
  negatives: number;
}

export const DEFAULT_WEIGHTS: ConfidenceWeights = {
  fields: 0.35,
  buckets: 0.25,
  permissions: 0.15,
  routes: 0.10,
  messages: 0.10,
  negatives: 0.05,
};

export function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function computeConfidence(n: USNormalized, weights: ConfidenceWeights = DEFAULT_WEIGHTS): Confidence {
  const totalFields = n.fields.length;
  const fieldsWithType = n.fields.filter(f => !!f.type).length;
  const fieldsWithRegex = n.fields.filter(f => !!f.regex).length;
  const fieldsScore = totalFields === 0 ? 0 : clamp01(0.5 * (fieldsWithType / totalFields) + 0.5 * (fieldsWithRegex / totalFields));

  const bucketsScore = n.buckets.length > 0 ? 1 : 0;
  const permissionsScore = n.permissions.length > 0 ? 1 : 0;
  const routesScore = n.routes.length > 0 ? 1 : 0;
  const messagesCount = (n.messages.toasts?.length || 0) + (n.messages.errors?.length || 0) + (n.messages.empty_states?.length || 0);
  const messagesScore = messagesCount > 0 ? 1 : 0;
  const negativesScore = n.negatives.length > 0 ? 1 : 0;

  const per_section = {
    fields: fieldsScore,
    buckets: bucketsScore,
    permissions: permissionsScore,
    routes: routesScore,
    messages: messagesScore,
    negatives: negativesScore,
  };

  const overall =
    clamp01(
      per_section.fields * weights.fields +
      per_section.buckets * weights.buckets +
      per_section.permissions * weights.permissions +
      per_section.routes * weights.routes +
      per_section.messages * weights.messages +
      per_section.negatives * weights.negatives
    );

  return {
    per_section,
    overall,
    weights,
  };
}


