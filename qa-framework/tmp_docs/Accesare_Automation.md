# Plan de Automatizare — Accesare

Generat: 2025-09-05T11:33:08.158Z
Sursă: US

| tipFunctionalitate | bucket | feasibility | confidence | rule_tags |
|---|---|---|---|---|
| Adaugare | Login | A | 73.5% | auth, happy |
| Adaugare | Form | B | 90.0% | forms |


---

## Login — Adaugare

**Narațiune**
A narrative, with comma

**Atomi (AAA)**
```
{"setup":["Open app"],"action":["Click \"Login\""],"assert":["He said: \"quote\""]}
```

**Selectori**
needs: needs-ids, roles
strategy: data-testid-preferred

**Profil de date**
{required:[user,pass]}

**Proveniență**
source: US
Line1
Line2


---

## Form — Adaugare

**Narațiune**
Fill form and submit

**Atomi (AAA)**
```
{"setup":["Navigate to form"],"action":["Type data","Submit"],"assert":["See success"]}
```

**Selectori**
needs: labels
strategy: role

**Profil de date**
{required:[nume],generators:{nume:faker.name}}

**Proveniență**
source: project
