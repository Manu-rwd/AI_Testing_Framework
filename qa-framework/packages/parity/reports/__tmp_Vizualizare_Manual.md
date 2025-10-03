# Plan de testare — Vizualizare

- [auth] Neautorizat — 403 la acces direct {facets:403}
<!-- provenance: uiux -->
- [auth] Neautorizat — elemente dezactivate (disabled) {facets:disabled}
<!-- provenance: uiux -->
- [auth] Neautorizat — eroare la click (toast/dialog) {facets:eroare, click}
<!-- provenance: uiux -->
- [auth] Neautorizat — elemente ascunse (hidden) {facets:hidden}
<!-- provenance: uiux -->
- [auth] Rol non-admin — permisiuni limitate {facets:rol, non-admin}
<!-- provenance: uiux -->
- [auth] Neautentificat — redirect catre '/login' {facets:redirect}
<!-- provenance: uiux -->
- [columns] Coloana 'Nume' — header/facets vizibilitate, aliniere, iconografie {facets:tabel, coloana, header}
<!-- provenance: uiux -->
- [columns] Coloana 'Nume' — valoare corecta (format, masca, constrangeri, link/CTA) {facets:tabel, valoare}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'auth' — verificari de baza prezente {facets:overlay, auth}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'columns' — verificari de baza prezente {facets:overlay, columns}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'pagination' — verificari de baza prezente {facets:overlay, pagination}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'presence' — verificari de baza prezente {facets:overlay, presence}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'resilience' — verificari de baza prezente {facets:overlay, resilience}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'responsive' — verificari de baza prezente {facets:overlay, responsive}
<!-- provenance: uiux -->
- [overlay] Familia overlay 'sorting' — verificari de baza prezente {facets:overlay, sorting}
<!-- provenance: uiux -->
- [pagination] Selector marime pagina vizibil si aplica filtrul {facets:paginare, page-size}
<!-- provenance: uiux -->
- [pagination] Controale pager (first/prev/next/last) cu stare dezactivata la margini {facets:paginare, pager}
<!-- provenance: uiux -->
- [presence] Meniu vizibilitate coloane disponibil {facets:coloane, vizibilitate}
<!-- provenance: uiux -->
- [presence] Container pagina/tabela/formular exista {facets:prezenta, container}
<!-- provenance: uiux -->
- [presence] Rand stare incarcare (loading) / skeleton vizibil {facets:loading}
<!-- provenance: uiux -->
- [presence] Stare fara rezultate (no results) afisata corect {facets:gol}
<!-- provenance: uiux -->
- [presence] Cautare (search) vizibila si functionala {facets:cautare}
<!-- provenance: uiux -->
- [presence] Header tabel lipicios (sticky) activat {facets:sticky}
<!-- provenance: uiux -->
- [resilience] Drop conexiune la acces — comportament UI conform {facets:drop, acces}
<!-- provenance: uiux -->
- [resilience] Drop conexiune in timpul interactiunii — comportament UI conform {facets:drop, interactiune}
<!-- provenance: uiux -->
- [resilience] Offline — acces si afisare conform specificatiei {facets:offline}
<!-- provenance: uiux -->
- [resilience] SLA incarcare — TTFB sub 2000ms, spinner/schelet prezent {facets:loading, SLA}
<!-- provenance: uiux -->
- [resilience] Retea lenta — feedback si timeouts adecvate {facets:slow}
<!-- provenance: uiux -->
- [responsive] Breakpoint 'md' — layout, colapse coloane, controale critice vizibile, overflow gestionat {facets:responsive, md}
<!-- provenance: uiux -->
- [sorting] Sortare 'Nume' — ASC corecta (ASC) {facets:sortare, asc}
<!-- provenance: uiux -->
- [sorting] Sortare 'Nume' — DESC corecta (DESC) {facets:sortare, desc}
<!-- provenance: uiux -->
