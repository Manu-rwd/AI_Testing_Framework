# Modul Review — Capitole grafice tehnice (Vizualizare) — QA style (paritate)

## Cazuri de testare (stil QA, granular)
### Accesare
- Accesarea functionalitatii prin apasare <buton> [Capitole grafice tehnice] (comportament_element_activ, comportament_element_dezactivat), {prezenta, pozitionare, stil_forma, stil_border, stil_culoare, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare, dimensiune, container-tip_link, container-tip_buton, container-tip_badge, container-stil_border, container-stil_culoare, container-comportament}
- Accesarea functionalitatii prin apasarea succesiva pe <buton> [Capitole grafice tehnice] {comportament}
- Accesarea functionalitatii atunci cand nu exista inregistrari {comportament}
- Accesarea functionalitatii prin apasare <buton> [Capitole grafice tehnice], atunci cand inregistrarea nu exista {comportament}
- Accesarea functionalitatii prin introducerea directa a URL-ului in bara de adrese {comportament}
- Navigarea catre pagina sursa, daca accesul la pagina s-a facut prin introducerea URL-ului in bara de adrese {comportament}
- Accesarea functionalitatii atunci cand nu exista conexiune la internet {comportament}
- Accesarea functionalitatii atunci cand conexiunea cu server-ul este slaba {comportament}

### Autorizare
- Verificarea permisiunii [indexTechnicalGraphChapters] {prezenta, descriere}
- Verificarea funcționalității noi pentru utilizatorii standard (non-admin) {comportament_general, comportament_acces_direct, comportament_performanta}
- Restrictionarea accesului la functionalitate, pentru utilizatorii neautorizati {comportament_general, comportament_vizibilitate_element, comportament_buton_inactiv, comportament_eroare_la_apasare, comportament_eroare_la_acces_direct}
- Ascundere <buton> [Capitole grafice tehnice], pentru utilizatorii neautorizati {comportament}
- Redirectionarea utilizatorilor neautentificati catre pagina de login, la accesarea functionalitatii {comportament_general, comportament_vizibilitate_element, comportament_la_apasare, comportament_eroare_la_acces_direct, comportament_link_extern}

### FRT-Output inițial (Chrome)
- Afisarea titlului in pagina aplicatiei {comportament, prezenta, pozitionare, backgroud-culoare, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare}
- Afisarea breadcrumb-ului in pagina aplicatiei {comportament, prezenta, pozitionare, text_valoare, text_font-size, text_font-family, text_traducere, text_culoare, container-tip_link, container-tip_buton, container-tip_badge, conainer_dimensiune, container-stil_forma, container-stil_border, container-stil_culoare, container_comportament}
- Afisarea tabelului in pagina aplicatiei {prezenta}

### Tabel — Coloana Acțiuni
- Afisarea coloanei [Acțiuni] in tabel {header_text, hover, pozitionare_header, align-header_center, prezenta_butoane_edit_delete, container-stil_forma, container-stil_border, container-stil_culoare}
- Afisarea tooltips pe butoanele [edit] si [delete] {prezenta, text-valoare, text-font-size, text-font-family, text-culoare}
- Verificarea actiunii butonului [edit] {comportament_navigare}
- Verificarea actiunii butonului [delete] {comportament_confirmare, comportament_flag_deleted}

### Tabel — Coloana Extinde tot
- Afisarea coloanei [Extinde tot] in tabel {icon_far fa-caret-square-right, hover_Extinde tot, align-header_center}
- Verificare functionalitate [Extinde tot] — expandeaza toate subcapitolele si afiseaza coloanele Ordine | Nume subcapitol | Durata {comportament}

### Tabel — Coloana Nume capitol
- Afisarea coloanei [Nume capitol] in tabel {header_text, hover, align-header_left, container-stil_forma, container-stil_border, container-stil_culoare}
- Filtrarea dupa [Nume capitol] {comportament_filtrare}
- Ordonarea dupa [Nume capitol] {comportament_ordonare_asc_desc, indicator_sortare}

### Tabel — Coloana Ordine
- Afisarea coloanei [Ordine] in tabel {header_text, hover, align-header_center, container-stil_forma, container-stil_border, container-stil_culoare}
- Filtrarea dupa [Ordine] {comportament_filtrare}
- Ordonarea dupa [Ordine] {comportament_ordonare_asc_desc, indicator_sortare}

### Tabel — Coloana Adăugat
- Afisarea coloanei [Adăugat] in tabel {header_text, hover, align-header_center, compunere_text_prenume_nume_data, align-content_center}
- Filtrarea dupa [Adăugat] by user {comportament_filtrare}
- Ordonarea dupa [Adăugat] by data {comportament_ordonare_asc_desc, indicator_sortare}

### Tabel — Coloana Modificat
- Afisarea coloanei [Modificat] in tabel {header_text, hover, align-header_center, compunere_text_prenume_nume_data, align-content_center}
- Filtrarea dupa [Modificat] by user {comportament_filtrare}
- Ordonarea dupa [Modificat] by data {comportament_ordonare_asc_desc, indicator_sortare}

### Drag & Drop
- Drag and drop intre linii in tabel {comportament_reordonare, actualizare_valoare_ordine, persistență_UI}

### Reverificare & Reziliență
- Afisarea corecta a datelor in pagina dupa interactiuni (drag/sort/filter) {corectitudine}
- Persistenta noii ordini in DB dupa drag&drop {corectitudine}
- Afisarea loading screenului atunci cand functionalitatea depaseste timpul prestabilit {afisare, comportament}
- Intreruperea conexiunii cu serverul la accesarea functionalitatii {comportament}
- Intreruperea conexiunii cu serverul in timpul interactiunilor (drag/sort/filter) {comportament}
