# Plan de testare — Domenii ECF (Index & Adăugare)

> Cazuri manuale în stil QA; Conținut RO. Selectoare recomandate: id + data-testid.

## Index (Citire)
### Accesare
1. Din meniu „Domenii ECF” → se deschide index
2. Double-click pe „Domenii ECF” → fără dublă încărcare
3. Acces direct URL „/dynamic-document-generation/domains/index” → ok
4. Fără internet → mesaj de eroare controlat (fără crash)
5. Latență mare → loader + UI responsiv

### Autorizare
6. Permisiune „indexDynamicDocumentGenerationDomains” (SuperAdmin vs. user restricționat)
7. „Adaugă” ascuns fără permisiune create

### FRT-Output inițial
8. Titlu „Domenii ECF” și breadcrumbs corecte
9. Paginare implicit 20/ pagină
10. Tabel + col. „Acțiuni” cu View/Edit/Delete/Toggle
11. Sortare: on (Id, Denumire); off (Descriere, Adăugat, Modificat)
12. Filtre funcționale: Id (input), Denumire (select), Descriere (input)

### BKD-Input
13. Regex „Id” (respinge invalid)
14. Denumire (select) doar valori valide
15. Descriere validează limită/format

### BKD-Proces
16. Filter + sort combinate

### FRT-Output final
17. Aliniere tabel (Denumire/Descriere la stânga; restul centrat)

### Reverificare output final
18. Domeniu nou apare în index după creare

---

## Create (Adăugare)
### Accesare & Autorizare
1. Click „Adaugă” din index → pagina create
2. „Adaugă” ascuns fără permisiune „createDynamicDocumentGenerationDomains”

### FRT-Output inițial (Form)
3. Câmpuri: „Nume”, „Descriere”; butoane: „Înapoi”, „Resetează”, „Salvează”

### BKD-Input
4. „Nume” — valid (regex) → acceptat
5. „Nume” — lipire invalidă („@@@”) → eroare; submit blocat
6. „Nume” — necompletat → required; submit blocat
7. „Descriere” — sub limită → acceptat
8. „Descriere” — peste limită → eroare/trunchiere

### BKD-Proces
9. Submit → domeniu creat; „Added/AddedBy” setate server-side
10. Duplicat „name” → toast eroare clar

### FRT-Confirmare acțiune
11. „Înapoi” cu modificări → dialog confirmare
12. „Resetează” cu modificări → confirmare + reset

### FRT-Output final
13. Success → redirect la index + toast „Domeniu creat” + rând vizibil

---

*Generat la: 2025-09-10*
