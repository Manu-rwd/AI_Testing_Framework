# Modul Review — Capitole grafice tehnice (Adăugare) — v1.7 (QA-parity)

## Rezumat
- Cazuri QA importate: 44
- Cazuri emise: 44
- Fezabilitate D/E (vizual/oracle): 14

## Cazuri de testare (stil QA, 1:1)

### Accesare
- Accesarea functionalitatii prin apasare <buton> [Adaugă](comportament_element_activ, comportament_element_dezactivat), {prezenta, pozitionare, stil_forma, stil_border, stil_culoare, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare, dimensiune, container-tip_link, container-tip_buton, container-tip_badge, container-stil_border, container-stil_culoare, container-comportament}
- Accesarea functionalitatii atunci cand nu exista inregistrari {comportament}
- Accesarea functionalitatii prin introducerea directa a URL-ului in bara de adrese {comportament}
- Accesarea functionalitatii atunci cand nu exista conexiune la internet {comportament}
- Accesarea functionalitatii atunci cand conexiunea cu server-ul este slaba {comportament}

### Autorizare
- Verificarea permisiunii [createTechnicalGraphChapters] {prezenta, descriere}
- Verificarea funcționalității noi pentru utilizatorii standard (non-admin) {comportament_general, comportament_acces_direct, comportament_performanta}
- Restrictionarea accesului la functionalitate, pentru utilizatorii neautorizati {comportament_general, comportament_vizibilitate_element, comportament_buton_inactiv, comportament_eroare_la_apasare, comportament_eroare_la_acces_direct}
- Redirectionarea utilizatorilor neautentificati catre pagina de login, la accesarea functionalitatii {comportament_general, comportament_vizibilitate_element, comportament_la_apasare, comportament_eroare_la_acces_direct, comportament_link_extern}
- Restrictionare acces la <buton> [Adaugă], pentru utilizatorii neautorizati {comportament}
- Verificarea actualizării funcționalității existente pentru utilizatorii standard (non-admin) {comportament_general, comportament_vizibilitate_elemente, comportament_accesibilitate_element, comportament_acces_direct, comportament_integrare, comportament_retrocompatibilitate, comportament_noi_rute, comportament_setare_permisiuni, comportament_interactiune_elemente_noi}

### FRT-Output inițial
- Afisarea breadcrumb-ului in pagina aplicatiei {comportament, prezenta, pozitionare, text_valoare, text_font-size, text_font-family, text_traducere, text_culoare, container-tip_link, container-tip_buton, container-tip_badge, conainer_dimensiune, container-stil_forma, container-stil_border, container-stil_culoare, container_comportament}
- Afisarea formularului in pagina aplicatiei {prezenta}

### BKD-Input
- Afisare <select> camp [Tip capitol] in formular {prezenta, pozitionare, text_valoare, comportament}
- Afisarea label-ului campului [Tip capitol] in formular {comportament, prezenta, pozitionare, mouseover, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare, backgroud-culoare}
- Afisarea indicatorului de obligativitate a campului [Tip capitol] in formular {comportament, prezenta, pozitionare, mouseover, text-valoare, text-font-size, text-font-family, text-culoare}
- Afisarea placeholder-ului campului [Tip capitol] in formular {comportament, prezenta, pozitionare, mouseover, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare, backgroud-culoare}
- Afisare valoare camp [Tip capitol] in formular {comportament, prezenta, pozitionare, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare, container-tip_link, container-tip_buton, container-tip_badge, container-stil_forma, container-stil_border, container-stil_culoare, container-comportament, celula-culoare, celula-mouseover}
- Neselectarea unei optiuni din campul [Tip capitol], de tip select {comportament, comportament_validare_neselectare, comportament_feedback_eroare, comportament_interzicere_submit, comportament_feedback_conditii_specifice, comportament_optiune_existenta, comportament_optiune_inexistenta, comportament_optiune_dezactivata}
- Selectarea unei optiuni, pentru campul [Tip capitol], de tip select {comportament, comportament_selectare_optiune, comportament_validare_selectare, comportament_feedback_succes, comportament_interfata_utilizator, comportament_optiune_existenta, comportament_optiune_inexistenta, comportament_optiune_dezactivata, comportament_optiune_implicita}
- Afișarea campului [Nume capitol] de tip input daca select-type-chapter = 0 (capitol)
- Afisarea indicatorului de obligativitate a campului [Nume capitol] in formular {comportament, prezenta, pozitionare, mouseover, text-valoare, text-font-size, text-font-family, text-culoare}
- Afișarea campului [Nume subcapitol] de tip input daca select-type-chapter = 0 (capitol)
- Neafisarea indicatorului de obligativitate a campului [Nume subcapitol] in formular {comportament, prezenta, pozitionare, mouseover, text-valoare, text-font-size, text-font-family, text-culoare}
- Afisarea butonului "+" in dreptul campului [Nume subcapitol]
- Afișarea campului [Capitol] de tip select daca select-type-chapter = 1 (subcapitol)
- Afișarea campului [Nume subcapitol] de tip input daca select-type-chapter = 1 (subcapitol)
- Neafisarea indicatorului de obligativitate a campului [Nume subcapitol] in formular {comportament, prezenta, pozitionare, mouseover, text-valoare, text-font-size, text-font-family, text-culoare}
- Afisarea butonului "+" in dreptul campului [Nume subcapitol]

### BKD-Proces
- Navigarea catre pagina sursa, daca accesul la pagina s-a facut prin introducerea URL-ului in bara de adrese {comportament}
- Verificarea ca la apăsarea pe butonul [+] se populează tabelul din dreapta, order-ul se incrementeaza automat, se introduce o linie la final
- Verificarea ca la apăsarea pe butonul [+] se populează tabelul din dreapta, order-ul se incrementeaza automat, se introduce o linie la final
- Verificare mentinerii focusului in pagina la intractiunea cu datele {comportament}
- Verificarea actiunii butonului de trimitere date [Salvează] {comportament} 
- Verificarea algoritmului de implementare {comportament_daca este conform detaliilor specifice functionalitatii}
- Afisarea mesajului de avertizare la incercarea de finalizare a functionalitatii de întoarcere {prezenta, pozitionare, auto-hide, auto-hide-timp, comportament_validare actiune, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare}
- Afisarea mesajului de avertizare la incercarea de finalizare a functionalitatii de resetare {prezenta, pozitionare, auto-hide, auto-hide-timp, comportament_validare actiune, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare}
- Inchiderea aplicatiei dupa apasarea butonului de trimitere date {comportament}
- Intreruperea conexiunii cu serverul dupa apasarea butonului de trimitere date {comportament}

### FRT-Confirmare acțiune
- Verificare redirect către pagina de origine la apăsarea Confirmarea actiunii butonului "Înapoi" prin apăsarea butonului "Da" în fereastra modală

### FRT-Output final
- Afisarea loading screenului atunci cand functionalitatea depaseste timpul prestabilit {afisare, comportament}
- Afisarea mesajului de succes la finalizarea functionalitatii de salvare {prezenta, pozitionare, auto-hide, auto-hide-timp, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare}

### Reverificare output final
- Afisarea corecta a datelor in pagina, dupa confirmarea functionalitatii {corectitudine}
- Afisarea corecta a datelor din baza de date, dupa confirmarea functionalitatii {corectitudine}