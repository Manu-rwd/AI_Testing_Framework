# Plan Adaugare v2

## Rând 1: Verifică fluxul de adăugare în bucket-ul Formular.

**Fezabilitate:** B

**Bucket:** Formular · **Oracle:** dom · **Sursă:** us · **Încredere rând:** 0.70 · **Etichete:** crud, create

- **Arrange**:
  - Navighează la /cont/nou
  - Completează email cu qa@example.com
- **Act**:
  - Trimite formularul (/cont/nou/submit)
- **Assert**:
  - Apare mesajul Cont creat cu succes

---
**Încredere plan (overall):** 0.70
