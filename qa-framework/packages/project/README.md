# @pkg/project — Project Standards Pack

Scop: Să ofere un strat de standarde de proiect care completează câmpurile lipsă din planurile de testare și marchează fiecare completare cu un tag de proveniență.

## Concept
- Ierarhie: User Story (US) → Project → Defaults globale (dacă vor exista în viitor).
- Completăm doar dacă un câmp este nul/indefinit/șir gol.
- Fiecare completare primește `meta.provenance[cheie] = { source, ruleId, timestamp }`.

## Integrare cu Planner
După ce Planner generează planul brut:
```ts
import { withProjectStandards } from './project-standards/bridge';

const finalPlan = await withProjectStandards(draftPlan, { projectId: process.env.PROJECT_ID });
```

## Profiluri de proiect
- Implicit: `data/projects/default.project.yaml`
- Exemplu CRM: `data/projects/sample.crm.project.yaml`

## Rulare demo
```bash
pnpm --filter @pkg/project run dev
```


