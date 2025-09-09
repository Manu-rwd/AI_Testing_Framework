import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { buildMarkdownFragment, upsertAccesareDoc } from "../src/review/report";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = (p: string) => path.resolve(HERE, "fixtures/module8/", p);

describe("review-report", () => {
  it("builds histograms and appends changelog entry without overwriting", async () => {
    const csv = FIX("Accesare.csv");
    const tmpDoc = path.resolve(process.cwd(), "packages/planner/test/tmp_review_tests/Accesare.md");
    await fs.ensureDir(path.dirname(tmpDoc));
    await fs.writeFile(tmpDoc, "# Accesare (Adăugare)\n\n## Status\n\nStatus: În curs\n\n## Changelog\n\n", { encoding: "utf8" });
    const fragment = await buildMarkdownFragment(csv, "Verified");
    await upsertAccesareDoc(tmpDoc, fragment, true);
    const after = await fs.readFile(tmpDoc, "utf8");
    expect(after).toMatch(/## Changelog/);
    expect(after).toMatch(/Distribuție Dispoziții/);
    expect(after).toMatch(/Distribuție Fezabilitate/);
    expect(after).toMatch(/Status: Approved/);
    // Append again should not delete previous content
    const fragment2 = await buildMarkdownFragment(csv, "Verified");
    await upsertAccesareDoc(tmpDoc, fragment2, true);
    const again = await fs.readFile(tmpDoc, "utf8");
    const count = (again.match(/Distribuție Dispoziții/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});


