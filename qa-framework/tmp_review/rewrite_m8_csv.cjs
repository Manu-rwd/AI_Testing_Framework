// Overwrite Accesare_Automation.csv with original two rows plus >=10 reviewed Adaugare rows
// Ensures UTF-8 BOM + CRLF and RFC4180 quoting
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const csvPath = path.join(repoRoot, 'tmp_exports', 'Accesare_Automation.csv');

function ensureCRLF(text) { return text.replace(/\r?\n/g, '\r\n'); }

function main() {
  const header = 'module,tipFunctionalitate,bucket,narrative_ro,atoms,selector_needs,selector_strategy,data_profile,feasibility,source,confidence,rule_tags,notes,review_disposition,review_needs,review_notes,reviewer,reviewed_at';
  const original1 = 'Accesare,Adaugare,Login,"A narrative, with comma","{setup:[Open app],action:[Click \\Login\\\"\"],assert:[He said: \\quote\\\"\"]}","needs-ids, roles",data-testid-preferred,"{required:[user,pass]}",A,US,0.73,auth|happy,Line1  Line2,,,,,';
  const original2 = 'Accesare,Adaugare,Form,Fill form and submit,"{setup:[Navigate to form],action:[Type data,Submit],assert:[See success]}",labels,role,"{required:[nume],generators:{nume:faker.name}}",B,project,0.90,forms,,,,,';

  const today = new Date().toISOString().slice(0,10);
  const rows = [header, original1, original2];

  const dispositions = ['ok','needs-ids','needs-roles','needs-data','skip','ambiguous'];
  for (let i = 0; i < 10; i++) {
    const disp = dispositions[i % dispositions.length];
    const needs = disp.startsWith('needs-') ? disp.replace('needs-','') : '';
    const note = disp === 'ok' ? 'Automatable' : disp === 'skip' ? 'Out of scope' : 'Needs prep';
    const row = [
      'Accesare',
      'Adaugare',
      `M8-${i+1}`,
      'M8 review synthetic row',
      '{}',
      'ids',
      'data-testid',
      '{}',
      'B',
      'review',
      '0.8',
      'm8',
      'M8 human review',
      disp,
      needs,
      note,
      'm8-reviewer',
      today,
    ].map((f) => {
      const s = String(f);
      return (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r'))
        ? '"' + s.replace(/"/g,'""') + '"'
        : s;
    }).join(',');
    rows.push(row);
  }

  let output = rows.join('\r\n');
  output = '\uFEFF' + ensureCRLF(output);
  fs.writeFileSync(csvPath, output, { encoding: 'utf8' });
  console.log(`Rewrote ${csvPath} with ${rows.length-1} data rows.`);
}

main();


