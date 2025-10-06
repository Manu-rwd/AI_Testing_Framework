# Modul Review — Capitole grafice tehnice (Adăugare)

[◀ Înapoi la indexul ariei](/docs/modules/INDEX.md)

## Status & Scope
- **Modul testat:** Accesare → Autorizare → FRT-Output inițial → BKD-Input → BKD-Proces → FRT-Confirmare acțiune → FRT-Output final → Reverificare → Particulare
- **Tip funcționalitate:** Adăugare
- **Acoperire:** Focus pe pagină create + tabel dreapta (drag&drop, insert, delete), permisiune `createTechnicalGraphChapters`, butoane Back/Reset/Save, breadcrumbs.
- **Excluderi:** Vizual pur (font family/size/color) — marcat D/E în CSV (vizual oracle pending).

## Rezumat
| Aspect | Valoare |
|---|---|
| Cazuri generate | 18 |
| Fezabilitate A/B | 17 |
| Elemente cu selector_needs | 18 |
| Sursă proiect/defaults | 1 |

## Observații & note
- „Durată (zile)” input a fost scos din formular; durata subcapitol derivă din suma duratelor resurselor selectate.
- „Resurse” este `select2` cu opțiuni multiple; obligatoriu.
- Butonul [+] devine **enabled** doar când inputurile necesare sunt completate.
- Tabelul din dreapta: coloană **Ordine** centru/centru; **Durată** centru/dreapta; **Acțiuni** centru.

## Changelog
- 2025-09-24 — Prima versiune plan (v1.7).

---

## Cazuri de testare (stil QA, granular)

### Accesare
1. Accesarea funcționalității prin apasare <buton> [+ Adaugă] {prezență, poziționare, text-valoare, text-traducere, hover} → se deschide pagina `/create`.
2. Breadcrumbs afişate şi navigabile {Acasă / Capitole grafice tehnice / Adaugă capitole grafice tehnice} {prezență, poziționare, text-valoare, link-comportament}.

### Autorizare
3. Permisiunea `createTechnicalGraphChapters` — butonul [+ Adaugă] ascuns/disabled pentru utilizatori neautorizați; acces direct `/create` returnează 403.

### FRT-Output inițial (Chrome & Layout)
4. Titlu pagină {prezență, text-valoare exactă, poziționare}: „Adaugă capitol și subcapitole pentru structura graficelor tehnice”.
5. Formular col. stânga: **Tip capitol** (select2, single, mandatory, placeholder „Selectează tip capitol”).

### BKD-Input (Form Controls & Validation)
6. Tip=capitol(0): „Nume capitol” mandatory; validare la blur/submit.
7. „Nume subcapitol” mandatory; buton [+] devine enabled doar când câmpul este completat.
8. Select „Resurse” (select2, multiple, mandatory) cu opțiuni din `ecf_build.technical_graph_default_resurse.name`.

### BKD-Proces (Behaviors)
9. La apăsarea pe [+]: se adaugă linie în tabel (dreapta) și „Ordine” se incrementează automat.
10. Drag & drop pe „Ordine”: reordonare corectă; valorile `order` sunt rescrise corespunzător.
11. Buton Delete setează `deleted=1` pe rândul selectat.
12. Salvare permisă doar dacă există cel puțin un subcapitol în tabel.

### FRT-Output inițial — Tabel
13. Headere și alinieri: **Ordine** (center/center), **Nume subcapitol** (center/center, input enabled), **Durată subcapitol (zile)** (center/right, input enabled), **Acțiuni** (center).

### FRT-Output final (Toasts & Redirect)
14. Pe save reușit: redirect la index + toast succes (verde, auto-hide).

### FRT-Confirmare acțiune
15. „Înapoi” → navigare la pagina de referință.
16. „Resetează” → curăță selecturile și câmpurile formularului.

### Particulare (Resilience)
17. Offline/slow: overlay vizibil, submit blocat până la revenirea conexiunii (fezabilitate D; oracle vizual necesar).

---

### Cheatsheet CLI
```bash
# Planner v2 (exemplu)
pnpm -s planner:v2:adaugare -- --project ./projects/example --apply-project-fallbacks

# Exporturi
# - exports/Adaugare_Capitole_Grafice_Tehnice_Automation.csv
# - docs/modules/Adaugare_Capitole_Grafice_Tehnice_Manual.md
```
