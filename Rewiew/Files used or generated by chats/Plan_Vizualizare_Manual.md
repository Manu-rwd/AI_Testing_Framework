# Plan Testare Manuală — Domenii ECF (Vizualizare)

## Scop
Verifică afişarea listei „Domenii ECF” şi comportamentul acţiunilor pe rând (Vezi detalii, Editează, Șterge) în condiţii normale şi scenarii negative de bază.

## Precondiții
- Utilizator **autentificat**.
- Permisiune: `indexDynamicDocumentGenerationDomains` (sau echivalent).
- Date minime în sistem: minim 1 „Domeniu ECF” creat pentru testele pe rând.
- Browser suportat, sesiune curată (fără cache relevant).
- URL aplicaţie corespunzător mediului (Local/Test/Prod).

## Rute de acces
- **Buton meniu**: „Domenii ECF” (ex. din modul „Generare dinamică documente”).
- **URL direct**: `/dynamic-document-generation/domains/index` (relative la host).

---

## Teste pozitive (Happy path)

### 1. Acces prin buton
**Pași**
1. Autentifică-te în aplicație cu utilizator care are permisiunea indicată.
2. Din meniu, apasă butonul **„Domenii ECF”**.
3. Așteaptă încărcarea paginii.

**Rezultat așteptat**
- Se afișează **lista Domenii ECF** (tabelul este vizibil).
- Titlul/heading-ul paginii este corect (ex. „Domenii ECF”).
- Nu apar erori în interfață.

### 2. Acces prin URL direct (autentificat)
**Pași**
1. Autentifică-te.
2. Navighează la `/dynamic-document-generation/domains/index`.

**Rezultat așteptat**
- Se afișează lista Domenii ECF.

### 3. Acțiune pe rând — „Vezi detalii”
**Pași**
1. Pe un rând existent, apasă butonul **„Vezi detalii”** (sau icon aferent).
2. Observă navigarea/afişarea detaliilor.

**Rezultat așteptat**
- Se deschide **pagina/modalul de detalii** pentru înregistrarea selectată.

### 4. Acțiune pe rând — „Editează”
**Pași**
1. Pe un rând existent, apasă **„Editează”**.
2. Observă navigarea.

**Rezultat așteptat**
- Se deschide **formularul de editare** pentru înregistrarea selectată.

### 5. Acțiune pe rând — „Șterge” (cu confirmare)
**Pași**
1. Pe un rând existent, apasă **„Șterge”**.
2. Confirmă în fereastra/modalul de confirmare.

**Rezultat așteptat**
- Apare **modal de confirmare**; după confirmare, apare mesaj de succes/toast.
- Înregistrarea dispare din listă (sau status actualizat conform cerinței).

---

## Teste negative / alternative

### 6. Fără permisiune
**Pași**
1. Autentificare cu **user fără permisiunea** necesară.
2. Încearcă accesarea paginii prin meniu sau URL.

**Rezultat așteptat**
- Redirect la login sau **eroare 403** (conform politicii aplicației).
- Nicio informație sensibilă nu este expusă.

### 7. Fără sesiune (URL direct)
**Pași**
1. Deschide URL-ul `/dynamic-document-generation/domains/index` **fără a fi autentificat**.

**Rezultat așteptat**
- **Redirect la login** sau pagină de autentificare.

### 8. Stare „fără înregistrări”
**Pași**
1. Accesează pagina în mediu/fixture fără înregistrări de tip „Domeniu ECF”.

**Rezultat așteptat**
- Se afișează **mesajul explicit** pentru listă goală (ex. „Nu există înregistrări”).

---

## Observații UI/UX (de verificat vizual)
- Existența și lizibilitatea titlului, breadcrumb, butoane.
- Consistența icon-urilor acțiunilor pe rând și a tooltip-urilor.
- Timp de răspuns rezonabil; fără blocaje/spinners persistente.
- Mesajele de confirmare/eroare sunt clare și corect traduse.

## Date de test
- Minim 1 înregistrare validă (seed).
- Dacă există filtre/căutare: valorile de intrare + mesaje pentru căutare fără rezultate.
- Pentru ștergere: rând dedicat, ușor de recreat.

## Note pentru QA
- Dacă aplicația oferă **filtre/căutare**, adăugați cazuri dedicate (pozitive/negative).
- Documentați **textul exact** din modal de confirmare și din toast-ul de succes/eroare.
- Marcați în raport dacă acțiunile se deschid în **modal** sau prin **navigare** la pagini separate.