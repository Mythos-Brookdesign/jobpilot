import {
  countByStatus,
  filterApplications,
  findNextInterview,
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
    status: 'sent',
    ...overrides,
  };
}

const applications = [
  application({
    company: 'Nordlicht Software',
    role: 'Senior Fullstack Developer',
    status: 'interview',
  }),
  application({ company: 'Form & Funktion', role: 'React Developer', location: 'Hamburg' }),
  application({ company: 'Lumen Works', role: 'Node.js Engineer', status: 'offer' }),
  application({ company: 'Pixelgarten', status: 'rejected' }),
  application({ company: 'Studio Morgen', status: 'interview' }),
];

describe('countByStatus', () => {
  it('zählt jede Bewerbung genau einmal', () => {
    expect(countByStatus(applications)).toEqual({ sent: 1, interview: 2, offer: 1, rejected: 1 });
  });

  it('liefert für eine leere Liste überall 0', () => {
    expect(countByStatus([])).toEqual({ sent: 0, interview: 0, offer: 0, rejected: 0 });
  });
});

describe('filterApplications', () => {
  it('gibt ohne Filter und Suche alles zurück', () => {
    expect(filterApplications(applications, { status: 'all', query: '' })).toHaveLength(5);
  });

  it('filtert nach Status', () => {
    const result = filterApplications(applications, { status: 'interview', query: '' });
    expect(result.map((a) => a.company)).toEqual(['Nordlicht Software', 'Studio Morgen']);
  });

  it('sucht in Firma, Position und Ort, ohne auf Groß- und Kleinschreibung zu achten', () => {
    const company = filterApplications(applications, { status: 'all', query: 'lumen' });
    const role = filterApplications(applications, { status: 'all', query: 'FULLSTACK' });
    const location = filterApplications(applications, { status: 'all', query: 'hamburg' });

    expect(company.map((a) => a.company)).toEqual(['Lumen Works']);
    expect(role.map((a) => a.company)).toEqual(['Nordlicht Software']);
    expect(location.map((a) => a.company)).toEqual(['Form & Funktion']);
  });

  it('ignoriert Leerzeichen am Rand der Suche', () => {
    expect(filterApplications(applications, { status: 'all', query: '  pixel ' })).toHaveLength(1);
  });

  it('kombiniert Status und Suche', () => {
    expect(filterApplications(applications, { status: 'offer', query: 'nordlicht' })).toEqual([]);
  });
});

describe('findNextInterview', () => {
  it('findet die erste Bewerbung im Gespräch', () => {
    expect(findNextInterview(applications)?.company).toBe('Nordlicht Software');
  });

  it('liefert undefined, wenn kein Gespräch ansteht', () => {
    expect(findNextInterview([application({ status: 'sent' })])).toBeUndefined();
  });
});

describe('toLocalIsoDate', () => {
  it('nutzt den lokalen Kalendertag, auch kurz vor Mitternacht', () => {
    expect(toLocalIsoDate(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
    expect(toLocalIsoDate(new Date(2026, 9, 10, 0, 1))).toBe('2026-10-10');
  });
});
