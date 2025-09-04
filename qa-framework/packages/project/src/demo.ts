import { applyProjectStandards } from './index';

// Simulated minimal planner plan (with gaps) — RO
const draftPlan = {
  meta: { nume: 'Accesare' },
  // intentionally missing titlu, descriere_generala, severitate, prioritate
  data: {
    // missing email_regex/telefon_regex which will be filled
  },
  module: 'Accesare'
};

async function main() {
  const enriched = await applyProjectStandards(draftPlan, process.env.PROJECT_ID || undefined);
  console.log(JSON.stringify(enriched, null, 2));
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});


