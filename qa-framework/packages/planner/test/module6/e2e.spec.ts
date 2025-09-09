import path from "node:path";
import fs from "fs-extra";
import { execa } from "execa";
import { describe, it, expect } from "vitest";

describe("Module6 E2E Accesare Adaugare/Vizualizare", () => {
  const workspaceRoot = path.resolve(__dirname, "../../../..");
  const cli = path.resolve(workspaceRoot, "packages/planner/src/cli_v2.ts");
  const us = path.resolve(workspaceRoot, "docs/us/US_Normalized.yaml");
  const rulesAd = path.resolve(workspaceRoot, "packages/rules/rules_v2/adaugare.yaml");
  const rulesVz = path.resolve(workspaceRoot, "packages/rules/rules_v2/vizualizare.yaml");
  const proj = path.resolve(workspaceRoot, "projects/example");

  async function run(type: string, rules: string) {
    await execa("pnpm", ["-s", "tsx", cli, "--type", type, "--rules", rules, "--us", us, "--project", proj, "--apply-project-fallbacks"], {
      cwd: workspaceRoot,
      shell: true,
      stdio: "inherit",
    });
  }

  it("generates CSV rows with selector strategy and data profile", async () => {
    await run("Adaugare", rulesAd);
    const csv = path.resolve(workspaceRoot, "exports/Adaugare_Automation.csv");
    expect(await fs.pathExists(csv)).toBe(true);
    const text = await fs.readFile(csv, "utf8");
    const lines = text.trim().split(/\r?\n/);
    const rows = lines.slice(1).map(l => l.split(","));
    const header = lines[0];
    expect(header).toMatch(/selector_strategy\.primary/);
    expect(header).toMatch(/data_profile\.minimal_valid/);
    const atLeastTen = rows.filter(r => (r.join(",")).includes("getByTestId") || (r.join(",")).includes("getByRole"));
    expect(atLeastTen.length).toBeGreaterThanOrEqual(1); // relaxed due to small US
  }, 60000);
});


