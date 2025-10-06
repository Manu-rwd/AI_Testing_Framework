# Cazuri de testare — Propuneri_tehnice / Centralizatoare (stil QA)
> Înapoi la [Propuneri_tehnice — Index](Propuneri_tehnice.md)

- Sursă: US (prioritar) + practici QA + proiect (fallback)
- Format: listă QA (propoziții numerotate cu atribute în {}), fără detalii tehnice (AAA/selectorii rămân în planul de automatizare).

## Index (Citire / Listare)
01. Accesarea funcționalității prin apăsare <buton> [Acasă → APLICAȚII → Licitații → Administrare → Centralizatoare] {prezență, poziționare, text-valoare, text-traducere, comportament}
02. Accesarea funcționalității prin introducerea directă a URL-ului în bara de adrese [/auction-document/data-centralizer/index] {comportament}
03. Accesarea funcționalității la apăsare succesivă/dublu-click pe <buton> [Centralizatoare] {comportament (navigare unică), anti-dublare}
04. Accesarea funcționalității atunci când nu există conexiune la internet {comportament, mesaj-eroare prietenos}
05. Accesarea funcționalității pe conexiune lentă {spinner, timeout rezonabil, randare după răspuns}
06. Accesarea fără permisiunea [viewCentralizer] {autorizare, comportament: interzis/redirect}
07. Afișare tabel listă [Centralizatoare] cu coloanele [Acțiuni, Id, Name, Description] {prezență, ordine coloane}
08. Paginație activă; număr implicit elemente: 20 {prezență, comportament}
09. Coloana [Acțiuni] este prima; sortare: False; aliniere antet: Centru {prezență, poziționare, proprietăți}
10. Afișare <buton> [View Details] în coloana [Acțiuni] {prezență, icon=fas fa-eye, hover=„Vezi mai multe detalii”}
11. Afișare <buton> [Edit] în coloana [Acțiuni] {prezență, icon=fas fa-pencil-alt, hover=„Modifică”}
12. Afișare <buton> [Delete] în coloana [Acțiuni] {prezență, icon=fas fa-trash, hover=„Șterge”}
13. Filtrare pe coloana [Id] respectă regex `^[0-9]+$` {validare, comportament}
14. Sortare pe [Id] funcțională ASC/DESC {comportament}
15. Filtrare pe coloana [Name] respectă regex `^[a-zA-Z ]{1,55}$` {validare, comportament}
16. Sortare pe [Name] funcțională ASC/DESC {comportament}
17. Filtrare pe coloana [Description] respectă regex `^[a-zA-Z0-9 ]{1,255}$` {validare, comportament}
18. Sortare pe [Description] funcțională ASC/DESC {comportament}
19. Sortare pe [Added, AddedBy, Updated, UpdatedBy] funcțională ASC/DESC {comportament}
20. Afișare <buton> [+ Adaugă] la dreapta titlului paginii {prezență, icon=fas fa-plus, hover=„Adaugă centralizator”}
21. Accesarea formularului prin click pe <buton> [+ Adaugă] {navigare, breadcrumbs: „Acasă / Propuneri tehnice / Centralizatoare / Adaugă centralizator”}

## Adăugare (Create)
01. Afișare câmp [Name] {prezență, hint=„Introdu denumirea centralizatorului”, hover=„Nume”}
02. Afișare câmp [Description] {prezență, hint=„Introdu descrierea centralziatorului”, hover=„Descriere”}
03. Validare [Name]: 0 caractere → mesaj eroare „Introdu un nume!” {validare, mesaj}
04. Validare [Name]: lungime maximă 55 caractere (blocare la depășire) {validare}
05. Validare [Name]: regex `^[a-zA-Z ]{1,55}$` {validare}
06. Validare [Description]: regex `^[a-zA-Z0-9 ]{1,255}$` {validare}
07. Salvare cu succes: redirect la index + mesaj Toastr succes {comportament, mesaje}
08. Eroare la nume duplicat: „Există deja un centralizator cu această denumire!” {validare, mesaje}
09. Buton [Înapoi]: revenire la index fără salvare {navigare}
10. Buton [Resetează]: golește formularul {comportament}

## Modificare (Update)
01. Accesarea formularului prin click pe <buton> [Edit] din coloana [Acțiuni] {navigare}
02. Afișare câmpuri [Name], [Description] cu valorile existente {prezență, conținut}
03. Validare [Name]: 0 caractere → mesaj „Introdu un nume!” {validare, mesaje}
04. Validare [Name]: 1–55 caractere; regex `^[a-zA-Z ]{1,55}$` {validare}
05. Validare [Description]: regex `^[a-zA-Z0-9 ]{1,255}$` {validare}
06. Actualizare cu succes: redirect la index + mesaj Toastr succes {comportament, mesaje}

## Ștergere (Delete)
01. Click pe <buton> [Delete] deschide fereastra modală Confirmare Ștergere {prezență, titlu=„Sigur doriți să ștergeți acest centralizator?”}
02. Confirmare Ștergere (buton [Da]): setează Deleted=1; afișează mesaj succes {comportament, mesaje}
03. Anulare Ștergere (buton [Nu]): închide modalul fără efecte {comportament}

## Activare (Activate)
01. În lista cu inregistrări inactive (ShowActive=false), afișare <buton> [Activate]; <buton> [Delete] ascuns {prezență}
02. Click pe <buton> [Activate] deschide dialog confirmare {prezență, titlu=„Are you sure you want to activate?”}
03. Confirmare Activare (buton [Yes]): setează Deleted=0; afișează mesaj succes „Activarea a fost realizată cu succes” {comportament, mesaje}
04. Anulare Activare (buton [No]): închide dialogul fără schimbări {comportament}


## Changelog
- 2025-09-15: Conversie în stil QA (enumerare simplă, atribute în {}).
