/**
 * Selector preference:
 * 1) id: #id
 * 2) [data-testid]
 * 3) ARIA role + name fallback
 * Optionally pull defaults from a uiux.yaml-like structure passed in.
 */

export interface SelectorHint {
  id?: string;
  testid?: string;
  role?: string;
  name?: string;
}

export function preferSelector(hint: SelectorHint): string | undefined {
  if (hint?.id) return `#${hint.id}`;
  if (hint?.testid) return `[data-testid="${hint.testid}"]`;
  if (hint?.role && hint?.name) return `${hint.role}="${hint.name}"`;
  if (hint?.role) return hint.role!;
  return undefined;
}

