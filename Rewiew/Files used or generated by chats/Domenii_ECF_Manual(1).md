# Plan de testare — Domenii ECF (Index & Adăugare) — consolidat
*Actualizat: 2025-09-10*

## Index (Citire)
### Accesare
- Accesarea funcționalității din meniu (click „Domenii ECF”)
- Acces repetat (double-click) pe „Domenii ECF” nu dublează încărcarea
- Acces direct prin URL
- Comportament fără conexiune la internet
- Conexiune cu latență mare
- Acces prin buton „Domenii ECF” (prezență, poziționare, text/ traducere)
- Click succesiv (double-click) pe „Domenii ECF” — comportament idempotent
- Acces direct prin URL /dynamic-document-generation/domains/index

### Autorizare
- Verificare permisiune indexDynamicDocumentGenerationDomains
- Butonul „Adaugă” ascuns pentru utilizatori fără createDynamicDocumentGenerationDomains
- Permisiune indexDynamicDocumentGenerationDomains — verificare
- Ascundere buton „Domenii ECF” pentru utilizatori neautorizați

### Navigare
- Buton „Adaugă” în dreapta titlului (RO/EN)
- Breadcrumbs — prezență, link, comportament, traduceri

### Paginatie
- Paginatie — prezență, butoane, comportament

### Filtrare
- Input în header „Id” — placeholder „Filtrează” + traducere
- Input/select în header „Denumire” — prezență, placeholder, traduceri
- Input în header „Nume/Denumire” — prezență, culoare albastru, traduceri
- Select în header „Adăugat” — funcțional
- Select în header „Modificat” — funcțional

### Vizualizare
- Titlu în pagină „Domenii ECF” (RO/EN)
- Tabel prezent în pagină
- Header col. „Acțiuni” — text, culoare (negru), tooltip săgeată
- Buton rând „Vezi mai multe detalii” prezent (badge)
- Buton rând „Modifică” prezent (badge)
- Buton rând „Șterge” prezent (badge)
- Header col. „Id” — text, culoare (albastru), cursor (mânuță) la sortabile
- Header col. „Denumire” — text, culoare (albastru), cursor (mânuță) la sortabile
- Header col. „Descriere” — text, culoare (albastru), cursor (mânuță) la sortabile
- Header col. „Adăugat” — text, culoare (albastru), tooltip
- Header col. „Modificat” — text, culoare (albastru), tooltip
- Afișarea înregistrărilor — aliniere per coloană, ordine, număr total

### Ștergere/Activare
- Buton toggle Active/Șterse — etichete RO/EN și comportament

### Stabilitate
- Acces fără conexiune la internet — mesaj controlat
- Conexiune cu server lent — UI responsiv, loader prezent

### Responsive
- Afișare corectă la rezoluții diferite

### BKD-Input
- Validare regex pe filtrul Id
- Validare regex pe filtrul Denumire (select) – doar opțiuni valide
- Validare regex pe filtrul Descriere

### BKD-Proces
- Aplicare combinată sort + filter

## Create (Adăugare)
### Accesare
- Accesarea formularului prin click „Adaugă” din index
- Acces prin buton „Adaugă” din index (prezență, poziționare, text/traducere)
- Double-click pe „Adaugă” — fără efecte nedorite

### Autorizare
- Butonul „Adaugă” ascuns fără permisiune create
- Permisiune createDynamicDocumentGenerationDomains — verificare
- Ascundere buton „Adaugă” pentru neautorizați

### Navigare
- Buton Înapoi — stil & hover
- Înapoi — când formularul e modificat → avertizare pierdere date
- Redirect la index după salvare
- Avertizare pierdere date la navigare (breadcrumbs/meniu/logo/profil)

### Resetare
- Buton Resetează — stil & hover
- Resetează — când e modificat → avertizare

### Adăugare
- Câmp Nume prezent (input)
- Label Nume — RO/EN, poziționare
- Indicator required pentru Nume
- Hint Nume — RO/EN
- Label Descriere — RO/EN
- Textbox Descriere prezent
- Hint Descriere — RO/EN
- Buton Salvează — stil & hover
- Salvează — acțiune validă

### Validare
- Nume: valoare validă → succes
- Nume: validare + condiții specifice (dacă există)
- Nume: format valid dar condiții specifice neîndeplinite
- Nume: format invalid
- Nume: lipire (paste) validă/invalidă
- Nume: necompletat (required)
- Descriere: valoare validă (<100)
- Descriere: validare + condiții specifice (dacă există)
- Descriere: validă dar nu îndeplinește condiții specifice
- Descriere: format invalid
- Descriere: lipire validă/invalidă
- Descriere: necompletat

### Vizualizare
- Formularul create este afișat

### BKD-Input
- Validare Nume – valoare validă (regex)
- Validare Nume – lipire invalidă „@@@”
- Validare Nume – necompletat
- Validare Descriere – valoare validă (<100)
- Validare Descriere – peste limită (101+)

### BKD-Proces
- Submit salvează domeniul și setează Added/AddedBy
- Eroare backend (duplicat name) – toast

### FRT-Confirmare acțiune
- Înapoi cu modificări → dialog confirmare
- Resetează cu modificări → confirmare + reset

### Mesaje
- Toast succes la finalizare (RO/EN, auto-hide, timp)
- Toast eroare la finalizare (RO/EN, auto-hide)
- Avertizare la încercarea de salvare când lipsesc câmpuri obligatorii

### Stabilitate
- Create fără conexiune la internet — mesaj controlat
- Create cu conexiune lentă — loader & UI responsiv
