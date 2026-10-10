import type { AiResponse } from '@/domain/ai';
import { toLocalIsoDate } from '@/domain/application';
import type { ApplicationFormValues } from '@/domain/forms';
import { emptyApplicationForm } from '@/domain/forms';

// Ergebnisse des Assistenten als Formularwerte bzw. als Text für Notizen und Zwischenablage

export const FIT_LABELS = {
  hoch: 'Hohe Passung',
  mittel: 'Mittlere Passung',
  gering: 'Geringe Passung',
};

const list = (items: string[]) => items.map((item) => `• ${item}`).join('\n');

export function extractionToForm(
  extraction: AiResponse<'stellenanzeige'>,
  posting: string,
  today = toLocalIsoDate(new Date()),
): ApplicationFormValues {
  const euro = (value: number | null) =>
    value === null ? '' : new Intl.NumberFormat('de-DE').format(value);
  return {
    ...emptyApplicationForm(today),
    // Aus einer Anzeige entsteht zunächst ein Merkzettel – beworben wird danach
    status: 'saved',
    company: extraction.company,
    role: extraction.role,
    location: extraction.location,
    workMode: extraction.workMode ?? '',
    salaryMin: euro(extraction.salaryMin),
    salaryMax: euro(extraction.salaryMax),
    jobDescription: posting.trim(),
  };
}

export function matchAsText(match: AiResponse<'passung'>) {
  return [
    `${FIT_LABELS[match.fit]}: ${match.summary}`,
    match.matches.length ? `Passt:\n${list(match.matches)}` : '',
    match.gaps.length ? `Lücken:\n${list(match.gaps)}` : '',
    match.talkingPoints.length ? `Betonen:\n${list(match.talkingPoints)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function preparationAsText(preparation: AiResponse<'vorbereitung'>) {
  const questions = preparation.questions
    .map(({ question, hint }, index) => `${index + 1}. ${question}\n   → ${hint}`)
    .join('\n');
  return [
    `Mögliche Fragen:\n${questions}`,
    preparation.questionsToAsk.length
      ? `Meine Rückfragen:\n${list(preparation.questionsToAsk)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function draftAsText(draft: AiResponse<'entwurf'>) {
  return `Betreff: ${draft.subject}\n\n${draft.body}`;
}
