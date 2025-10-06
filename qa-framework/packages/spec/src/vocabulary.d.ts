import type { Tag } from "./types";
/** Canonical bucket → default tags to attach */
export declare const BUCKET_TAGS: Record<string, Tag[]>;
/** Auth policy: no standalone auth variants; encode as permission metadata on cases. */
export declare const AUTH_POLICY: {
    standaloneLines: boolean;
    permissions: string[];
};
