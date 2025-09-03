# Plan RO — Tip: Adaugare

## Accesare

1. Accesarea functionalitatii prin apasare <element> [nume_element](comportament_element_activ, comportament_element_dezactivat), {prezenta, pozitionare, stil_forma, stil_border, stil_culoare, text-valoare, text-font-size, text-font-family, text-traducere, text-culoare, dimensiune, container-tip_link, container-tip_buton, container-tip_badge, container-stil_border, container-stil_culoare, container-comportament}
   - _Notă_: Comportament_element_activ: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin apăsarea unui element specific [nume_element]. Sistemul trebuie să răspundă corect și prompt la interacțiunea utilizatorului cu acest element, asigurându-se că funcționalitatea solicitată este activată și că utilizatorul primește feedback adecvat. Testul va include verificarea reacției sistemului la apăsarea elementului, timpul de răspuns și corectitudinea funcționalității accesate.
Prezența: Verificare că <element> [nume_element] este prezent în interfață.
Poziționare: Verificare că <element> [nume_element] este poziționat corect în interfață.
Stil_forma: Verificare că forma vizuală a <element> [nume_element] este corectă.
Stil_border: Verificare că bordura <element> [nume_element] este afișată corect.
Stil_culoare: Verificare că culoarea <element> [nume_element] este corectă.
Text-valoare: Verificare că textul din <element> [nume_element] este corect.
Text-font-size: Verificare că dimensiunea fontului din <element> [nume_element] este corectă.
Text-font-family: Verificare că familia de fonturi este corectă.
Text-traducere: Verificare că textul din <element> [nume_element] este corect tradus.
Text-culoare: Verificare că culoarea textului din <element> [nume_element] este corectă.
Dimensiune: Verificare că dimensiunea <element> [nume_element] este corectă.
Container-tip_link: Verificare că linkul este prezent și funcționează corect. Linkul trebuie să fie clicabil și să redirecționeze către adresa specificată fără erori.
Container-tip_buton: Verificare că butonul este prezent și funcționează corect. Butonul trebuie să fie vizibil, să răspundă la clic și să execute acțiunea specificată fără probleme.
Container-tip_badge: Verificare că badge-ul este prezent și funcționează corect. Badge-ul trebuie să fie vizibil și să afișeze corect informațiile (text, numere, etc.) conform specificațiilor.
Container-stil_border: Verificare că bordura containerului este corectă. Bordura trebuie să aibă stilul, grosimea, culoarea și alte proprietăți specificate în design.
Container-stil_culoare: Verificare că culoarea containerului este corectă. Culoarea de fundal și orice alte culori specifice trebuie să respecte cerințele de design și să fie afișate corect pe toate dispozitivele și browserele.
Container-comportament: Verificare că elementele și containerul lor se comportă corect atunci când sunt apăsate.
Exemplu: În modulul de testare Accesare, utilizatorul deschide pagina web și observă că elementul [nume_element] este prezent, poziționat corect, având formă dreptunghiulară, bordură solidă de 1 pixel și culoare de fundal verde. Textul "Submit" este afișat pe element cu dimensiunea fontului de 16 pixeli, fontul Arial, tradus corect în "Trimite", de culoare albă. Elementul este de tip buton și, la clic, se accesează corect funcționalitatea dorită.
..........................................................................................................................
Comportament_element_dezactivat: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin apăsarea unui element specific [nume_element] care este dezactivat. Sistemul trebuie să răspundă corect și prompt la interacțiunea utilizatorului cu acest element, asigurându-se că funcționalitatea solicitată nu este activată și că utilizatorul primește feedback adecvat privind imposibilitatea de a interacționa cu elementul. Testul va include verificarea reacției sistemului la apăsarea elementului, confirmarea că nicio acțiune nu este declanșată și corectitudinea stării dezactivate a elementului.
Prezența: Verificare că <element> [nume_element] este prezent în interfață.
Poziționare: Verificare că <element> [nume_element] este poziționat corect în interfață.
Stil_forma: Verificare că forma vizuală a <element> [nume_element] este corectă.
Stil_border: Verificare că bordura <element> [nume_element] este afișată corect.
Stil_culoare: Verificare că culoarea <element> [nume_element] este corectă.
Text-valoare: Verificare că textul din <element> [nume_element] este corect.
Text-font-size: Verificare că dimensiunea fontului din <element> [nume_element] este corectă.
Text-font-family: Verificare că familia de fonturi este corectă.
Text-traducere: Verificare că textul din <element> [nume_element] este corect tradus.
Text-culoare: Verificare că culoarea textului din <element> [nume_element] este corectă.
Dimensiune: Verificare că dimensiunea <element> [nume_element] este corectă.
Container-tip_link: Verificare că linkul este prezent și funcționează corect. Linkul trebuie să fie vizibil, dar inactiv.
Container-tip_buton: Verificare că butonul este prezent și funcționează corect. Butonul trebuie să fie vizibil, dar inactiv la clic.
Container-tip_badge: Verificare că badge-ul este prezent și funcționează corect. Badge-ul trebuie să fie vizibil și să afișeze corect informațiile, dar inactiv.
Container-stil_border: Verificare că bordura containerului este corectă. Bordura trebuie să aibă stilul, grosimea, culoarea și alte proprietăți specificate în design.
Container-stil_culoare: Verificare că culoarea containerului este corectă. Culoarea de fundal și orice alte culori specifice trebuie să respecte cerințele de design și să fie afișate corect pe toate dispozitivele și browserele.
Container-comportament: Verificare că elementele și containerul lor se comportă corect atunci când sunt dezactivate.
Mousehover: Evaluarea comportamentului la trecerea mouse-ului peste acesta.
Exemplu: 
1. În modulul de testare Accesare, utilizatorul deschide pagina web și observă că elementul [nume_element] este prezent, poziționat corect, având formă dreptunghiulară, bordură solidă de 1 pixel și culoare de fundal verde. Textul "Submit" este afișat pe element cu dimensiunea fontului de 16 pixeli, fontul Arial, tradus corect în "Trimite", de culoare albă. Elementul este de tip buton și, fiind dezactivat, nu răspunde la clic și nu accesează nicio funcționalitate.
2. Utilizatorul observă că butonul [nume_element] este prezent în pagină, dar este dezactivat și nu poate fi apăsat.
2. Accesarea functionalitatii prin apasarea succesiva pe <element> [nume_element] {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin apăsarea succesivă pe un element specific [nume_element]. Sistemul trebuie să gestioneze corect situația în care utilizatorul apasă de mai multe ori pe element, prevenind comportamente neașteptate sau erori și oferind feedback adecvat utilizatorului. Testul va include verificarea reacției sistemului la apăsarea repetată a elementului, timpul de răspuns și corectitudinea funcționalității accesate.

Exemplu: Utilizatorul apasă rapid și repetat pe butonul [nume_element] pentru a trimite un formular. Aplicația procesează o singură dată acțiunea de trimitere și ignoră apăsările succesive suplimentare, afișând un mesaj de confirmare "Formular trimis". De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind apasarea succesivă.
3. Accesarea functionalitatii prin folosirea unei combinatii de taste {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin folosirea unei combinații de taste. Sistemul trebuie să detecteze corect combinația de taste și să activeze funcționalitatea asociată, oferind feedback adecvat utilizatorului. Testul va include verificarea reacției sistemului la utilizarea combinației de taste, timpul de răspuns și corectitudinea funcționalității accesate.

Exemplu: Utilizatorul apasă combinația de taste "Ctrl + S" și aplicația reacționează prompt, salvând datele din formular fără a afișa mesaje de eroare. De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind combinatiile de taste (scurtaturi) corecte.
4. Accesarea functionalitatii prin alegerea unei optiuni din select {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin alegerea unei opțiuni dintr-un element de tip select. Sistemul trebuie să răspundă corect și prompt la interacțiunea utilizatorului cu acest element, asigurându-se că funcționalitatea solicitată este activată și că utilizatorul primește feedback adecvat. Testul va include verificarea reacției sistemului la selecția opțiunii, timpul de răspuns și corectitudinea funcționalității accesate.

Exemplu: Utilizatorul alege opțiunea "Opțiunea 2" dintr-un element de tip select. Aplicația reacționează prompt, afișând informațiile corespunzătoare pentru "Opțiunea 2" și actualizând vizualizarea paginii conform așteptărilor.
5. Accesarea functionalitatii prin apasare <element> [nume_element] {comportament_formular_cu _modificari, comportament_formular_fara_modificari}
   - _Notă_: Comportament_formular_cu _modificari: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin apăsarea unui element specific [nume_element], atunci când există date modificate în formular. Sistemul trebuie să gestioneze corect situația în care utilizatorul încearcă să părăsească pagina sau să acceseze o altă funcționalitate fără a salva modificările, oferind feedback adecvat și opțiuni pentru a preveni pierderea datelor. Testul va include verificarea reacției sistemului la apăsarea elementului, timpul de răspuns și corectitudinea gestionării datelor nesalvate.
Exemplu: Utilizatorul modifică câmpuri în formular și încearcă să acceseze funcționalitatea prin apăsarea butonului [nume_element]. Aplicația afișează un mesaj de confirmare "Aveți modificări nesalvate. Doriți să continuați fără a salva?" și permite utilizatorului să decidă dacă să salveze sau să continue fără salvare. De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind afișarea corectă.

Comportament_formular_fara _modificari: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin apăsarea unui element specific [nume_element], atunci când nu există date modificate în formular. Sistemul trebuie să răspundă corect și prompt la interacțiunea utilizatorului, permițând accesarea funcționalității solicitate fără a oferi avertizări inutile. Testul va include verificarea reacției sistemului la apăsarea elementului, timpul de răspuns și confirmarea că nu sunt afișate mesaje inutile despre salvarea datelor.
Exemplu: Utilizatorul încearcă să acceseze funcționalitatea prin apăsarea butonului [nume_element] atunci când înregistrarea nu există. Aplicația afișează un mesaj de eroare "Înregistrarea nu a fost găsită. Vă rugăm să verificați și să încercați din nou." De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind afișarea corectă.

Hint: In cazul in care se regasesc si alte fipuri de continut se va inlocui formular cu alt tip
6. Accesarea functionalitatii prin apasare <element> [nume_element], atunci cand inregistarera nu exista {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin apăsarea unui element specific [nume_element], atunci când înregistrarea nu există. Sistemul trebuie să gestioneze corect această situație, oferind feedback adecvat utilizatorului și prevenind erori sau comportamente neașteptate. Testul va include verificarea reacției sistemului la apăsarea elementului, timpul de răspuns și corectitudinea mesajelor afișate.
Exemplu: Utilizatorul încearcă să acceseze funcționalitatea prin apăsarea butonului [nume_element] atunci când înregistrarea nu există. Aplicația afișează un mesaj de eroare "Înregistrarea nu a fost găsită. Vă rugăm să verificați și să încercați din nou." De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind afișarea corectă.
7. Accesarea functionalitatii atunci cand nu exista inregistrari {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități atunci când nu există înregistrări disponibile. Sistemul trebuie să gestioneze corect această situație, oferind utilizatorului feedback adecvat și, dacă este necesar, opțiuni alternative. Testul va include verificarea reacției sistemului la absența înregistrărilor, mesajele afișate utilizatorului și corectitudinea gestionării situației.

Exemplu: Utilizatorul accesează pagina de vizualizare, dar nu există nicio înregistrare. Aplicația afișează un mesaj "Nu există înregistrări disponibile" și oferă opțiuni pentru a adăuga noi înregistrări. De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind afișarea corectă.
8. Accesarea functionalitatii prin completare <element> [nume_element] {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin completarea unui element specific [nume_element]. Sistemul trebuie să răspundă corect și prompt la introducerea de date în acest element, activând funcționalitatea asociată și oferind feedback adecvat utilizatorului. Testul va include verificarea reacției sistemului la completarea elementului, timpul de răspuns și corectitudinea funcționalității accesate.

Exemplu: Utilizatorul completează câmpul [nume_element] cu datele necesare și aplicația reacționează prompt, afișând informațiile sau funcționalitatea corespunzătoare.
9. Accesarea functionalitatii prin introducerea directa a URL-ului in bara de adrese {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la accesarea unei funcționalități prin introducerea directă a URL-ului în bara de adrese a browserului. Sistemul trebuie să gestioneze corect această metodă de accesare, asigurându-se că pagina solicitată se încarcă corect și că toate elementele și funcționalitățile sunt disponibile. Testul va include verificarea răspunsului sistemului la URL-ul introdus, timpul de încărcare și corectitudinea afișării și funcționării elementelor de pe pagină.

Exemplu: Utilizatorul introduce direct URL-ul "https://www.exemplu.com/pagina" în bara de adrese și aplicația încarcă corect pagina solicitată, afișând toate elementele și funcționalitățile acesteia. Utilizatorul va verifica, de asemenea, deschiderea linkului într-un alt browser, unde aplicația va solicita logarea în aplicație și apoi va redirecționa automat către linkul corect adăugat.
10. Accesarea functionalitatii atunci cand nu exista conexiune la internet {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la navigarea către pagina sursă atunci când accesul la pagină s-a făcut prin introducerea directă a URL-ului în bara de adrese a browserului. Sistemul trebuie să gestioneze corect navigarea înapoi, oferind utilizatorului feedback adecvat și asigurând o experiență coerentă. Testul va include verificarea funcționalității butonului de navigare înapoi și comportamentul paginii sursă.

Exemplu: Utilizatorul introduce URL-ul "https://www.exemplu.com/detalii" în bara de adrese și apoi apasă butonul "Înapoi" din browser. Aplicația navighează corect către pagina sursă sau afișează un mesaj de eroare dacă nu există o pagină sursă în istoricul browserului. De asemenea, verificați dacă funcționalitatea respectă cerințele descrise în user story privind afișarea corectă.
11. Accesarea functionalitatii atunci cand conexiunea cu server-ul este slaba {comportament}
   - _Notă_: Comportament: Evaluarea comportamentului sistemului la încercarea de accesare a unei funcționalități atunci când nu există conexiune la internet. Sistemul trebuie să gestioneze corect această situație, oferind utilizatorului feedback adecvat și prevenind erori. Testul va include verificarea reacției sistemului la absența conexiunii la internet, mesajele afișate utilizatorului și corectitudinea gestionării situației.

Exemplu: Utilizatorul încearcă să acceseze funcționalitatea în timp ce conexiunea la internet este întreruptă. Aplicația afișează un mesaj de eroare "Nu există conexiune la internet. Verificați conexiunea și încercați din nou" și nu permite accesarea funcționalității până la restabilirea conexiunii. Acest caz de testare se poate testa doar pe mediile de testare Test și Producție. Pe mediul de testare Local nu se poate aplica deoarece localul se poate accesa fără conexiune la internet.

