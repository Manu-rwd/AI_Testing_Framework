import { TUSNormalized } from "./schema";

export function buildGaps(us: TUSNormalized): string[] {
  const gaps: string[] = [];

  // Buckets
  if (us.buckets.length === 0) {
    gaps.push("Confirmați bucket-urile UI implicate: **Tabel** și/sau **Formular**.");
  }

  // Fields + regex
  if (us.fields.length === 0) {
    gaps.push("Lipsesc câmpurile formularului/tabelei. Vă rugăm să listați câmpurile și tipurile acestora.");
  } else {
    const missing = us.fields.filter(f => !f.regex).map(f => f.name);
    if (missing.length) {
      gaps.push(`Lipsesc regex-urile pentru câmpurile: ${missing.join(", ")}.`);
    }
  }

  // Permissions
  if (us.permissions.length === 0) {
    gaps.push("Specificați permisiunile/rolurile care pot accesa/acționa această funcționalitate (ex.: SuperAdmin, ProjectManager).");
  }

  // Routes
  if (us.routes.length === 0) {
    gaps.push("Indicați rutele/endpoint-urile relevante (Ruta:, URL:, Endpoint:).");
  }

  // Messages
  if (us.messages.toasts.length + us.messages.errors.length + us.messages.empty_states.length === 0) {
    gaps.push("Adăugați mesaje așteptate (toast/eroare/empty state) pentru acțiunile principale.");
  }

  // Negatives
  if (us.negatives.length === 0) {
    gaps.push("Adăugați scenarii negative (ex.: input invalid, permisiuni insuficiente, timeouts).");
  }

  return gaps;
}

export function gapsMarkdown(us: TUSNormalized, gaps: string[]): string {
  return [
    `# US_Gaps`,
    ``,
    `Scor încredere (overall): **${us.confidence.overall}**`,
    ``,
    `## Întrebări / Clarificări`,
    ...gaps.map(g => `- ${g}`),
    ``,
    `## Observații`,
    `- Proveniență respectată: US > Project > Defaults.`,
    `- Vă rugăm să răspundeți în același document sau în ticketul asociat.`,
    ``,
  ].join("\n");
}


