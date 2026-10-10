import {
  countByFilter,
  filterApplications,
  formatSalary,
  matchesFilter,
  sortApplications,
  toLocalIsoDate,
  type JobApplication,
} from '@/domain/application';

function application(overrides: Partial<JobApplication>): JobApplication {
  return {
    id: overrides.company ?? 'id',
    company: 'Firma',
    role: 'Developer',
    location: 'Remote',
    appliedAt: '2026-10-01',
    status: 'applied',
    priority: 'normal',
    ...overrides,
  };
}

const applications = [
  application({
    company: 'Nordlicht Software',
    role: 'Senior Fullstack Developer',
    status: 'interview',
    source: 'LinkedIn',
  }),
  application({ company: 'Form & Funktion', role: 'React Developer', location: 'Hamburg' }),
  application({ company: 'Lumen Works', role: 'Node.js Engineer', status: 'offer' }),
  application({ company: 'Pixelgarten', status: 'rejected' }),
  application({ company: 'Studio Morgen', status: 'screening' }),
  application({ company: 'Hafenblick', status: 'saved' }),
];

describe('Filtergruppen', () => {
  it('ordnet jeden Status den passenden Gruppen zu', () => {
    expect(matchesFilter('screening', 'active')).toBe(true);
    expect(matchesFilter('screening', 'interviewing')).toBe(true);
    expect(matchesFilter('applied', 'interviewing')).toBe(false);
    expect(matchesFilter('withdrawn', 'closed')).toBe(true);
    expect(matchesFilter('saved', 'active')).toBe(false);
  });

  it('zählt je Gruppe – laufende Gespräche zählen auch als laufend', () => {
    expect(countByFilter(applications)).toEqual({
      all: 6,
      saved: 1,
      active: 3,
      interviewing: 2,
      offer: 1,
      closed: 1,
    });
  });
});

describe('filterApplications', () => {
  it('filtert nach Gruppe', () => {
    const result = filterApplications(applications, { filter: 'interviewing', query: '' });
    expect(result.map((a) => a.company)).toEqual(['Nordlicht Software', 'Studio Morgen']);
  });

  it('sucht in Firma, Position, Ort und Quelle, ohne auf Groß- und Kleinschreibung zu achten', () => {
    const search = (query: string) =>
      filterApplications(applications, { filter: 'all', query }).map((a) => a.company);

    expect(search('lumen')).toEqual(['Lumen Works']);
    expect(search('FULLSTACK')).toEqual(['Nordlicht Software']);
    expect(search('hamburg')).toEqual(['Form & Funktion']);
    expect(search('linkedin')).toEqual(['Nordlicht Software']);
    expect(search('  pixel ')).toEqual(['Pixelgarten']);
  });
});

describe('sortApplications', () => {
  const list = [
    application({ id: 'alt', appliedAt: '2026-09-01', priority: 'high' }),
    application({ id: 'neu', appliedAt: '2026-10-05', priority: 'low' }),
    application({ id: 'mitte', appliedAt: '2026-09-20', priority: 'normal' }),
  ];
  const ids = (sorted: JobApplication[]) => sorted.map((a) => a.id);

  it('sortiert nach Datum, neueste zuerst', () => {
    expect(ids(sortApplications(list, 'newest'))).toEqual(['neu', 'mitte', 'alt']);
  });

  it('sortiert nach Priorität, bei Gleichstand nach Datum', () => {
    const withTie = [
      ...list,
      application({ id: 'hoch-neu', appliedAt: '2026-10-08', priority: 'high' }),
    ];
    expect(ids(sortApplications(withTie, 'priority'))).toEqual(['hoch-neu', 'alt', 'mitte', 'neu']);
  });

  it('stellt Bewerbungen mit dem frühesten Termin nach vorn, den Rest nach Datum', () => {
    const next = new Map([
      ['alt', '2026-10-12T10:00:00.000Z'],
      ['mitte', '2026-10-11T09:00:00.000Z'],
    ]);
    expect(ids(sortApplications(list, 'nextAppointment', next))).toEqual(['mitte', 'alt', 'neu']);
  });

  it('verändert die Eingabe nicht', () => {
    const copy = [...list];
    sortApplications(list, 'priority');
    expect(list).toEqual(copy);
  });
});

describe('formatSalary', () => {
  it('formatiert Spannen, Unter- und Obergrenzen', () => {
    expect(formatSalary(75000, 85000)).toBe('75.000–85.000 €');
    expect(formatSalary(80000, 80000)).toBe('80.000 €');
    expect(formatSalary(70000)).toBe('ab 70.000 €');
    expect(formatSalary(undefined, 90000)).toBe('bis 90.000 €');
    expect(formatSalary()).toBeUndefined();
  });
});

describe('toLocalIsoDate', () => {
  it('nutzt den lokalen Kalendertag, auch kurz vor Mitternacht', () => {
    expect(toLocalIsoDate(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
    expect(toLocalIsoDate(new Date(2026, 9, 10, 0, 1))).toBe('2026-10-10');
  });
});
