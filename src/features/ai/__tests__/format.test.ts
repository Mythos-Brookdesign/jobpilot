import {
  draftAsText,
  extractionToForm,
  matchAsText,
  preparationAsText,
} from '@/features/ai/format';

describe('extractionToForm', () => {
  it('füllt das Formular als Merkzettel mit Anzeigentext und formatierten Gehältern', () => {
    const values = extractionToForm(
      {
        company: 'Nordlicht',
        role: 'Senior Dev',
        location: 'Berlin',
        workMode: null,
        salaryMin: 75000,
        salaryMax: null,
        skills: ['React'],
        contactName: null,
        contactEmail: null,
        summary: '…',
      },
      '  Anzeigentext  ',
      '2026-10-10',
    );
    expect(values).toMatchObject({
      status: 'saved',
      company: 'Nordlicht',
      workMode: '',
      salaryMin: '75.000',
      salaryMax: '',
      appliedAt: '2026-10-10',
      jobDescription: 'Anzeigentext',
    });
  });
});

describe('Ergebnisse als Text', () => {
  it('fasst die Passung mit Abschnitten zusammen und lässt leere weg', () => {
    expect(
      matchAsText({
        fit: 'hoch',
        summary: 'Passt gut.',
        matches: ['React', 'Node.js'],
        gaps: [],
        talkingPoints: ['CI/CD'],
      }),
    ).toBe('Hohe Passung: Passt gut.\n\nPasst:\n• React\n• Node.js\n\nBetonen:\n• CI/CD');
  });

  it('nummeriert die Fragen der Vorbereitung', () => {
    expect(
      preparationAsText({
        questions: [{ question: 'Warum wir?', why: '…', hint: 'Produkt kennen' }],
        questionsToAsk: ['Wie groß ist das Team?'],
      }),
    ).toBe(
      'Mögliche Fragen:\n1. Warum wir?\n   → Produkt kennen\n\nMeine Rückfragen:\n• Wie groß ist das Team?',
    );
  });

  it('stellt dem Entwurf den Betreff voran', () => {
    expect(draftAsText({ subject: 'Danke', body: 'Hallo' })).toBe('Betreff: Danke\n\nHallo');
  });
});
