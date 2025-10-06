#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function normalize(s) {
  return (s||'')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .toLowerCase()
    .replace(/\s+/g,' ')
    .trim();
}

function readQaGold(file) {
  const txt = fs.readFileSync(file,'utf8');
  const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  // lines like: "01. Narrative {attrs}"
  return lines.map(l => {
    const m = l.match(/^\d+\.\s*(.+?)(?:\s*\{[^}]*\})?$/);
    const narr = m ? m[1] : l;
    return normalize(narr);
  });
}

function readManualAsQa(file) {
  const txt = fs.readFileSync(file,'utf8');
  const out = [];
  const bucketLine = /^-\s*\[(?!overlay)[^\]]+\]\s*([^\{\n]+?)(?:\s*\{[^}]*\})?\s*$/; // skip overlays
  const enumLine = /^\d+\.\s*([^\{\n]+?)(?:\s*\{[^}]*\})?\s*$/; // QA-enumerated style
  for (const raw of txt.split(/\r?\n/)) {
    const m1 = raw.match(bucketLine);
    if (m1) { out.push(normalize(m1[1].trim())); continue; }
    const m2 = raw.match(enumLine);
    if (m2) { out.push(normalize(m2[1].trim())); continue; }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const goldIdx = args.indexOf('--gold');
  const manIdx = args.indexOf('--manual');
  if (goldIdx<0 || manIdx<0 || !args[goldIdx+1] || !args[manIdx+1]) {
    console.error('Usage: node tools/qa_compare.mjs --gold "manual_output/Qa team generated test cases.txt" --manual manual_output/<Generated_Manual>.md [--threshold 0.95]');
    process.exit(2);
  }
  const thrIdx = args.indexOf('--threshold');
  const threshold = thrIdx>=0 && args[thrIdx+1] ? Number(args[thrIdx+1]) : 0.95;
  const goldFile = path.resolve(args[goldIdx+1]);
  const manualFile = path.resolve(args[manIdx+1]);
  if (!fs.existsSync(goldFile)) { console.error('Gold file not found: '+goldFile); process.exit(2); }
  if (!fs.existsSync(manualFile)) { console.error('Manual file not found: '+manualFile); process.exit(2); }

  const gold = readQaGold(goldFile);
  const man = readManualAsQa(manualFile);

  let matched = 0;
  const used = new Set();
  for (const g of gold) {
    const idx = man.findIndex((m,i)=>!used.has(i) && m===g);
    if (idx>=0) { matched++; used.add(idx); }
  }
  const percent = gold.length ? Math.round((matched/gold.length)*10000)/100 : 100;
  const pass = percent >= threshold*100;
  const res = { overall: { percent, matched, total: gold.length, threshold: threshold*100, pass } };
  console.log(JSON.stringify(res, null, 2));
  process.exit(pass?0:1);
}

main();


