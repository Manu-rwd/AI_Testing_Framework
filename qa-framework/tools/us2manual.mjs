#!/usr/bin/env node
// Minimal US → Manual MD bridge (ESM, no deps)
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const QA_ROOT = path.resolve(__dirname, '..');
const IN_DIR = path.resolve(REPO_ROOT, 'US_input');
const OUT_DIR = path.resolve(REPO_ROOT, 'manual_output');
const DIST_EMIT = path.resolve(QA_ROOT, 'packages', 'manual-emitter', 'dist', 'emit.js');
let spec;

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function inferTip(txt) {
  const t = (txt || '').normalize('NFD').toLowerCase();
  const has = (re) => re.test(t);
  if (has(/adăugare|adaugare|creare|înregistrare/)) return 'Adăugare';
  if (has(/modificare|editare|actualizare/)) return 'Modificare';
  if (has(/ștergere|stergere|eliminare/)) return 'Ștergere';
  if (has(/activare|dezactivare/)) return 'Activare';
  if (has(/vizualizare|listare|index\b|afișare|afisare/)) return 'Vizualizare';
  return 'Vizualizare';
}

function extractColumns(txt) {
  const text = (txt || '');
  const out = new Map(); // labelLower -> {label, sortable, filterType}
  // 1) Inline list like: Columns: A, B | C
  const lines = text.split(/\r?\n/);
  for (const ln of lines) {
    const m = ln.match(/^(?:\s*(?:Coloane|Columns)\s*:\s*)(.+)$/i);
    if (m) {
      const raw = m[1] || '';
      raw.split(/[|,]/).forEach(s => {
        const label = s.replace(/["'„“”\[\]\(\)]/g, '').trim();
        if (!label) return;
        const key = label.toLowerCase();
        if (!out.has(key)) out.set(key, { label, sortable: /(^(id|cod)$|name|nume|tip|descr|date|data|email)/i.test(label), filterType: undefined });
      });
      break;
    }
  }
  // 2) Structured blocks like **Id Column:** with properties
  const blockRe = /\*\*([A-Za-z0-9 ĂÂÎȘȚăâîșț]+)\s*Column:\*\*[\s\S]*?(?=^\s*\*\*|^\s*$|^###)/gmi;
  let bm;
  while ((bm = blockRe.exec(text))) {
    const block = bm[0];
    const inferred = (bm[1] || '').trim();
    const nameMatch = block.match(/Name:\s*["'„“”]?([^"\n”]+)["'„“”]?/i);
    const labelRaw = (nameMatch?.[1] || inferred || '').trim();
    if (!labelRaw) continue;
    const label = labelRaw.replace(/["'„“”]/g, '').trim();
    const sortable = /Sort:\s*True/i.test(block);
    const filterMatch = block.match(/Column\s+Filter:\s*(Input-text|Select)/i);
    const filterType = filterMatch ? (/Select/i.test(filterMatch[1]) ? 'select' : 'text') : undefined;
    const key = label.toLowerCase();
    const prev = out.get(key);
    if (!prev) out.set(key, { label, sortable, filterType });
    else {
      const next = { label: prev.label, sortable: prev.sortable || sortable, filterType: prev.filterType || filterType };
      out.set(key, next);
    }
  }
  return Array.from(out.values());
}

function guessModuleTitle(txt, basename) {
  const m = (txt || '').match(/\bDocumente\b|\bCentralizatoare\b|\bUtilizatori\b|\bProiecte\b/i);
  return (m ? m[0] : basename).replace(/["'„“”]/g, '');
}

function buildPlanLike(txt, tip, title, cols) {
  return {
    uiux: {
      tip,
      columns: (cols && cols.length) ? cols : [],
      table: { paginated: true },
      resilience: { offline: true, slow: true, loadingSLAms: 2000, dropOnAccess: true, dropDuringAction: true },
      responsive: { breakpoints: ['md'] },
      auth: { unauthRedirect: '/login' }
    },
    meta: { module: tip, titlu: `Plan de testare — ${title}` }
  };
}

async function ensureEmitter() {
  if (fs.existsSync(DIST_EMIT)) return DIST_EMIT;
  // Build only manual-emitter to avoid unrelated package failures
  execSync('pnpm -s -C qa-framework --filter @pkg/manual-emitter run build', { stdio: 'inherit', cwd: REPO_ROOT });
  if (!fs.existsSync(DIST_EMIT)) throw new Error('Emitter dist missing after build');
  return DIST_EMIT;
}

async function importEmitter() {
  const p = await ensureEmitter();
  const mod = await import(pathToFileURLCompat(p));
  if (!mod.emitManualMarkdown) throw new Error('emitManualMarkdown not found in emitter module');
  return mod.emitManualMarkdown;
}

function pathToFileURLCompat(p) {
  const u = new URL('file:');
  u.pathname = path.resolve(p).replace(/\\/g, '/');
  return u.href;
}

function parseSections(txt) {
  const t = (txt||'');
  const blocks = [];
  const parts = t.split(/^###\s+/m);
  if (parts.length > 1) {
    for (const p of parts) {
      const m = p.match(/^(Read|Create|Update|Delete|Activate)\b[\s\S]*/i);
      if (!m) continue;
      const head = m[1].toLowerCase();
      const body = p.slice(p.indexOf('\n')+1);
      const tip = head.includes('read') ? 'Vizualizare' : head.includes('create') ? 'Adăugare' : head.includes('update') ? 'Modificare' : head.includes('delete') ? 'Ștergere' : 'Activare';
      blocks.push({ tip, text: body });
    }
  }
  if (!blocks.length) {
    blocks.push({ tip: inferTip(t), text: t });
  }
  return blocks;
}

function sectionHeading(tip) {
  const map = {
    'Vizualizare': 'Vizualizare',
    'Adăugare': 'Adăugare',
    'Modificare': 'Modificare',
    'Ștergere': 'Ștergere',
    'Activare': 'Activare',
  };
  const h = map[tip];
  return h ? `## ${h}` : '';
}

async function main() {
  ensureDir(IN_DIR);
  ensureDir(OUT_DIR);

  const emitManualMarkdown = await importEmitter();
  // Lazy import spec utils
  try { spec = await import(pathToFileURLCompat(path.resolve(QA_ROOT, 'packages', 'spec', 'dist', 'index.js'))); } catch {}

  const files = (await fsp.readdir(IN_DIR)).filter(f => f.toLowerCase().endsWith('.txt'));
  const compatAuth = process.argv.includes('--compat-auth-standalone');
  if (files.length === 0) {
    console.log('No .txt files in US_input/');
    return;
  }

  const selftest = process.argv.includes('--selftest');
  const qaStyleFlag = process.argv.includes('--qa-style');
  const qaMode = qaStyleFlag || process.argv.includes('--qa') || true; // default QA style on
  const qaRich = qaStyleFlag || process.argv.includes('--qa-rich') || true; // default enriched QA
  const stripProv = !process.argv.includes('--with-provenance');
  const toProcess = selftest ? files.slice(0, 1) : files;

  for (const f of toProcess) {
    const full = path.join(IN_DIR, f);
    const base = path.basename(f, path.extname(f));
    const txt = await fsp.readFile(full, 'utf8');
    const sections = parseSections(txt);
    const title = guessModuleTitle(txt, base.replace(/[_-]+/g, ' '));
    const outParts = [];
    const mdRawsForSelftest = [];

    for (const sec of sections) {
      const tip = sec.tip;
      const cols = extractColumns(sec.text);
      const plan = buildPlanLike(sec.text, tip, title, cols);
      const mdRaw = emitManualMarkdown(plan, { filterTip: tip, includeGeneral: true, title: `Plan de testare — ${title}`, compatAuthStandalone: compatAuth, qaStyle: true, removeProvenance: true });
      mdRawsForSelftest.push(mdRaw);
      const heading = sectionHeading(tip);
      if (heading) outParts.push(heading);
      if (qaMode || qaRich) {
        const baseQa = toQaStyle(mdRaw);
        const enriched = qaRich ? enrichWithQaSpecifics(baseQa, sec.text) : baseQa;
        outParts.push(enriched.trim());
      } else {
        outParts.push(mdRaw.trim());
      }
    }

    let md = outParts.join('\n\n') + '\n';
    if (spec && spec.formatManual) md = spec.formatManual(md, { stripProvenance: stripProv });
    const qaStyleEnabled = qaMode || qaRich;
    if (!qaStyleEnabled && !process.argv.includes('--no-strict-spec')) {
      if (spec && spec.validateManual) {
        const vr = spec.validateManual(md);
        if (!vr.ok) {
          console.error('Spec validation failed:\n' + vr.issues.map(i => `${i.line}:${i.kind}: ${i.msg}${i.sample?`\n  ${i.sample}`:''}`).join('\n'));
          process.exit(3);
        }
      }
    }
    const outPath = path.join(OUT_DIR, `${base}_Manual.md`);
    await fsp.writeFile(outPath, md, 'utf8');
    const lines = md.split(/\r?\n/).filter(Boolean).length;
    console.log(`WROTE Manual_output/${path.basename(outPath)} (${lines} lines)`);

    if (selftest) {
      const chk = mdRawsForSelftest[0] || '';
      const okOverlay = /\- \[overlay]/.test(chk);
      const okPresence = /\- \[presence]/.test(chk);
      const okProv = /<!-- provenance:/.test(chk);
      if (!okOverlay || !okPresence || !okProv) {
        console.error('Selftest failed: missing overlay/presence/provenance in output');
        process.exit(2);
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });

// --- QA-style formatter (minimal, dependency-free) ---
function qaAttrs(bucket, narrative) {
  const n = (narrative||'').toLowerCase();
  const out = new Set();
  const add=(x)=>out.add(x);
  if (bucket==='presence') {
    add('prezenta');
    if (n.includes('no results')||n.includes('fara rezultate')) add('gol');
    if (n.includes('loading')||n.includes('spinner')||n.includes('skeleton')) add('loading');
  } else if (bucket==='columns') {
    if (n.includes('header')) { add('prezenta'); add('pozitionare'); add('text-valoare'); add('text-traducere'); }
    if (n.includes('valoare')) { add('tabel'); add('valoare'); }
  } else if (bucket==='sorting') { add('sortare'); if (n.includes('asc')) add('asc'); if (n.includes('desc')) add('desc'); }
  else if (bucket==='pagination') {
    if (n.includes('selector')||n.includes('marime')) { add('paginare'); add('page-size'); }
    if (n.includes('pager')||n.includes('first/prev/next/last')) { add('paginare'); add('pager'); }
  }
  else if (bucket==='responsive') { add('responsive'); if (n.includes("'md'")||n.includes(' md ')) add('md'); }
  else if (bucket==='auth') { add('comportament'); }
  else if (bucket==='resilience') {
    if (n.includes('offline')) add('offline');
    if (n.includes('lenta')) add('slow');
    if (n.includes('ttfb')||n.includes('sla')) { add('loading'); add('SLA'); }
    if (n.includes('drop') && n.includes('acces')) { add('drop'); add('acces'); }
    if (n.includes('drop') && n.includes('interactiune')) { add('drop'); add('interactiune'); }
  }
  return Array.from(out);
}

function toQaStyle(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let num = 1;
  for (let i=0;i<lines.length;i++) {
    const l = lines[i];
    const m = l.match(/^\- \[(\w+)]\s*(.+?)(\s*\{[^}]*\})?$/);
    if (!m) continue;
    const bucket = (m[1]||'').toLowerCase();
    if (bucket==='overlay') continue; // skip overlays in QA view
    const narrative = m[2].trim();
    const attrs = qaAttrs(bucket, narrative);
    const idx = String(num).padStart(2,'0');
    out.push(`${idx}. ${narrative}${attrs.length?` {${attrs.join(', ')}}`:''}`);
    num++;
  }
  return out.join('\n')+ (out.length?'\n':'');
}

// --- QA Rich augmentor: add actions, breadcrumbs, form fields, permissions ---
function enrichWithQaSpecifics(qaText, usText) {
  const lines = qaText.split(/\r?\n/).filter(Boolean);
  let idx = lines.length + 1;
  const add = (s) => { lines.push(`${String(idx).padStart(2,'0')}. ${s}`); idx++; };

  const t = (usText||'');
  // Breadcrumbs / navigation
  if (/Breadcrumbs|Breadcrumb/gi.test(t) || /Acas[ăa]\s*\//i.test(t)) {
    add("Breadcrumbs vizibile și corecte {prezenta, pozitionare, text-valoare, text-traducere, container-tip_link, container-comportament}");
  }
  if (/Navigation path|Feature page|URL/i.test(t)) {
    add("Accesarea funcționalității prin URL direct și prin buton de navigare {comportament}");
  }
  // Permissions (names in brackets like [viewDocuments])
  const perms = Array.from(new Set((t.match(/\[(view|create|edit|delete|activate)[A-Za-z]+\]/ig) || [])));
  for (const p of perms) add(`Verificarea permisiunii ${p} {comportament}`);
  // Actions buttons
  if (/\b(View Details)\b/i.test(t)) add("Buton 'View Details' — vizibil si functional {prezenta, container-tip_buton, comportament, mouseover}");
  if (/\bEdit\b/i.test(t)) add("Buton 'Edit' — vizibil si functional {prezenta, container-tip_buton, comportament, mouseover}");
  if (/\bDelete\b/i.test(t)|/Șterge|Sterge/.test(t)) add("Buton 'Delete' — vizibil si functional {prezenta, container-tip_buton, comportament, mouseover}");
  if (/\bExport\b/i.test(t)) add("Buton 'Export' — vizibil si functional {prezenta, container-tip_buton, comportament, mouseover}");
  if (/Create Button|Adaug[ăa] Document/i.test(t)) add("Buton '[+ Adaugă]' — vizibil si deschide formularul {prezenta, container-tip_buton, comportament, mouseover}");
  // Form fields (Name/Tip/Descriere)
  const hasName = /\b(Name|Nume)\b/i.test(t);
  const hasType = /\b(Type|Tip)\b/i.test(t);
  const hasDescr = /\b(Description|Descriere)\b/i.test(t);
  if (hasName) add("Câmp 'Nume' — eticheta si indicator obligatoriu vizibile {prezenta, pozitionare, text-valoare, text-traducere}");
  if (hasType) add("Câmp 'Tip' — eticheta si indicator obligatoriu vizibile {prezenta, pozitionare, text-valoare, text-traducere}");
  if (hasDescr) add("Câmp 'Descriere' — eticheta vizibila si placeholder {prezenta, pozitionare, text-valoare, text-traducere}");
  // File upload
  if (/\b(File|Fișier|Fisier)\b/i.test(t)) {
    add("Fișier — incarcare tip gresit blocata si afiseaza eroare {comportament_feedback_eroare}");
    add("Fișier — incarcare nume gresit este blocata {comportament_feedback_eroare}");
    add("Fișier — duplicat (acelasi nume si continut) detectat {comportament_feedback_eroare}");
  }
  // Column filters derived from structured columns
  const cols = extractColumns(usText);
  for (const c of cols) {
    if (c.filterType === 'text') add(`Afisare input filtrare pentru coloana '${c.label}' si aplicare filtrului {tabel, header}`);
    if (c.filterType === 'select') add(`Afisare select filtrare pentru coloana '${c.label}' si aplicare filtrului {tabel, header}`);
  }
  return lines.join('\n')+ (lines.length?'\n':'');
}


