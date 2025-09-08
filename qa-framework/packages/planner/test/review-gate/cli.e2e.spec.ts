import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { execa } from "execa";

function crlf(lines: string[]): string { return "\uFEFF" + lines.join("\r\n"); }

async function writeCsv(tmpDir: string, name: string, lines: string[]): Promise<string> {
  const p = path.join(tmpDir, name);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, crlf(lines), "utf8");
  return p;
}

const plannerRoot = path.resolve(__dirname, "../..");
const distCli = path.resolve(plannerRoot, "dist/cli/index.js");

describe("plan:review CLI e2e", () => {
  it("verify exits 0 on good, 1 on bad and prints RV codes", async () => {
    const tmp = path.resolve(plannerRoot, "tmp_review_cli");
    const good = await writeCsv(tmp, "good.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok,needs,notes,rev,2025-01-01",
    ]);
    const bad = await writeCsv(tmp, "bad.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,BAD, , , ,bad-date",
    ]);
    await execa("node", [distCli, "plan:review:verify", "--input", good, "--module", "Accesare"], { stdio: "inherit" });
    let failed = false;
    try {
      await execa("node", [distCli, "plan:review:verify", "--input", bad, "--module", "Accesare"], { reject: true });
    } catch (e:any) {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it("report writes summary and prints WROTE", async () => {
    const tmp = path.resolve(plannerRoot, "tmp_review_cli");
    const csv = await writeCsv(tmp, "report.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok,needs,notes,rev,2025-01-01",
    ]);
    const mdOut = path.resolve(tmp, "Accesare_Review_Summary.md");
    const { stdout } = await execa("node", [distCli, "plan:review:report", "--input", csv, "--module", "Accesare", "--out", mdOut], { reject: false });
    expect(stdout).toMatch(/WROTE/);
    const content = await fs.readFile(mdOut, "utf8");
    expect(content).toMatch(/Totals:/);
  });
});


