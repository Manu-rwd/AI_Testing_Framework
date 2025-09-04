# Plan de testare — Accesare
  
**Modul:** Accesare  
**Severitate:** medie  
**Prioritate:** P2

Acest plan respectă standardele proiectului și completează câmpurile lipsă.

## Câmpuri plan (kv)
| Cheie | Valoare |
|---|---|
| (niciun câmp) | |

## Reguli / Regex
| Cheie | Valoare |
|---|---|
| `input_regex_generic` | ^[\p{L}0-9 _.,:'"-]{1,255}$ |
| `email_regex` | ^[^@\s]+@[^@\s]+\.[^@\s]+$ |
| `telefon_regex` | ^(\+?4?0)?[0-9]{9,10}$ |

## Proveniență completări
| Cheie | Sursă | Regula | Timp |
|---|---|---|---|
| `titlu` | project_default | PRJ-DEFAULT:titlu:0 | 2025-09-04T08:19:59.819Z |
| `descriere_generala` | project_default | PRJ-DEFAULT:descriere_generala:1 | 2025-09-04T08:19:59.820Z |
| `severitate` | project_default | PRJ-DEFAULT:severitate:2 | 2025-09-04T08:19:59.820Z |
| `prioritate` | project_default | PRJ-DEFAULT:prioritate:3 | 2025-09-04T08:19:59.820Z |
| `data.input_regex_generic` | project_default | PRJ-DEFAULT:data.input_regex_generic | 2025-09-04T08:19:59.820Z |
| `data.email_regex` | project_default | PRJ-DEFAULT:data.email_regex | 2025-09-04T08:19:59.820Z |
| `data.telefon_regex` | project_default | PRJ-DEFAULT:data.telefon_regex | 2025-09-04T08:19:59.820Z |
