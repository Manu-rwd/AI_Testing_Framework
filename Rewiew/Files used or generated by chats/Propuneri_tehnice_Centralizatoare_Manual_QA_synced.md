# Cazuri de testare — Propuneri_tehnice / Centralizatoare (stil QA — sincronizat cu QA)
> Înapoi la [Propuneri_tehnice — Index](Propuneri_tehnice.md)

## Vizualizarea Centralizatoarelor

## ============
01. Accesarea functionalitatii prin apasare <buton> [Centralizatoare], {prezenta, pozitionare (Acasă -> APLICAȚII -> Licitații -> Administrare -> Centralizatoare), text-valoare, text-traducere}
02. Accesarea functionalitatii prin apasarea succesiva pe <buton> [Centralizatoare] {comportament}
03. Accesarea functionalitatii prin introducerea directa a URL-ului in bara de adrese {comportament}
04. Accesarea functionalitatii atunci cand nu exista conexiune la internet {comportament}
05. Accesarea functionalitatii atunci cand conexiunea cu server-ul este slaba {comportament}
06. Verificarea permisiunii [viewCentralizer] {prezenta, descriere}
07. Ascundere <buton> [Centralizatoare], pentru utilizatorii neautorizati {comportament}
08. Afisarea titlului in pagina aplicatiei {prezenta, pozitionare, text-valoare („Centralizatoare” ), text-traducere(„Centralizers”)}
09. Afisare <buton>[Adaugă] in dreapta titlului {prezenta, pozitionare, text-valoare, text-traducere}
10. Afisarea breadcrumb-ului in pagina aplicatiei {prezenta, pozitionare, text-valoare("Acasă / Propuneri tehnice / Centralizatoare”), text-traducere("Home / Technical proposals / Centralizers), container-tip_link, container-comportament}
11. Afisarea paginatiei in pagina {prezenta, pozitionare, text-valoare, container-tip_buton, container-comportament}
12. Afisarea corecta a continutului paginii la diferite rezolutii {prezenta, pozitionare, dimensiune, comportament}
13. Afisarea tabelului in pagina aplicatiei {prezenta}
14. Afisarea header-ului coloanei [Acțiuni] in tabel {prezenta, pozitionare, text-valoare, text-culoare (negru) text-traducere, mouseover (sageata)}
15. Afisare <buton toggle> in header-ul coloanei [Acțiuni] a tabelului {prezenta, pozitionare, text-valoare(Active/Șterse), text-traducere(Active/Deleted)}
16. Afisare <buton> [Vezi mai multe detalii] in coloana [Acțiuni] a tabelului {prezenta, pozitionare, container-tip_badge}
17. Afisare <buton> [Modifică] in coloana [Acțiuni] a tabelului {prezenta, pozitionare, container-tip_badge}
18. Afisare <buton> [Șterge] in coloana [Acțiuni] a tabelului {prezenta, pozitionare, container-tip_badge}
19. Afisarea header-ului coloanei [Id] in tabel {prezenta, pozitionare, text-valoare, text-culoare (albastru) text-traducere, mouseover (manuta)}
20. Afisare <input> in header-ul coloanei [Id] a tabelului {prezenta, pozitionare, text-valoare (Filtrează), text-traducere}
21. Afisarea header-ului coloanei [Nume] in tabel {prezenta, pozitionare, text-valoare,  text-culoare (albastru), text-traducere, mouseover (manuta)}
22. Afisare <input> in header-ul coloanei [Nume] a tabelului {prezenta, pozitionare, text-valoare, text-traducere}
23. Afisarea header-ului coloanei [Descriere] in tabel {prezenta, pozitionare, text-valoare, text-culoare (albastru), text-traducere, mouseover (manuta)}
24. Afisare <input> in header-ul coloanei [Nume] a tabelului {prezenta, pozitionare, text-valoare, text-culoare (albastru), text-traducere}
25. Afisarea header-ului coloanei [Conținut] in tabel {prezenta, pozitionare, text-valoare, text-culoare (negru) text-traducere, mouseover (sageata)}
26. Afisarea header-ului coloanei [Adăugat] in tabel {prezenta, pozitionare, text-valoare, text-culoare (albastru), text-traducere, mouseover (manuta)}
27. Afisare <select> in header-ul coloanei [Adăugat] a tabelului {prezenta, pozitionare, text-valoare, text-culoare (albastru), text-traducere}
28. Afisarea header-ului coloanei [Modificat] in tabel {prezenta, pozitionare, text-valoare, text-culoare (albastru), text-traducere, mouseover (manuta)}
29. Afisare <select> in header-ul coloanei [Adăugat] a tabelului {prezenta, pozitionare, text-valoare, text-culoare (albastru), text-traducere}
30. Afisarea inregistrarilor in tabel {pozitionare (centrate pe mijloc sus-jos, elementele din "Nume" si "Descriere" aliniate la stanga, din celelalte coloane aliniate central), ordine, nr. total}

## Adaugarea unui centralizator

## =========
01. Accesarea functionalitatii prin apasare <buton> [Activează] in coloana [Acțiuni] a tabelului din pagina "auction-document/data-centralizer/index", cand <butonul toggle> este in pozitia "Sterse" {prezenta, pozitionare, container-tip_buton, celula-mouseover}
02. Accesarea functionalitatii prin apasarea succesiva pe <buton> [Activează] in coloana [Acțiuni] a tabelului din pagina "auction-document/data-centralizer/index", cand <butonul toggle> este in pozitia "Sterse" {comportament}
03. Accesarea functionalitatii atunci cand nu exista conexiune la internet {comportament}
04. Accesarea functionalitatii atunci cand conexiunea cu server-ul este slaba {comportament}
05. Verificarea permisiunii [activateDataCentralizer] {prezenta, descriere}
06. Ascundere <buton> [Activează], pentru utilizatorii neautorizati {comportament}
07. Activarea unei inregistrari care exista {comportament}
08. Activarea unei inregistrari care nu exista {comportament}
09. Afisarea mesajului de avertizare la incercarea de finalizare a functionalitatii {prezenta, pozitionare, auto-hide, auto-hide-timp, comportament_validare actiune, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare}
10. Redirectionarea la pagina "auction-document/data-centralizer/index", cu afisarea centralizatoarelor sterse, dupa stergerea unui centralizator

## - Afisare mesaj de avertizare de pierdere a datelor daca am modificari in campuri
01. Verificarea actiunii butonului de trimitere date [Adauga] {comportament}
02. Verificare redirect către pagina "auction-document/data-centralizer/index", dupa finalizarea operatiei de adaugare
03. Afisarea mesajului de succes la finalizarea functionalitatii {comportament, prezenta, pozitionare, auto-hide, auto-hide-timp, text-valoare, text-traducere}
04. Afisarea mesajului de eroare la finalizarea functionalitatii {comportament, prezenta, pozitionare, auto-hide, auto-hide-timp, text-valoare, text-traducere}
05. Afisarea mesajului de avertizare la incercarea de finalizare a functionalitatii {comportament, prezenta, pozitionare, comportament, text-valoare, text-traducere}

## - Mesaj de avertizare cand campul "Nume" nu este completat -> "Introdu un nume!" si inrosire border
01. Afisare mesaj de avertizare de pierdere a datelor daca am modificari in campuri si dau click pe: breadcrumbs, meniu stanga, logo, Profilul meu

## Modificarea unui centralizator

## ===========
01. Accesarea functionalitatii prin apasare <buton> [Modifică] in coloana [Acțiuni] a tabelului din pagina "auction-document/data-centralizer/index" {prezenta, pozitionare, text-valoare, text-traducere}
02. Accesarea functionalitatii prin apasarea succesiva pe <buton> [Modifică] in coloana [Acțiuni] a tabelului din pagina "auction-document/data-centralizer/index" {comportament}
03. Accesarea functionalitatii atunci cand nu exista conexiune la internet {comportament}
04. Accesarea functionalitatii atunci cand conexiunea cu server-ul este slaba {comportament}
05. Verificarea permisiunii [updateCentralizer] {prezenta, descriere}
06. Ascundere <buton> [Modifică], pentru utilizatorii neautorizati {comportament}
07. Afisarea formularului in pagina aplicatiei {prezenta}
08. Afisare <input> camp [Nume] in formular
09. Afisarea label-ului campului [Nume] in formular {prezenta, pozitionare, text-valoare, text-traducere}
10. Afisarea indicatorului de obligativitate a campului [Nume] in formular {comportament, prezenta, pozitionare, text-valoare, text-culoare}
11. Afisarea hint-ului campului [Nume] in formular {prezenta, pozitionare, text-valoare (Introdu numele centralizatorului), text-traducere (Enter the name of the centralizer), comportament}
12. Afisarea label-ului campului [Descriere] in formular {prezenta, pozitionare, text-valoare, text-traducere}
13. Afisare <textbox> camp [Descriere] in formular
14. Afisarea hint-ului campului [Descriere] in formular {prezenta, pozitionare, text-valoare (Introdu descrierea centralizatorului), text-traducere (Enter the name of the centralizer), comportament}
15. Afisarea butonului de actiune [Înapoi] {comportament, prezenta, pozitionare, stil_forma, stil_border, stil_culoare, mouseover, text-valoare, text-traducere}
16. Afisarea butonului de actiune [Resetează] {comportament, prezenta, pozitionare, stil_forma, stil_border, stil_culoare, mouseover, text-valoare, text-traducere}
17. Afisarea butonului de trimitere date [Adaugă] {comportament, prezenta, pozitionare, stil_forma, stil_border, stil_culoare, mouseover, text-valoare, text-traducere}
18. Completarea campului [Nume], de tip input, cu o valoare ce respecta formatul cerut {comportament, comportament_validare_format, comportament_feedback_succes, comportament_restricții_input, comportament_limite}
19. Completarea campului [Nume], de tip input, cu o valoare ce respecta formatul cerut si conditiile specifice {comportament, comportament_validare_format, comportament_conditii_specifice, comportament_feedback_succes, comportament_restricții_input, comportament_limite}
20. Completarea campului [Nume], de tip input, cu o valoare ce respecta formatul cerut, dar nu indeplineste conditiile specifice {comportament, comportament_validare_condiții_specifice, comportament_feedback_eroare, comportament_interzicere_submit, comportament_resetare_camp}
21. Completarea campului [Nume], de tip input, cu o valoare ce nu respecta formatul cerut {comportament, comportament_validare_format_invalid, comportament_feedback_eroare, comportament_interzicere_submit, comportament_restricții_input, comportament_resetare_camp}
22. Completarea campului [Nume], de tip input, folosind comanda "Lipire" {comportament, comportament_lipire_valida, comportament_lipire_invalida, comportament_feedback_eroare, comportament_feedback_succes, comportament_validare_format, comportament_validare_conditii_specifice, comportament_limite}
23. Necompletarea campului [Nume], de tip input {comportament, comportament_validare_necompletare, comportament_feedback_eroare, comportament_interzicere_submit, comportament_feedback_conditii_specifice, comportament_validare_conditii_specifice}
24. Completarea campului [Descriere], de tip textbox, cu o valoare ce respecta formatul cerut {comportament, comportament_validare_format, comportament_feedback_succes, comportament_restricții_input, comportament_limite}
25. Completarea campului [Descriere], de tip textbox, cu o valoare ce respecta formatul cerut si conditiile specifice {comportament, comportament_validare_format, comportament_conditii_specifice, comportament_feedback_succes, comportament_restricții_input, comportament_limite}
26. Completarea campului [Descriere], de tip textbox, cu o valoare ce respecta formatul cerut, dar nu indeplineste conditiile specifice {comportament, comportament_validare_condiții_specifice, comportament_feedback_eroare, comportament_interzicere_submit, comportament_resetare_camp}
27. Completarea campului [Descriere], de tip textbox, cu o valoare ce nu respecta formatul cerut {comportament, comportament_validare_format_invalid, comportament_feedback_eroare, comportament_interzicere_submit, comportament_restricții_input, comportament_resetare_camp}
28. Completarea campului [Descriere], de tip textbox, folosind comanda "Lipire" {comportament, comportament_lipire_valida, comportament_lipire_invalida, comportament_feedback_eroare, comportament_feedback_succes, comportament_validare_format, comportament_validare_conditii_specifice, comportament_limite}
29. Necompletarea campului [Descriere], de tip textbox {comportament, comportament_validare_necompletare, comportament_feedback_eroare, comportament_interzicere_submit, comportament_feedback_conditii_specifice, comportament_validare_conditii_specifice}
30. Verificarea actiunii butonului de actiune [Înapoi] {comportament}

## Stergerea unui unui centralizator

## Activarea unui unui centralizator

## Changelog
- 2025-09-15: Sincronizat 1:1 cu lista QA furnizată.
