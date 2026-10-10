import type { JobApplication } from '@/domain/application';
import { toCsv } from '@/domain/csv';

const application: JobApplication = {
  id: 'a1',
  company: 'Form & Funktion',
  role: 'Senior React Developer',
  location: 'Hamburg',
  appliedAt: '2026-10-07',
  status: 'interview',
};

describe('toCsv', () => {
  it('schreibt Kopfzeile und deutsche Statusnamen, getrennt mit Semikolon', () => {
    const lines = toCsv([application]).replace('﻿', '').split('\r\n');

    expect(lines).toEqual([
      'Unternehmen;Position;Ort;Beworben am;Status;Nächster Schritt',
      'Form & Funktion;Senior React Developer;Hamburg;2026-10-07;Gespräch;',
    ]);
  });

  it('beginnt mit einer BOM, damit Excel Umlaute richtig liest', () => {
    expect(toCsv([]).startsWith('﻿')).toBe(true);
  });

  it('setzt Felder mit Semikolon, Anführungszeichen oder Zeilenumbruch in Anführungszeichen', () => {
    const csv = toCsv([
      { ...application, company: 'Müller; Partner', role: 'Dev "Lead"', nextStep: 'Mail\nsenden' },
    ]);

    expect(csv).toContain('"Müller; Partner";"Dev ""Lead""";Hamburg');
    expect(csv).toContain('"Mail\nsenden"');
  });
});
