import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { verifyFile } from "../../src/review/verify.js";

function crlf(lines: string[]): string { return "\uFEFF" + lines.join("\r\n"); }

async function writeCsv(tmpDir: string, name: string, lines: string[]): Promise<string> {
  await fs.mkdir(tmpDir, { recursive: true });
  const p = path.join(tmpDir, name);
  await fs.writeFile(p, crlf(lines), "utf8");
  return p;
}

const plannerRoot = path.resolve(__dirname, "..\..");
const TMP = path.resolve(plannerRoot, "test/tmp_review_tests");

describe("Module 10 Review Verify", () => {
  it("Good 6-col tail → 0 issues", async () => {
    const file = await writeCsv(TMP, "good6.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,feasibility,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok,H,needs,notes,rev,2025-01-01",
    ]);
    const res = await verifyFile(file, "Accesare");
    expect(res.issues.length).toBe(0);
  });

  it("Good 5-col tail → 0 issues", async () => {
    const file = await writeCsv(TMP, "good5.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok,needs,notes,rev,2025-01-01",
    ]);
    const res = await verifyFile(file, "Accesare");
    expect(res.issues.length).toBe(0);
  });

  it("Bad disposition → RV002", async () => {
    const file = await writeCsv(TMP, "bad_disp.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,BAD,needs,notes,rev,2025-01-01",
    ]);
    const res = await verifyFile(file, "Accesare");
    expect(res.issues.some(i=>i.code==="RV002")).toBe(true);
  });

  it("Missing reviewer → RV003", async () => {
    const file = await writeCsv(TMP, "missing_reviewer.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok,needs,notes, ,2025-01-01",
    ]);
    const res = await verifyFile(file, "Accesare");
    expect(res.issues.some(i=>i.code==="RV003")).toBe(true);
  });

  it("Bad date → RV004", async () => {
    const file = await writeCsv(TMP, "bad_date.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok,needs,notes,rev,not-a-date",
    ]);
    const res = await verifyFile(file, "Accesare");
    expect(res.issues.some(i=>i.code==="RV004")).toBe(true);
  });

  it("Needs/notes required when disposition != OK → RV005", async () => {
    const file = await writeCsv(TMP, "needs_notes_required.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,needs-ids, , ,rev,2025-01-01",
    ]);
    const res = await verifyFile(file, "Accesare");
    expect(res.issues.some(i=>i.code==="RV005")).toBe(true);
  });

  it("--strict requires notes/needs for OK → RV006", async () => {
    const file = await writeCsv(TMP, "strict_ok.csv", [
      "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at",
      "Accesare,Adaugare,bk,desc,{},needs-ids,css,{},H,src,0.9,[],n,ok, , ,rev,2025-01-01",
    ]);
    const res = await verifyFile(file, "Accesare", { strict: true });
    expect(res.issues.some(i=>i.code==="RV006")).toBe(true);
  });
});


