import { describe, it, expect } from "vitest";
import { SECTIONS, BUCKET_TAGS } from "../src";

describe("@pkg/spec vocabulary", () => {
  it("freezes sections in canonical order", () => {
    expect(SECTIONS).toEqual(["Vizualizare","Adăugare","Modificare","Ștergere","Activare"]);
  });
  it("contains stable bucket→tags mapping", () => {
    const keys = Object.keys(BUCKET_TAGS).sort();
    expect(keys).toContain("presence");
    expect(BUCKET_TAGS.presence).toEqual(["prezenta","container"]);
  });
});


