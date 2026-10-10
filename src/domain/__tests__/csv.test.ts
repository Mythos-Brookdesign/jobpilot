import type { JobApplication } from '@/domain/application';
import { toCsv } from '@/domain/csv';

const application: JobApplication = {
  id: 'a1',
  company: 'Form & Funktion',
  role: 'Senior React Developer',
  location: 'Hamburg',
  workMode: 'onsite',
  appliedAt: '2026-10-07',
  status: 'interview',
  priority: 'high',
  source: 'StepStone',
  salaryMin: 70000,
  salaryMax: 80000,
};

describe('toCsv', () => {
  it('schreibt Kopfzeile und deutsche Bezeichnungen, getrennt mit Semikolon', () => {
    const lines = toCsv([application]).replace('﻿', '').split('\r\n');

    expect(lines).toEqual([
      'Unternehmen;Position;Ort;Arbeitsmodell;Beworben am;Status;Priorität;Quelle;Gehalt;Link;Nächster Schritt',
      'Form & Funktion;Senior React Developer;Hamburg;Vor Ort;2026-10-07;Fachgespräch;Hoch;StepStone;70.000–80.000 €;;',
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
