import { BACKUP_FORMAT, parseBackup, serializeBackup, type Backup } from '@/domain/backup';

const backup: Backup = {
  format: BACKUP_FORMAT,
  version: 1,
  exportedAt: '2026-10-10T12:00:00.000Z',
  applications: [
    {
      id: 'a1',
      company: 'Nordlicht Software',
      role: 'Senior Fullstack Developer',
      location: 'Berlin',
      appliedAt: '2026-10-01',
      status: 'interview',
      nextStep: 'Fachgespräch',
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T09:00:00.000Z',
      statusEvents: [
        { from: null, to: 'sent', at: '2026-10-01T09:00:00.000Z' },
        { from: 'sent', to: 'interview', at: '2026-10-02T09:00:00.000Z' },
      ],
    },
  ],
};

function withChanges(change: (copy: Record<string, unknown>) => void) {
  const copy = JSON.parse(serializeBackup(backup));
  change(copy);
  return JSON.stringify(copy);
}

describe('parseBackup', () => {
  it('liest ein gültiges Backup unverändert ein', () => {
    expect(parseBackup(serializeBackup(backup))).toEqual({ ok: true, backup });
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
    const result = parseBackup(withChanges((copy) => (copy.version = 2)));
    expect(result).toEqual({ ok: false, error: 'Backup-Version 2 wird nicht unterstützt.' });
  });

  it('nennt die Stelle eines ungültigen Eintrags', () => {
    const result = parseBackup(
      withChanges((copy) => ((copy.applications as Record<string, unknown>[])[0].status = 'x')),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('applications.0.status');
  });

  it('verlangt Kalendertage im Format JJJJ-MM-TT', () => {
    const result = parseBackup(
      withChanges(
        (copy) => ((copy.applications as Record<string, unknown>[])[0].appliedAt = '01.10.2026'),
      ),
    );
    expect(result.ok).toBe(false);
  });
});
