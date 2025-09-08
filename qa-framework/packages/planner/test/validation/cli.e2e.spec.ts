import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execa } from "execa";

const BOM = "\ufeff";
const CRLF = "\r\n";

function row(vals: string[]) {
  const esc = (v:string)=>(/[",\r\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v);
  return vals.map(esc).join(",") + CRLF;
}

async function writeGoodCsv() {
  const header = [
    "module","tipFunctionalitate","bucket","narrative_ro","atoms",
    "selector_needs","selector_strategy","data_profile",
    "feasibility","source","confidence","rule_tags","notes",
    "review_disposition","feasibility","review_needs","review_notes","reviewer","reviewed_at",
  ].join(",") + CRLF;

  const atoms = JSON.stringify({ setup:["Open"], action:["Click"], assert:["See"] });
  const ruleTags = JSON.stringify(["auth","happy"]);
  const base = [
    "Accesare","Adaugare","Login","Narr",
    atoms,"needs-ids","data-testid-preferred",JSON.stringify({required:["user"]}),
    "A","US","0.735",ruleTags,"",
    "ok","H","","","qa","2025-09-07T12:00:00Z",
  ];
  const body = Array.from({length:10}).map(()=>row(base)).join("");
  const dir = path.join(process.cwd(), "tmp_validation");
  await fs.mkdir(dir, { recursive: true });
  const p = path.join(dir, "good_e2e.csv");
  await fs.writeFile(p, BOM + header + body, "utf8");
  return p;
}

async function writeBadCsv() {
  // LF and missing review columns
  const header = [
    "module","tipFunctionalitate","bucket","narrative_ro","atoms",
    "selector_needs","selector_strategy","data_profile",
    "feasibility","source","confidence","rule_tags","notes",
  ].join(",") + "\n";
  const p = path.join(process.cwd(), "tmp_validation", "bad_e2e.csv");
  await fs.writeFile(p, header + row(["A","Adaugare","B","N","{}","needs-ids","role","{}","A","US","0.1","[]",""]), "utf8");
  return p;
}

describe("plan:validate CLI", () => {
  it("prints OK on good CSV and fails on bad CSV", async () => {
    const good = await writeGoodCsv();
    const bad = await writeBadCsv();

    const cli = path.join(process.cwd(), "dist", "cli", "index.js");
    // good (should exit 0)
    await execa("node", [cli, "plan:validate", "--input", good, "--module", "Accesare"]);

    // bad (should exit 1)
    let failed = false;
    try {
      await execa("node", [cli, "plan:validate", "--input", bad, "--module", "Accesare"]);
    } catch (e:any) {
      failed = true;
      expect(e.exitCode).toBe(1);
      expect(String(e.stdout || e.message)).toMatch(/E001|E002|H002|Totals/);
    }
    expect(failed).toBe(true);
  });
});


