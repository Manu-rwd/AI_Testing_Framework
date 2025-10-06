# Plan de testare — Proiecte tip Licitație (Index / Create / Update / Delete)

*Generat: 2025-09-10*

## Index (Citire)
### Accesare
- Acces din meniu: Aplicații → Propuneri tehnice → Proiecte (Licitație)
- Acces direct prin URL
- Double-click pe intrarea din meniu nu produce dublă navigare

### Stabilitate
- Comportament fără conexiune la internet
- Conexiune lentă (Slow 3G) — loader și UI responsiv

### Autorizare
- Permisiune viewAuctionProjects — verificare acces
- Buton „Adaugă Proiect tip Licitație” ascuns fără permisiune createAuctionProject
- Iconițe Edit/Delete ascunse fără permisiuni dedicate

### Vizualizare
- Titlul paginii „Vizualizarea proiectelor de tip Licitație”
- Tabel prezent cu headere: Acțiuni, Id, Cod, Nume, Companie, Documente
- Coloana „Documente” — buton în rând cu label = DocumentsCount
- Coloana „Acțiuni” — butoane View/Edit/Delete prezente

### Navigare
- Breadcrumbs „Acasă / Propuneri tehnice” + link-uri corecte

### Paginatie
- Paginare activă cu 20 elemente implicit

### Ordonare
- Sortare on: Id, Cod, Nume, Companie, Documente; off: Acțiuni

### Filtrare
- Filtre funcționale: Id (input), Cod (input), Nume (input), Companie (select2)

### BKD-Input
- Filtru „Cod” — regex ^[a-zA-Z0-9\-/_]{1,50}$
- Filtru „Nume” — regex ^[a-zA-Z0-9 ]{1,255}$
- Filtru „Id” — numeric-only

---

## Create (ERP redirect)
### Accesare
- Click pe „Adaugă Proiect tip Licitație” din index → nou tab ERP (create)

### Autorizare
- Fără permisiune createAuctionProject → buton „Adaugă...” ascuns

### FRT-Output final
- Tipul proiectului din ERP este presetat la „licitație”

---

## Update (ERP redirect)
### Accesare
- Click pe buton Edit din col. Acțiuni → nou tab ERP (update)

### Autorizare
- Iconița Edit ascunsă fără permisiune updateAuctionProject

### BKD-Proces
- După închidere tab ERP → se poate declanșa refresh la tabel (fetch projects)

---

## Delete
### Confirmare
- Dialog confirmare „Sunteți sigur că doriți să ștergeți acest proiect?”

### Proces
- Confirmă ștergerea (Da) → set Deleted=1 în DB, redirect la index, mesaj succes
- Anulează ștergerea (Nu) → rămâne pe index fără modificări

### Autorizare
- Buton Delete ascuns fără permisiune deleteAuctionProject
