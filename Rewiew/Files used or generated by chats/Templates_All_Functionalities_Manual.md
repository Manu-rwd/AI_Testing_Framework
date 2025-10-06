# Modul Review — Template-uri (Index + Create)
> Înapoi la [Accesare — Index](Accesare.md)

## Status & Scope
- **Status:** Needs work
- **Modul:** Template-uri — Index, Create și acțiuni
- **Sursă:** US → Template-uri
- **Fișiere:** `exports/Templates_All_Functionalities_Automation.csv`, `docs/modules/Accesare/Templates_All_Functionalities_Manual.md`

## Rezumat review
### Distribuție pe disposition
| Disposition  | Count |
|---|---|
| Approved     | 6 |
| Needs work   | 19 |
| Blocked      | 0 |
| Drop         | 0 |
| **Total**    | 25 |

### Distribuție pe feasibility
| Fezabilitate | Count |
|---|---|
| A | 4 |
| B | 14 |
| C | 7 |
| D | 0 |
| E | 0 |

## Plan de testare manual (RO)
Structurat pe funcționalități; folosește pași numerotați și rezultate așteptate.
### Accesare
**TC01 — Utilizator cu permisiunea indexDynamicDocumentGenerationTemplates poate accesa indexul Template-uri.**
- **Precondiții:**
  - Utilizator autentificat cu permisiunea indexDynamicDocumentGenerationTemplates
- **Pași:**
  1. Navighează la dynamic-document-generation/templates/index
- **Rezultate așteptate:**
  - Pagina se încarcă fără eroare
  - Titlul este 'Template-uri'

**TC02 — Utilizator fără permisiune NU poate accesa indexul Template-uri.**
- **Precondiții:**
  - Utilizator autentificat fără permisiunea indexDynamicDocumentGenerationTemplates
- **Pași:**
  1. Navighează la dynamic-document-generation/templates/index
- **Rezultate așteptate:**
  - Se afișează eroare de autorizare sau redirect la login/403

### Vizualizare
**TC01 — Titlu, breadcrumbs, coloane și paginare implicită 20 pe index.**
- **Precondiții:**
  - Autentificat cu permisiune; există >=1 template
- **Pași:**
  1. Accesează indexul
- **Rezultate așteptate:**
  - Titlul 'Template-uri'
  - Breadcrumbs corecte
  - Existența coloanelor Id, Denumire, Domeniu, Descriere, Adăugat, Modificat, Acțiuni
  - Paginare activă cu 20/ pagină

**TC02 — Acțiunile row-level sunt vizibile pentru fiecare rând.**
- **Precondiții:**
  - >=1 rând
- **Pași:**
  1. Inspectează primul rând
- **Rezultate așteptate:**
  - Existența butoanelor button_view, button_edit, button_delete, button_download cu clasele din US

**TC03 — Butonul View deschide detaliile șablonului.**
- **Precondiții:**
  - >=1 rând
- **Pași:**
  1. Click pe button_view în primul rând
- **Rezultate așteptate:**
  - Se deschide pagina de detalii

### Navigare
**TC01 — Butonul 'Adaugă' navighează către pagina de creare.**
- **Precondiții:**
  - Pe index
- **Pași:**
  1. Click pe id=button_create
- **Rezultate așteptate:**
  - URL devine templates/create
  - Titlul 'Adaugă Template'

### Ordonare
**TC01 — Sortarea pe coloana 'Id' funcționează asc/desc.**
- **Precondiții:**
  - Pe index; există >=2 rânduri
- **Pași:**
  1. Click de două ori pe header th_id pentru a alterna ordinea
- **Rezultate așteptate:**
  - Ordinea rândurilor se schimbă în funcție de 'Id'

**TC02 — Sortarea pe coloana 'Denumire' funcționează asc/desc.**
- **Precondiții:**
  - Pe index; există >=2 rânduri
- **Pași:**
  1. Click de două ori pe header th_name pentru a alterna ordinea
- **Rezultate așteptate:**
  - Ordinea rândurilor se schimbă în funcție de 'Denumire'

**TC03 — Sortarea pe coloana 'Domeniu' funcționează asc/desc.**
- **Precondiții:**
  - Pe index; există >=2 rânduri
- **Pași:**
  1. Click de două ori pe header th_domain pentru a alterna ordinea
- **Rezultate așteptate:**
  - Ordinea rândurilor se schimbă în funcție de 'Domeniu'

**TC04 — Sortarea pe coloana 'Descriere' funcționează asc/desc.**
- **Precondiții:**
  - Pe index; există >=2 rânduri
- **Pași:**
  1. Click de două ori pe header th_description pentru a alterna ordinea
- **Rezultate așteptate:**
  - Ordinea rândurilor se schimbă în funcție de 'Descriere'

**TC05 — Sortarea pe coloana 'Adăugat' funcționează asc/desc.**
- **Precondiții:**
  - Pe index; există >=2 rânduri
- **Pași:**
  1. Click de două ori pe header th_added pentru a alterna ordinea
- **Rezultate așteptate:**
  - Ordinea rândurilor se schimbă în funcție de 'Adăugat'

**TC06 — Sortarea pe coloana 'Modificat' funcționează asc/desc.**
- **Precondiții:**
  - Pe index; există >=2 rânduri
- **Pași:**
  1. Click de două ori pe header th_modified pentru a alterna ordinea
- **Rezultate așteptate:**
  - Ordinea rândurilor se schimbă în funcție de 'Modificat'

### Filtrare
**TC01 — Filtrarea după 'Id' prin input text funcționează.**
- **Precondiții:**
  - Pe index; valori distincte în grid
- **Pași:**
  1. Introduce text în filtrul coloanei th_id
- **Rezultate așteptate:**
  - Grid-ul afișează rânduri care corespund filtrului 'Id'

**TC02 — Filtrarea după 'Denumire' prin input text funcționează.**
- **Precondiții:**
  - Pe index; valori distincte în grid
- **Pași:**
  1. Introduce text în filtrul coloanei th_name
- **Rezultate așteptate:**
  - Grid-ul afișează rânduri care corespund filtrului 'Denumire'

**TC03 — Filtrarea după 'Domeniu' prin input text funcționează.**
- **Precondiții:**
  - Pe index; valori distincte în grid
- **Pași:**
  1. Introduce text în filtrul coloanei th_domain
- **Rezultate așteptate:**
  - Grid-ul afișează rânduri care corespund filtrului 'Domeniu'

**TC04 — Filtrarea după 'Descriere' prin input text funcționează.**
- **Precondiții:**
  - Pe index; valori distincte în grid
- **Pași:**
  1. Introduce text în filtrul coloanei th_description
- **Rezultate așteptate:**
  - Grid-ul afișează rânduri care corespund filtrului 'Descriere'

### Paginatie
**TC01 — Paginarea funcționează și păstrează filtrele aplicate.**
- **Precondiții:**
  - >20 rânduri și un filtru activ
- **Pași:**
  1. Click pe Next în paginator
- **Rezultate așteptate:**
  - Se încarcă pagina următoare, filtrul rămâne activ

### Ștergere/Activare
**TC01 — Butonul Delete marchează rândul ca șters (soft-delete) și modifică clasa toggle-text-deleted.**
- **Precondiții:**
  - >=1 rând activ
- **Pași:**
  1. Click pe button_delete în primul rând; confirmare dacă există
- **Rezultate așteptate:**
  - Starea rândului devine 'Șters' (clasă toggle-text-deleted)

**TC02 — Toggle Active/Șterse comută vizualizarea între rânduri active și șterse.**
- **Precondiții:**
  - >=1 rând șters
- **Pași:**
  1. Click pe toggle 'Șterse'
- **Rezultate așteptate:**
  - Lista afișează rândurile marcate ca șterse

### Descărcare
**TC01 — Butonul Download inițiază descărcarea fișierului de template.**
- **Precondiții:**
  - rând cu fișier atașat
- **Pași:**
  1. Click pe button_download
- **Rezultate așteptate:**
  - Se inițiază descărcarea unui fișier existent

### Adăugare
**TC01 — Formularul de creare validează regex la Nume (caz negativ).**
- **Precondiții:**
  - Pe pagina create
- **Pași:**
  1. Introduce 'value_mai_lung_de_20_caractere' în input_template_id; submit
- **Rezultate așteptate:**
  - Mesaj de eroare vizibil

**TC02 — Salvare reușită cu câmpuri valide și fișier selectat.**
- **Precondiții:**
  - Utilizator cu createDynamicDocumentGenerationTemplates; pe create
- **Pași:**
  1. Completează input_template_id='tmpl1'
  1. Selectează input_template_domain
  1. Completează input_template_description în limite regex
  1. Selectează input_file
  1. Click pe button_save
- **Rezultate așteptate:**
  - Se salvează șablonul
  - Redirect la index
  - Șablonul apare în listă

**TC03 — Butonul 'Înapoi' revine la index fără salvare.**
- **Precondiții:**
  - Pe create
- **Pași:**
  1. Click pe back_button
- **Rezultate așteptate:**
  - Navigare la index; fără entitate nouă

### Resetare
**TC01 — Butonul 'Resetează' curăță formularul.**
- **Precondiții:**
  - Pe create; câmpuri completate
- **Pași:**
  1. Click pe reload_button
- **Rezultate așteptate:**
  - Câmpurile revin la implicit

## Observații & note
- Unele aserții (ordonare, filtrare, paginare, descărcare) necesită oracole de date/stare sau interceptare rețea.
- Pentru Create, sunt necesare seed-uri: domenii existente și fișier exemplu.

## Changelog
- 2025-09-10 (Europe/Bucharest): Inițializare document; import CSV; rezumat & status.

## Cheatsheet CLI (PowerShell)
```powershell
# Emitere plan (automat) pentru Template-uri (toate funcționalitățile)
pnpm -s planner:v2:templates -- `
  --out-csv exports/Templates_All_Functionalities_Automation.csv `
  --out-md  docs/modules/Accesare/Templates_All_Functionalities_Manual.md

# Extindere CSV cu review columns (idempotent)
pnpm -s review:extend -- `
  --csv exports/Templates_All_Functionalities_Automation.csv

# Regenerare Rezumat + Status în MD (idempotent)
pnpm -s review:report -- `
  --csv exports/Templates_All_Functionalities_Automation.csv `
  --md  docs/modules/Accesare/Templates_All_Functionalities_Manual.md

# Actualizare index Accesare.md
pnpm -s docs:update-index -- `
  --area Accesare `
  --func Templates_All_Functionalities `
  --status Needs work
```