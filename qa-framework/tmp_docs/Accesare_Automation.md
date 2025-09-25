# Accesare — Automation Plan

## Login — Utilizatorul se autentifică cu email și parolă valide.

### Arrange
- Deschide aplicația

### Act
- Introdu email
- Introdu parolă
- Apasă Autentificare

### Assert
- Este autentificat

### Selectors
- needs: needs-ids, roles
- strategy: role-with-name

### Data Profile
minimal_valid

### Feasibility
A — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `auth`, `happy`

### Confidence
74.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Form — Completează profilul cu nume și telefon.

### Arrange
- Navighează la profil

### Act
- Introdu nume
- Introdu telefon

### Assert
- Profil salvat

### Selectors
- needs: label, aria
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
B — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `form`

### Confidence
70.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Form — Validează lungime maximă pentru nume.

### Arrange
- Navighează la profil

### Act
- Introdu nume foarte lung

### Assert
- Apare eroare de validare

### Selectors
- needs: text
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
C — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `validation`

### Confidence
62.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Form — Validare format telefon.

### Arrange
- Navighează la profil

### Act
- Introdu telefon invalid

### Assert
- Apare eroare

### Selectors
- needs: roles
- strategy: role-with-name

### Data Profile
edge_empty

### Feasibility
C — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `validation`

### Confidence
63.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Form — Validare regex email invalid.

### Arrange
- Navighează la login

### Act
- Introdu email invalid

### Assert
- Eroare email

### Selectors
- needs: aria
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
D — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `validation`

### Confidence
57.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Vizualizare — Vizualizează datele de profil.

### Arrange
- Navighează la profil

### Act

### Assert
- Numele este afișat
- Telefonul este afișat

### Selectors
- needs: text
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
A — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `read`

### Confidence
72.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Vizualizare — Vezi mesaj de gol.

### Arrange
- Golește profil

### Act

### Assert
- Mesaj lipsă date

### Selectors
- needs: aria, text
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
B — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `empty`

### Confidence
66.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Vizualizare — Listă utilizatori.

### Arrange
- Navighează la listă

### Act

### Assert
- Se afișează 10 elemente

### Selectors
- needs: css
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
B — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `list`

### Confidence
68.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Vizualizare — Căutare utilizator.

### Arrange
- Navighează la listă

### Act
- Introdu nume în căutare

### Assert
- Rezultate filtrate

### Selectors
- needs: label
- strategy: data-testid-preferred

### Data Profile
edge_empty

### Feasibility
C — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `search`

### Confidence
62.0%

### Notes
selector_provenance=US ; profile_provenance=defaults

## Vizualizare — Paginare listă.

### Arrange
- Navighează la listă

### Act
- Apasă următorul

### Assert
- Pagina 2 vizibilă

### Selectors
- needs: roles, text
- strategy: role-with-name

### Data Profile
edge_empty

### Feasibility
B — A/B = codegen-ready; C/D/E = needs work

### Provenance
source: `US`
rule tags: `pagination`

### Confidence
67.0%

### Notes
selector_provenance=US ; profile_provenance=defaults