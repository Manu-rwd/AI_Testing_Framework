export type Source = "us" | "project" | "defaults";

export function pickWithProvenance<T>(
  usVal: T | undefined,
  projectVal: T | undefined,
  defaultVal: T | undefined
): { value: T | undefined; source: Source } {
  if (usVal !== undefined) return { value: usVal, source: "us" };
  if (projectVal !== undefined) return { value: projectVal, source: "project" };
  return { value: defaultVal, source: "defaults" };
}

export function bumpConfidence(base: number, usedFallback: boolean): number {
  // Bump +0.05 when project/defaults filled a gap; cap at 1.0
  const inc = usedFallback ? 0.05 : 0;
  return Math.min(1, base + inc);
}


