# Module Automation Plans

Acest director contine planuri de automatizare generate pentru module (ex: `Adăugare`).

- A–E Fezabilitate:
  - A: selectori stabili, date simple, un singur flux — codegen-ready
  - B: minor dinamică sau 2–3 rute — abordabil
  - C: DOM instabil ori lipsă parțială de selectori — mediu
  - D: async/3rd-party sau oracol neclar — dificil
  - E: blocat (mediu/permisiuni/selectori critici lipsă)

Fișiere generate:
- `docs/modules/<Module>_Automation.md`
- `exports/<Module>_Automation.csv`
