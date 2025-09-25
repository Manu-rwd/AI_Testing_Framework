import type { SelectorContext, SelectorKind } from "./types.js";

interface RankedKind { kind: SelectorKind; score: number }

const HINT_MAP: Record<string, SelectorKind> = {
  "ids": "data-testid",
  "data-testid": "data-testid",
  "role": "role",
  "roles": "role",
  "label": "label",
  "aria": "aria",
  "text": "text",
  "css": "css",
  "xpath": "xpath",
};

export function rankSelectorKinds(ctx: SelectorContext): RankedKind[] {
  const base: Record<SelectorKind, number> = {
    "data-testid": 0.9,
    "role": 0.8,
    "label": 0.7,
    "aria": 0.65,
    "text": 0.6,
    "css": 0.5,
    "xpath": 0.2,
  };

  // Apply policy order preference as incremental boosts
  const orderBoost = 0.05;
  (ctx.policy.order || []).forEach((k, idx) => {
    const boost = orderBoost * (ctx.policy.order.length - idx) / ctx.policy.order.length;
    base[k] = (base[k] ?? 0) + boost;
  });

  // Penalize disallowed
  for (const d of ctx.policy.disallow || []) {
    base[d] = (base[d] ?? 0) - 0.5;
  }

  // Boost hinted kinds from row hints
  if (ctx.rowHints) {
    const hints = ctx.rowHints.split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    for (const h of hints) {
      const kind = HINT_MAP[h];
      if (kind) base[kind] = (base[kind] ?? 0) + 0.2;
    }
  }

  // Convert to array and sort
  const arr = Object.entries(base).map(([k, score]) => ({ kind: k as SelectorKind, score: Number(score) }));
  arr.sort((a, b) => b.score - a.score);
  return arr;
}


