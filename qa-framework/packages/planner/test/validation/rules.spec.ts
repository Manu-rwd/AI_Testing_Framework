import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { validateFile } from "../../src/validate/index.js";
import { MODULE5_HEADER, REVIEW_SUFFIX } from "../../src/validate/utils.js";

const BOM = "\ufeff";
const CRLF = "\r\n";

function mkHeader(withReview=false){
  const head = [...MODULE5_HEADER];
  if (withReview) head.push(...REVIEW_SUFFIX);
  return head.join(",") + CRLF;
}

function row(vals: string[]) {
  // quote fields with comma/quote/CRLF
  const esc = (v:string)=> {
    if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g,'""')}"`;
    return v;
  };
  return vals.map(esc).join(",") + CRLF;
}

async function writeTmp(name: string, content: string) {
  const dir = path.join(process.cwd(), "qa-framework", "tmp_validation");
  await fs.mkdir(dir, { recursive: true });
  const p = path.join(dir, name);
  await fs.writeFile(p, content, "utf8");
  return p;
}

describe("validation rules", () => {
  it("passes a correct CSV with review columns", async () => {
    const header = mkHeader(true);
    const atoms = JSON.stringify({ setup:["Open"], action:["Click"], assert:["See"] });
    const ruleTags = JSON.stringify(["auth","happy"]);
    const base = [
      "Accesare","Adaugare","Login","Narr",
      atoms,"needs-ids","data-testid-preferred",JSON.stringify({required:["user"]}),
      "A","US","0.735",ruleTags,"",
      "ok","High","","","qa","2025-09-07T12:00:00Z",
    ];
    const content = BOM + header + Array.from({length:10}).map(()=>row(base)).join("");
    const p = await writeTmp("good.csv", content);
    const res = await validateFile(p, undefined, { module: "Accesare" });
    expect(res.issues).toEqual([]);
  });

  it("fails on LF EOL and missing BOM", async () => {
    const header = mkHeader(false).replaceAll(CRLF, "\n"); // LF
    const content = header + row(["a","b","c","n","{}","needs-ids","role","{}", "A","US","0.1","[]","note"]).replaceAll(CRLF, "\n");
    const p = await writeTmp("bad_eol.csv", content);
    const res = await validateFile(p);
    expect(res.issues.some(i=>i.code==="E001")).toBe(true); // no BOM
    expect(res.issues.some(i=>i.code==="E002")).toBe(true); // LF
  });

  it("fails on header mismatch and non-compact JSON", async () => {
    const header = "module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,WRONG_COL,data_profile,feasibility,source,confidence,rule_tags,notes" + CRLF;
    const content = "\ufeff" + header + row([
      "Accesare","Adaugare","X","Y",
      "{ \"setup\": [\"Open\"], \"action\": [\"Click\"] }", // spaced (non-compact)
      "needs-ids","role","{}", "A","US","0.12345", // too many decimals
      "[ \"auth\" ]",""
    ]);
    const p = await writeTmp("bad_header_json.csv", content);
    const res = await validateFile(p);
    expect(res.issues.some(i=>i.code==="H001")).toBe(true);
    expect(res.issues.some(i=>i.code==="J001")).toBe(true);
    expect(res.issues.some(i=>i.code==="J003")).toBe(true);
  });
});



