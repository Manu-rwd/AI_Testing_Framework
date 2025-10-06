# Modul Review — Capitole grafice tehnice (Modificare)

[◀ Înapoi la indexul ariei](/docs/modules/INDEX.md)

## Status & Scope
- **Modul testat:** Accesare → Autorizare → FRT-Output inițial → BKD-Input → BKD-Proces → FRT-Confirmare acțiune → FRT-Output final → Reverificare → Particulare
- **Tip funcționalitate:** Modificare
- **Acoperire:** Pagina edit `/edit/:id`, breadcrumb, titlu, form stânga (Tip capitol disabled, ramuri 0/1), tabel dreapta (drag&drop, delete), Back/Reset/Save, permisiune `updateTechnicalGraphChapters`.
- **Excluderi:** Verificări vizuale profunde (font/culoare/dimensiuni) marcate cu fezabilitate D în CSV.

## Rezumat
| Aspect | Valoare |
|---|---|
| Cazuri generate | 30 |
| Fezabilitate A/B | 22 |
| Elemente cu selector_needs | 28 |
| Sursă proiect/defaults | 0 |

## Observații & note
- „Tip capitol” este **disabled** la edit, conform US; rămâne mandatory (validări la submit).
- Ramura **capitol(0)**: „Nume capitol” obligatoriu; „Nume subcapitol” și „Durată (zile)” pot fi folosite pentru a adăuga rânduri noi cu [+].
- Ramura **subcapitol(1)**: select capitol + câmpuri opționale pentru adăugare de rânduri.
- Tabel dreapta: suportă drag&drop cu recalcul de `order`, delete setează `deleted=1`.

## Changelog
- 2025-09-24 — Prima versiune plan (v1.7) pentru Modificare.

---

## Cazuri de testare (stil QA, granular)

### Accesare
- Accesarea functionalitatii prin introducerea directa a URL-ului in bara de adrese {comportament}
- Navigarea catre pagina sursa, daca accesul la pagina s-a facut prin introducerea URL-ului in bara de adrese {comportament}
- Accesarea functionalitatii in conditii de offline/slow {comportament}

### Autorizare
- Verificarea permisiunii [updateTechnicalGraphChapters] {prezenta, descriere}
- Restrictionarea accesului la functionalitate, pentru utilizatorii neautorizati {comportament_general, comportament_vizibilitate_element, comportament_eroare_la_acces_direct}
- Redirectionarea utilizatorilor neautentificati catre pagina de login, la accesarea functionalitatii {comportament_general, comportament_la_apasare, comportament_eroare_la_acces_direct, comportament_link_extern}

### FRT-Output inițial
- Breadcrumbs afisate si navigabile {Acasă / Capitole grafice tehnice / Modifică capitole grafice tehnice} {prezenta, pozitionare, text_valoare, text_font-size, text_font-family, text_traducere, text_culoare}
- Titlu pagină {prezență, text-valoare exactă, poziționare}

### BKD-Input — stânga
- Afisare <select> camp [Tip capitol] (disabled, mandatory, placeholder)
- Label [Tip capitol] — stiluri (vizual) {font/culoare/size} (D)
- Neselectarea unei opțiuni la [Tip capitol] — blocare submit
- (Tip=0) [Nume capitol] required
- (Tip=0) „+” enabled doar cu inputuri completate → adăugare rând
- (Tip=1) [Capitol] select vizibil
- (Tip=1) [Nume subcapitol] & [Durată (zile)] vizibile (opționale)
- (Tip=1) „+” enabled doar cu inputuri completate → adăugare rând

### BKD-Proces — dreapta
- „+” adaugă rând & auto-incrementează „Ordine”
- Drag & drop pe „Ordine” rescrie corect valorile
- Buton Delete setează `deleted=1`

### FRT-Confirmare acțiune
- „Înapoi” → redirect la index
- „Resetează” → curăță formularul

### FRT-Output final
- Pe save reușit: toast succes (verde, auto-hide)
- Loading screen pentru operații lente (vizual, D)

### Reverificare output final
- UI reflectă corect valorile salvate
- DB conține valorile actualizate

### Particulare
- Închidere aplicație după submit
- Pierdere conexiune după submit

---

### Cheatsheet CLI
```bash
# Planner v2 (exemplu)
pnpm -s planner:v2:modificare -- --project ./projects/example --apply-project-fallbacks

# Exporturi
# - exports/Modificare_Capitole_Grafice_Tehnice_Automation.csv
# - docs/modules/Modificare_Capitole_Grafice_Tehnice_Manual.md
```
