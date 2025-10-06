# Modul Review — Capitole grafice tehnice (Vizualizare)

[◀ Înapoi la indexul ariei](/docs/modules/INDEX.md)

## Status & Scope
- **Modul testat:** Accesare → Autorizare → FRT-Output inițial → Filtrare → Ordonare → BKD-Proces (expand/edit/delete/drag) → Reverificare
- **Tip funcționalitate:** Vizualizare
- **Acoperire:** Pagină index, breadcrumb & titlu, tabel cu drag&drop, coloane (Acțiuni, Extinde tot, Nume, Ordine, Adăugat, Modificat), filtre & sortări, acces & reziliență.

## Rezumat
| Aspect | Valoare |
|---|---|
| Cazuri generate | 27 |
| Fezabilitate A/B | 21 |
| Elemente cu selector_needs | 24 |
| Sursă proiect/defaults | 0 |

## Observații & note
- „Extinde tot” trebuie să afișeze subcapitolele cu coloanele cerute (Ordine, Nume subcapitol, Durata).
- Coloanele „Adăugat” și „Modificat” compun textul din nume + dată; filtrele/sortările sunt pe user și date.
- Drag&drop între linii rescrie ordinea și persistă în DB.

## Changelog
- 2025-09-24 — Prima versiune plan (v1.7) pentru Vizualizare.

---

## Cazuri de testare (stil QA, granular)

### Accesare
- Accesarea functionalitatii prin apasare <buton> [Capitole grafice tehnice] {… vizual facets …} (D)
- Accesarea succesivă (debounce)
- Direct URL
- Back la pagina sursă
- Offline/Slow
- Fără înregistrări

### Autorizare
- Permisiunea [indexTechnicalGraphChapters] — prezență & descriere
- Neautorizat: buton meniu ascuns
- Neautentificat: redirect la login

### FRT-Output inițial
- Breadcrumbs (vizual facets, D)
- Titlu (vizual facets, D)
- Tabel prezent

### Tabel — Coloane & comportamente
- „Acțiuni”: header/hover/align, butoane edit/delete
- „Extinde tot”: icon + hover + afișare subcapitole
- „Nume capitol”: header/hover/align + filtrare/ordonare
- „Ordine”: header/hover/align + filtrare/ordonare
- „Adăugat”: header/hover/align + compunere text + filtrare/ordonare
- „Modificat”: header/hover/align + compunere text + filtrare/ordonare
- Drag&drop între linii — rescrie ordinea

### Acțiuni
- Edit → navigare la pagina de modificare
- Delete → confirm sau `deleted=1`

### Reverificare
- UI consistent după interacțiuni
- DB reflectă noua ordine

---

### Cheatsheet CLI
```bash
# Planner v2 (exemplu)
pnpm -s planner:v2:vizualizare -- --project ./projects/example --apply-project-fallbacks

# Exporturi
# - exports/Vizualizare_Capitole_Grafice_Tehnice_Automation.csv
# - docs/modules/Vizualizare_Capitole_Grafice_Tehnice_Manual.md
```
