export type ProfileId =
  | "minimal_valid"
  | "invalid_regex"
  | "edge_empty"
  | "edge_long"
  | "edge_unicode";

export interface FieldRule {
  name: string;
  type: "string" | "number" | "email" | "password" | "phone" | "date" | "other";
  regex?: string;
  minLen?: number;
  maxLen?: number;
}

export interface ProfileDecision {
  profile: ProfileId;
  generators?: string[]; // e.g. faker.* names
  provenance: "US" | "project" | "defaults";
  confidenceBump: number; // 0..0.02
}


