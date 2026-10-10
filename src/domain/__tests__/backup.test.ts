import { BACKUP_FORMAT, parseBackup, serializeBackup, type Backup } from '@/domain/backup';

const backup: Backup = {
  format: BACKUP_FORMAT,
  version: 2,
  exportedAt: '2026-10-10T12:00:00.000Z',
  applications: [
    {
      id: 'a1',
      company: 'Nordlicht Software',
      role: 'Senior Fullstack Developer',
      location: 'Berlin',
      workMode: 'hybrid',
      appliedAt: '2026-10-01',
      status: 'interview',
      priority: 'high',
      source: 'LinkedIn',
      salaryMin: 75000,
      nextStep: 'Fachgespräch',
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T09:00:00.000Z',
      statusEvents: [
        { from: null, to: 'applied', at: '2026-10-01T09:00:00.000Z' },
        { from: 'applied', to: 'interview', at: '2026-10-02T09:00:00.000Z' },
      ],
      contacts: [{ id: 'c1', name: 'Jana Peters', role: 'Recruiterin' }],
      notes: [{ id: 'n1', body: 'Lief gut', createdAt: '2026-10-02T18:00:00.000Z' }],
      appointments: [{ id: 't1', kind: 'video', startsAt: '2026-10-12T08:00:00.000Z' }],
    },
  ],
};

function withChanges(change: (copy: Record<string, unknown>) => void) {
  const copy = JSON.parse(serializeBackup(backup));
  change(copy);
  return JSON.stringify(copy);
}

const firstApplication = (copy: Record<string, unknown>) =>
  (copy.applications as Record<string, unknown>[])[0];

describe('parseBackup', () => {
  it('liest ein gültiges Backup unverändert ein', () => {
    expect(parseBackup(serializeBackup(backup))).toEqual({ ok: true, backup });
  });

  it('hebt Backups der Version 1 auf Version 2 an', () => {
    const v1 = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-10-10T12:00:00.000Z',
      applications: [
        {
          id: 'alt',
          company: 'Altfirma',
          role: 'Dev',
          location: 'Köln',
          appliedAt: '2026-09-01',
          status: 'sent',
          createdAt: '2026-09-01T09:00:00.000Z',
          updatedAt: '2026-09-01T09:00:00.000Z',
          statusEvents: [{ from: null, to: 'sent', at: '2026-09-01T09:00:00.000Z' }],
        },
      ],
    };

    const result = parseBackup(JSON.stringify(v1));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.version).toBe(2);
    expect(result.backup.applications[0]).toMatchObject({
      status: 'applied',
      priority: 'normal',
      statusEvents: [{ from: null, to: 'applied' }],
      contacts: [],
      notes: [],
      appointments: [],
    });
  });

  it('erkennt Dateien, die kein JSON sind', () => {
    expect(parseBackup('Unternehmen;Position')).toEqual({
      ok: false,
      error: 'Die Datei ist kein gültiges JSON.',
    });
  });

  it('erkennt fremde JSON-Dateien', () => {
    expect(parseBackup('{"name": "package"}')).toEqual({
      ok: false,
      error: 'Die Datei ist kein jobpilot-Backup.',
    });
  });

  it('lehnt unbekannte Versionen mit verständlicher Meldung ab', () => {
    const result = parseBackup(withChanges((copy) => (copy.version = 9)));
    expect(result).toEqual({ ok: false, error: 'Backup-Version 9 wird nicht unterstützt.' });
  });

  it('nennt die Stelle eines ungültigen Eintrags', () => {
    const result = parseBackup(withChanges((copy) => (firstApplication(copy).status = 'x')));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('applications.0.status');
  });

  it('verlangt Kalendertage im Format JJJJ-MM-TT', () => {
    const result = parseBackup(
      withChanges((copy) => (firstApplication(copy).appliedAt = '01.10.2026')),
    );
    expect(result.ok).toBe(false);
  });
});
