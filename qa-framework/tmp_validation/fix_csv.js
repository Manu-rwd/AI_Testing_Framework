const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "fixed_Accesare_Automation.csv");
fs.mkdirSync(path.dirname(out), { recursive: true });

const HEADER = [
  "module","tipFunctionalitate","bucket","narrative_ro","atoms",
  "selector_needs","selector_strategy","data_profile",
  "feasibility","source","confidence","rule_tags","notes",
  "review_disposition","feasibility","review_needs","review_notes","reviewer","reviewed_at"
];

const esc = (v) => {
  v = String(v);
  return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};

const CRLF = "\r\n";
const rows = [];
rows.push(HEADER.join(","));

const atomsJson = () => JSON.stringify({ setup: ["Open"], action: ["Click"], assert: ["See"] });
const dataProfile = (required) => required ? JSON.stringify({ required: [required] }) : JSON.stringify({});
const ruleTags = (tags) => JSON.stringify(tags);

// First data row
rows.push([
  "Accesare","Adaugare","Login","A narrative, with comma",
  atomsJson(),
  "needs-ids","data-testid-preferred",dataProfile("user"),
  "A","US","0.735",ruleTags(["auth","happy"]),"",
  "ok","H","","","qa","2025-09-07T12:00:00Z"
].map(esc).join(","));

for (let i = 1; i <= 12; i++) {
  const bucket = `M8-${i}`;
  const disp = (i % 6 === 1) ? "ok"
    : (i % 6 === 2) ? "needs-ids"
    : (i % 6 === 3) ? "needs-roles"
    : (i % 6 === 4) ? "needs-data"
    : (i % 6 === 5) ? "skip"
    : "ambiguous";
  const reviewNeeds = disp.startsWith("needs-") ? disp.split("-")[1] : "";
  const reviewNotes = disp === "ok" ? "Automatable" : (disp === "skip" ? "Out of scope" : "Needs prep");
  rows.push([
    "Accesare","Adaugare",bucket,"M8 review synthetic row",
    atomsJson(),
    "needs-ids","data-testid-preferred",dataProfile(null),
    "B","review","0.800",ruleTags(["m8"]),"M8 human review",
    disp,"H",reviewNeeds,reviewNotes,"m8-reviewer","2025-09-05T00:00:00Z"
  ].map(esc).join(","));
}

const content = "\uFEFF" + rows.join(CRLF) + CRLF;
fs.writeFileSync(out, content, { encoding: "utf8" });
console.log("WROTE", out);


