# Modul Review — Propuneri_tehnice (Centralizatoare)
> Înapoi la [Propuneri_tehnice — Index](Propuneri_tehnice.md)

## Status & Scope
- Status: Needs work
- Modul: Propuneri_tehnice — Centralizatoare
- Sursă: US (prioritar) + QA (practici), project (fallback)

## Rezumat review
### După dispoziție
| Dispoziție | Nr. |
|------------|-----|
| Approved   | 40 |
| Needs work | 1 |
| Blocked    | 1 |

### După fezabilitate
| Fezabilitate | Nr. |
|--------------|-----|
| A | 27 |
| B | 13 |
| C | 1 |
| D | 1 |
| E | 0 |

## Cazuri de testare (QA-granular)
### Activare
#### Dialog
**01. Click pe Activate deschide dialogul de confirmare cu titlul corect**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index?&ShowActive=false')
  - Acțiune:
    - clickRowAction(id='button_activate', row=1)
  - Aserțiuni:
    - modalVisible(title='Are you sure you want to activate?')
  - Oracol: `dialog` • Fezabilitate: **A** • Sursă: `US`

**02. Anularea activării închide dialogul fără schimbări**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index?&ShowActive=false')
  - Acțiune:
    - clickRowAction(id='button_activate', row=1)
    - click(id='button_no')
  - Aserțiuni:
    - modalClosed()
    - rowStillInactive(row=1)
  - Oracol: `dialog` • Fezabilitate: **A** • Sursă: `US`

#### Vizualizare
**01. În lista de inactive, coloana Acțiuni conține butonul Activate în loc de Delete**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index?&ShowActive=false')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - buttonVisible(id='button_activate')
    - buttonNotVisible(id='button_delete')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

#### Ștergere/Activare
**01. Confirmarea activării setează Deleted=0 și afișează mesaj de succes**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index?&ShowActive=false')
  - Acțiune:
    - clickRowAction(id='button_activate', row=1)
    - click(id='button_yes')
  - Aserțiuni:
    - toast(type='success', textIncludes='Activarea a fost realizată cu succes')
    - rowActivated(row=1)
  - Oracol: `integration` • Fezabilitate: **B** • Sursă: `US`
  - Parametri necesari: seed-db:centralizers(inactive&gt;=1)

### Create
#### Mesaje
**01. Salvare cu succes redirecționează la index și afișează toast de succes**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - type('#input_centralizer_name','Alpha')
    - type('#input_centralizer_description','Primul')
    - click(id='button_save')
  - Aserțiuni:
    - redirectedTo('/auction-document/data-centralizer/index')
    - toast(type='success')
    - rowExists(name='Alpha')
  - Oracol: `integration` • Fezabilitate: **A** • Sursă: `US`

#### Navigare
**01. Butonul Înapoi revine la index fără salvare**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - click(id='back_button')
  - Aserțiuni:
    - urlEquals('/auction-document/data-centralizer/index')
    - noToast(type='error')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

#### Resetare
**01. Butonul Reset golește formularul**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - type('#input_centralizer_name','X')
    - type('#input_centralizer_description','Y')
    - click(id='reload_button')
  - Aserțiuni:
    - valueEquals('#input_centralizer_name','')
    - valueEquals('#input_centralizer_description','')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

#### Validare
**01. Validare Name: 0 caractere afișează eroarea 'Introdu un nume!'**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - clear('#input_centralizer_name')
    - click(id='button_save')
  - Aserțiuni:
    - toast(type='error', textIncludes='Introdu un nume!')
  - Oracol: `toast` • Fezabilitate: **A** • Sursă: `US`

**02. Validare Name: acceptă 1–55 caractere, doar litere și spații**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - type('#input_centralizer_name','N'*56)
    - blur('#input_centralizer_name')
    - type('#input_centralizer_name','Valid Name')
  - Aserțiuni:
    - maxLengthEnforced('#input_centralizer_name',55)
    - matchesRegex('#input_centralizer_name','^[a-zA-Z ]{1,55}$')
  - Oracol: `validation` • Fezabilitate: **A** • Sursă: `US`

**03. Validare Description: permite litere/cifre/spațiu până la 255**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - type('#input_centralizer_description','Invalid_@@')
    - type('#input_centralizer_description','Descriere 123')
  - Aserțiuni:
    - matchesRegex('#input_centralizer_description','^[a-zA-Z0-9 ]{1,255}$')
  - Oracol: `validation` • Fezabilitate: **A** • Sursă: `US`

**04. Eroare la nume duplicat: 'Există deja un centralizator cu această denumire!'**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - type('#input_centralizer_name','Alpha')
    - click(id='button_save')
  - Aserțiuni:
    - toast(type='error', textIncludes='Există deja un centralizator')
  - Oracol: `toast` • Fezabilitate: **B** • Sursă: `US`
  - Parametri necesari: seed-db:centralizers(name='Alpha')

#### Vizualizare
**01. Formularul de creare afișează câmpurile Name și Description cu hint/hover**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/create')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - fieldVisible(id='input_centralizer_name')
    - hintVisible('Introdu denumirea centralizatorului')
    - fieldVisible(id='input_centralizer_description')
    - hintVisible('Introdu descrierea centralziatorului')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

### Delete
#### Dialog
**01. Click pe Șterge deschide modalul de confirmare cu titlul corect**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickRowAction(id='button_delete', row=1)
  - Aserțiuni:
    - modalVisible(title='Sigur doriți să ștergeți acest centralizator?')
  - Oracol: `dialog` • Fezabilitate: **A** • Sursă: `US`

**02. Anularea ștergerii (Nu) închide modalul fără efecte**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickRowAction(id='button_delete', row=1)
    - click(id='button_no')
  - Aserțiuni:
    - modalClosed()
    - rowStillPresent(row=1)
  - Oracol: `dialog` • Fezabilitate: **A** • Sursă: `US`

#### Ștergere/Activare
**01. Confirmarea ștergerii setează Deleted=1 și apare mesaj de succes**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickRowAction(id='button_delete', row=1)
    - click(id='button_yes')
  - Aserțiuni:
    - toast(type='success')
    - rowMarkedDeleted(row=1)
  - Oracol: `integration` • Fezabilitate: **B** • Sursă: `US`
  - Parametri necesari: seed-db:centralizers(existing&gt;=1)

### Index
#### Accesare
**01. Accesarea paginii Centralizatoare prin meniul Acasă → APLICAȚII → Licitații → Administrare → Centralizatoare**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - navigate.menu(['Acasă','APLICAȚII','Licitații','Administrare','Centralizatoare'])
  - Acțiune:
    - click(menuItem='Centralizatoare')
  - Aserțiuni:
    - urlEquals('/auction-document/data-centralizer/index')
    - hasHeading('Centralizatoare')
    - breadcrumb(['Acasă','Propuneri tehnice','Centralizatoare'])
  - Oracol: `functional-ui` • Fezabilitate: **B** • Sursă: `US`
  - Nevoi selectori: data-testid for each menu node (ex: data-testid='menu-centralizatoare')

**02. Accesarea directă prin URL a paginii Centralizatoare**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
  - Acțiune:
    - goto(path='auction-document/data-centralizer/index')
  - Aserțiuni:
    - urlEquals('/auction-document/data-centralizer/index')
    - hasHeading('Centralizatoare')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

**03. Clicks repetate pe meniu nu declanșează navigări multiple**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - navigate.menuPath('.../Centralizatoare')
  - Acțiune:
    - doubleClick(menuItem='Centralizatoare')
  - Aserțiuni:
    - singleNavigationEvent()
    - noDuplicateRequests()
  - Oracol: `integration` • Fezabilitate: **C** • Sursă: `US`
  - Nevoi selectori: data-testid on menu item for robust event tracking

**04. Comportament fără conexiune la internet: se afișează mesaj de eroare prietenos**
  - Setup:
    - openApp(env='test')
    - simulateNetwork(offline=True)
  - Acțiune:
    - goto(path='auction-document/data-centralizer/index')
  - Aserțiuni:
    - toast(type='error')
    - textIncludes('Conexiune indisponibilă')
  - Oracol: `toast` • Fezabilitate: **D** • Sursă: `US`
  - Note: Visual/message copy may vary; requires visual oracle or i18n hooks

**05. Conexiune lentă: spinner afișat; timeout rezonabil; pagina randează după răspuns**
  - Setup:
    - openApp(env='test')
    - login()
    - throttleNetwork('slow3g')
    - goto(path='.../index')
  - Acțiune:
    - waitFor(selector='[role=status][aria-busy=true]')
  - Aserțiuni:
    - spinnerDisappears()
    - gridVisible()
  - Oracol: `functional-ui` • Fezabilitate: **B** • Sursă: `US`
  - Nevoi selectori: role=status spinner landmark recommended

**06. Utilizator fără permisiunea viewCentralizer nu poate accesa pagina**
  - Setup:
    - openApp(env='test')
    - login(role='UserNoCentralizer')
  - Acțiune:
    - goto(path='.../index')
  - Aserțiuni:
    - forbiddenOrRedirect()
    - noGridVisible()
  - Oracol: `state` • Fezabilitate: **B** • Sursă: `US`

**07. Click pe + Adaugă navighează la formularul de creare**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - click(id='button_create')
  - Aserțiuni:
    - urlEquals('/auction-document/data-centralizer/create')
    - breadcrumb(['Acasă','Propuneri tehnice','Centralizatoare','Adaugă centralizator'])
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

#### Ordonare
**01. Sortare Id asc/desc funcțională**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('Id','asc')
    - clickSort('Id','desc')
  - Aserțiuni:
    - columnSorted('Id','asc')
    - columnSorted('Id','desc')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

**02. Sortare Name asc/desc funcțională**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('Name','asc')
    - clickSort('Name','desc')
  - Aserțiuni:
    - columnSorted('Name','asc')
    - columnSorted('Name','desc')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

**03. Sortare Description activă**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('Description','asc')
    - clickSort('Description','desc')
  - Aserțiuni:
    - columnSorted('Description','asc')
    - columnSorted('Description','desc')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

**04. Sortare Added asc/desc funcțională conform specificației controllerului**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('Added','asc')
    - clickSort('Added','desc')
  - Aserțiuni:
    - columnSorted('Added','asc')
    - columnSorted('Added','desc')
  - Oracol: `functional-ui` • Fezabilitate: **B** • Sursă: `US`
  - Nevoi selectori: column header id or data-testid for Added

**05. Sortare AddedBy asc/desc funcțională conform specificației controllerului**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('AddedBy','asc')
    - clickSort('AddedBy','desc')
  - Aserțiuni:
    - columnSorted('AddedBy','asc')
    - columnSorted('AddedBy','desc')
  - Oracol: `functional-ui` • Fezabilitate: **B** • Sursă: `US`
  - Nevoi selectori: column header id or data-testid for AddedBy

**06. Sortare Updated asc/desc funcțională conform specificației controllerului**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('Updated','asc')
    - clickSort('Updated','desc')
  - Aserțiuni:
    - columnSorted('Updated','asc')
    - columnSorted('Updated','desc')
  - Oracol: `functional-ui` • Fezabilitate: **B** • Sursă: `US`
  - Nevoi selectori: column header id or data-testid for Updated

**07. Sortare UpdatedBy asc/desc funcțională conform specificației controllerului**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - clickSort('UpdatedBy','asc')
    - clickSort('UpdatedBy','desc')
  - Aserțiuni:
    - columnSorted('UpdatedBy','asc')
    - columnSorted('UpdatedBy','desc')
  - Oracol: `functional-ui` • Fezabilitate: **B** • Sursă: `US`
  - Nevoi selectori: column header id or data-testid for UpdatedBy

#### Paginatie
**01. Paginația este activă; dimensiune implicită 20 elemente**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - paginationVisible()
    - pageSizeEquals(20)
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

#### Validare
**01. Coloana Id acceptă doar cifre (regex ^[0-9]+$)**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - type(columnFilter='Id', text='abc')
  - Aserțiuni:
    - noResultsOrValidationError()
    - type(columnFilter='Id', text='123')
    - resultsMatchRegex('Id','^[0-9]+$')
  - Oracol: `validation` • Fezabilitate: **B** • Sursă: `US`

**02. Coloana Name respectă regex ^[a-zA-Z ]{1,55}$ în filtre**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - type(columnFilter='Name', text='@@@')
    - type(columnFilter='Name', text='Valid Name')
  - Aserțiuni:
    - resultsMatchRegex('Name','^[a-zA-Z ]{1,55}$')
  - Oracol: `validation` • Fezabilitate: **B** • Sursă: `US`

**03. Coloana Description respectă regex ^[a-zA-Z0-9 ]{1,255}$ în filtre**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - type(columnFilter='Description', text='***')
    - type(columnFilter='Description', text='Some description 123')
  - Aserțiuni:
    - resultsMatchRegex('Description','^[a-zA-Z0-9 ]{1,255}$')
  - Oracol: `validation` • Fezabilitate: **B** • Sursă: `US`

#### Vizualizare
**01. Tabelul cu centralizatoare este vizibil cu coloanele: Acțiuni, Id, Name, Description**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - tableHasColumns(['Acțiuni','Id','Name','Description'])
    - rowCount()&gt;=0
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

**02. Coloana Acțiuni este prima, aliniere centru, sortare dezactivată**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - columnIsFirst('Acțiuni')
    - headerAlign('Acțiuni','center')
    - sortingDisabled('Acțiuni')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

**03. În coloana Acțiuni este vizibil butonul View Details cu icon și hover corecte**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - buttonVisible(id='button_view')
    - buttonHasIcon(id='button_view', icon='fas fa-eye')
    - buttonHoverText(id='button_view', text='Vezi mai multe detalii')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`
  - Nevoi selectori: ensure unique #button_view per row or data-testid with row index

**04. În coloana Acțiuni este vizibil butonul Edit cu icon și hover corecte**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - buttonVisible(id='button_edit')
    - buttonHasIcon(id='button_edit', icon='fas fa-pencil-alt')
    - buttonHoverText(id='button_edit', text='Modifică')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`
  - Nevoi selectori: ensure unique #button_edit per row or data-testid with row index

**05. În coloana Acțiuni este vizibil butonul Delete cu icon și hover corecte**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - buttonVisible(id='button_delete')
    - buttonHasIcon(id='button_delete', icon='fas fa-trash')
    - buttonHoverText(id='button_delete', text='Șterge')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`
  - Nevoi selectori: ensure unique #button_delete per row or data-testid with row index

**06. Butonul + Adaugă este vizibil în dreapta titlului, cu icon și hover corecte**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - waitFor(routeContains='data-centralizer/index')
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - buttonVisible(id='button_create')
    - buttonHasIcon(id='button_create', icon='fas fa-plus')
    - buttonHoverText(id='button_create', text='Adaugă centralizator')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

### Update
#### Mesaje
**01. Actualizare cu succes afișează toast de succes și revine la index**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - clickRowAction(id='button_edit', row=1)
  - Acțiune:
    - type('#input_centralizer_name','Beta')
    - click(id='button_save')
  - Aserțiuni:
    - redirectedTo('/auction-document/data-centralizer/index')
    - toast(type='success')
    - rowExists(name='Beta')
  - Oracol: `integration` • Fezabilitate: **A** • Sursă: `US`

#### Validare
**01. Validare Name pe modificare respectă aceleași reguli (1–55, regex)**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - clickRowAction(id='button_edit', row=1)
  - Acțiune:
    - clear('#input_centralizer_name')
    - click(id='button_save')
  - Aserțiuni:
    - toast(type='error', textIncludes='Introdu un nume!')
  - Oracol: `toast` • Fezabilitate: **A** • Sursă: `US`

#### Vizualizare
**01. Formularul de modificare afișează câmpurile cu valorile existente**
  - Setup:
    - openApp(env='test')
    - login(role='SuperAdmin')
    - goto(path='auction-document/data-centralizer/index')
    - clickRowAction(id='button_edit', row=1)
  - Acțiune:
    - (n/a)
  - Aserțiuni:
    - fieldVisible('#input_centralizer_name')
    - valueNotEmpty('#input_centralizer_name')
    - fieldVisible('#input_centralizer_description')
  - Oracol: `functional-ui` • Fezabilitate: **A** • Sursă: `US`

## Observații & note
- Selectorii de coloană pentru Added/Updated necesită id/data-testid dedicate.
- Pentru meniul de navigare recomandăm `data-testid` pe fiecare nod.
- Stările offline/lent necesită oracol vizual sau hook de mesaj.
- Duplicate name: nevoie de seed fix pentru un nume existent (ex: Alpha).

## Changelog
- 2025-09-15: Generare detaliată cu cazuri enumerate pe tip și bucket.

## Cheatsheet CLI (PowerShell)
# exemple; separator ';' în loc de '&&'
pnpm --filter @pkg/planner start -- --area "Propuneri_tehnice" --func "Centralizatoare" --emit csv --out .\exports ;
node .\review\extend_csv.ts --in .\exports\Propuneri_tehnice_Centralizatoare.csv --schema v1 ;
pnpm --filter @pkg/planner start -- --area "Propuneri_tehnice" --func "Centralizatoare" --emit md --out .\docs\modules
