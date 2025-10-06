# Plan RO — Tip: Vizualizare (Automation-first demo)
### Câmpuri & regex din US (none detected)

---
## Accesare — Tabel
1. Accesarea funcționalității prin apăsare <buton> [Domenii ECF] {prezență, comportament}
   - _Atoms_: setup(login, perm=indexDynamicDocumentGenerationDomains) → action(click button[name='Domenii ECF']) → assert(table visible)
   - _Selectors_: role=button[name='Domenii ECF'] sau data-testid=button_domenii_ecf
   - _Meta_: source=US; confidence=0.9; rule_tags=buckets:from_us; include_gv; strategy=role; profile=minimal_valid; feasibility_suggested=A

2. Accesarea funcționalității prin introducerea directă a URL-ului în bara de adrese {comportament}
   - _Atoms_: setup(login) → action(goto '/dynamic-document-generation/domains/index') → assert(table visible)
   - _Selectors_: locator pentru tabel: role=table[name=/Domenii ECF/i] sau data-testid=table_domains
   - _Meta_: source=US; confidence=0.85; rule_tags=buckets:from_us; include_gv; strategy=role; profile=minimal_valid; feasibility_suggested=A

## Autorizare — Tabel
1. Acces fără permisiune la pagina Domenii ECF {comportament, mesaj}
   - _Atoms_: setup(user fără permisiune) → action(goto '/domains/index') → assert(redirect la login sau 403)
   - _Selectors_: oracle: URL sau element pe pagină (login/403)
   - _Meta_: source=assumed; confidence=0.6; rule_tags=negatives:template; strategy=url_oracle; profile=account_no_perm; feasibility_suggested=B

## FRT-Output final — Tabel
1. Apăsare pe acțiunea <buton> [Vezi detalii] din rând {comportament, mesaj}
   - _Atoms_: setup(seed row) → action(click button[id='button_view']) → assert(navigare sau modal detalii)
   - _Selectors_: data-testid='button_view' sau role=button[name=/Vezi/i] ancorat la rând
   - _Meta_: source=US; confidence=0.8; rule_tags=buckets:from_us; include_gv; strategy=testid; profile=seed_minimal; feasibility_suggested=A

2. Apăsare pe acțiunea <buton> [Editează] din rând {comportament, mesaj}
   - _Atoms_: setup(seed row) → action(click button[id='button_edit']) → assert(navigare la formular de editare)
   - _Selectors_: data-testid='button_edit' sau role=button[name=/Editează/i]
   - _Meta_: source=US; confidence=0.8; rule_tags=buckets:from_us; include_gv; strategy=testid; profile=seed_minimal; feasibility_suggested=A

3. Apăsare pe acțiunea <buton> [Șterge] din rând și confirmare în modal {comportament, mesaj}
   - _Atoms_: setup(seed row) → action(click button[id='button_delete']) → assert(modal confirmare) → action(confirm) → assert(toast succes)
   - _Selectors_: data-testid='button_delete'; modal: role=dialog[name=/Confirm/i]; buton Confirmă
   - _Meta_: source=US; confidence=0.75; rule_tags=buckets:from_us; include_gv; strategy=testid; profile=seed_minimal; feasibility_suggested=B

