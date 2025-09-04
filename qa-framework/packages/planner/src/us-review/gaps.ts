import { USNormalized } from "./schema";

export interface GapItem { message: string; }

export function buildGaps(n: USNormalized): GapItem[] {
  const gaps: GapItem[] = [];

  if (!n.buckets.length) {
    gaps.push({ message: "Lipsește tipul de bucket. Specificați dacă este **Formular** sau **Tabel**." });
  }

  const fields = n.fields || [];
  const missingRegex = fields.filter(f => !f.regex).map(f => f.name);
  if (fields.length === 0) {
    gaps.push({ message: "Nu sunt definite câmpuri. Enumerați câmpurile (nume, tip, regex dacă e posibil)." });
  } else if (missingRegex.length) {
    gaps.push({ message: `Lipsesc **regex-urile** pentru câmpurile: ${missingRegex.join(", ")}.` });
  }

  if (!n.permissions.length) {
    gaps.push({ message: "Nu sunt definite **permisiuni**. Enumerați rolurile/permisiunile necesare (ex.: admin, editor, vizualizare)." });
  }

  if (!n.routes.length) {
    gaps.push({ message: "Nu este definită **Ruta** (ex.: /conturi/adauga [POST])." });
  }

  const msgCount = (n.messages.toasts?.length || 0) + (n.messages.errors?.length || 0) + (n.messages.empty_states?.length || 0);
  if (msgCount === 0) {
    gaps.push({ message: "Nu sunt definite **Mesaje** (toast/eroare/gol)." });
  }

  // Negatives are optional but useful
  if (!n.negatives.length) {
    gaps.push({ message: "Adăugați câteva **Negative** (scenarii care nu trebuie să se întâmple)." });
  }

  return gaps;
}

export function gapsMarkdown(gaps: GapItem[]): string {
  const lines: string[] = [];
  lines.push("# US_Gaps");
  lines.push("");
  if (!gaps.length) {
    lines.push("Nu au fost identificate lacune majore. ✅");
  } else {
    lines.push("Întrebări și lipsuri identificate:");
    lines.push("");
    for (const g of gaps) {
      lines.push(`- ${g.message}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}


