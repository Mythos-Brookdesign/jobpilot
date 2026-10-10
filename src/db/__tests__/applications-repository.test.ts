/**
 * @jest-environment node
 */
import { createApplicationsRepository } from '@/db/applications-repository';
import { statusEvents } from '@/db/schema';
import { createTestDatabase } from '@/db/testing/create-test-database';
import type { NewApplication } from '@/domain/application';
import { parseBackup, serializeBackup } from '@/domain/backup';

const newApplication: NewApplication = {
  company: 'Nordlicht Software',
  role: 'Senior Fullstack Developer',
  location: 'Berlin',
  appliedAt: '2026-10-01',
  status: 'sent',
};

function setup() {
  const db = createTestDatabase();
  const repository = createApplicationsRepository(db);
  const events = () => db.select().from(statusEvents).all();
  return { db, repository, events };
}

describe('Bewerbungen anlegen', () => {
  it('speichert die Bewerbung und protokolliert den Startstatus', () => {
    const { repository, events } = setup();

    const created = repository.create(newApplication, new Date('2026-10-01T09:00:00Z'));

    expect(repository.listActive()).toEqual([{ ...newApplication, id: created.id }]);
    expect(events()).toMatchObject([
      {
        applicationId: created.id,
        fromStatus: null,
        toStatus: 'sent',
        at: '2026-10-01T09:00:00.000Z',
      },
    ]);
  });

  it('sortiert nach Bewerbungsdatum, neueste zuerst', () => {
    const { repository } = setup();
    repository.create({ ...newApplication, company: 'Alt', appliedAt: '2026-09-01' });
    repository.create({ ...newApplication, company: 'Neu', appliedAt: '2026-10-05' });
    repository.create({ ...newApplication, company: 'Mitte', appliedAt: '2026-09-20' });

    expect(repository.listActive().map((a) => a.company)).toEqual(['Neu', 'Mitte', 'Alt']);
  });
});

describe('Status ändern', () => {
  it('aktualisiert den Status und protokolliert den Wechsel', () => {
    const { repository, events } = setup();
    const { id } = repository.create(newApplication);

    const changed = repository.changeStatus(id, 'interview', new Date('2026-10-03T10:00:00Z'));

    expect(changed).toBe(true);
    expect(repository.listActive()[0].status).toBe('interview');
    expect(events().at(-1)).toMatchObject({
      fromStatus: 'sent',
      toStatus: 'interview',
      at: '2026-10-03T10:00:00.000Z',
    });
  });

  it('schreibt nichts, wenn der Status gleich bleibt', () => {
    const { repository, events } = setup();
    const { id } = repository.create(newApplication);

    expect(repository.changeStatus(id, 'sent')).toBe(false);
    expect(events()).toHaveLength(1);
  });

  it('ignoriert unbekannte IDs', () => {
    const { repository } = setup();
    expect(repository.changeStatus('gibt-es-nicht', 'offer')).toBe(false);
  });
});

describe('Löschen und Wiederherstellen', () => {
  it('blendet gelöschte Bewerbungen aus und holt sie zurück', () => {
    const { repository } = setup();
    const { id } = repository.create(newApplication);

    repository.archive(id);
    expect(repository.listActive()).toEqual([]);

    repository.restore(id);
    expect(repository.listActive().map((a) => a.id)).toEqual([id]);
  });
});

describe('Export und Import', () => {
  it('überträgt Bewerbungen samt Statusverlauf verlustfrei in eine leere Datenbank', () => {
    const source = setup();
    const { id } = source.repository.create(
      { ...newApplication, nextStep: 'Fachgespräch' },
      new Date('2026-10-01T09:00:00Z'),
    );
    source.repository.changeStatus(id, 'interview', new Date('2026-10-02T09:00:00Z'));

    const backup = source.repository.exportBackup(new Date('2026-10-10T12:00:00Z'));
    const parsed = parseBackup(serializeBackup(backup));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const target = setup();
    expect(target.repository.importBackup(parsed.backup)).toBe(1);

    expect(target.repository.listActive()).toEqual(source.repository.listActive());
    expect(target.repository.exportBackup(new Date('2026-10-10T12:00:00Z'))).toEqual(backup);
  });

  it('exportiert keine gelöschten Bewerbungen', () => {
    const { repository } = setup();
    const { id } = repository.create(newApplication);
    repository.create({ ...newApplication, company: 'Bleibt' });
    repository.archive(id);

    expect(repository.exportBackup().applications.map((a) => a.company)).toEqual(['Bleibt']);
  });

  it('ersetzt beim erneuten Import vorhandene Einträge, statt sie zu verdoppeln', () => {
    const { repository, events } = setup();
    const { id } = repository.create(newApplication);
    const backup = repository.exportBackup();

    repository.changeStatus(id, 'rejected');
    repository.archive(id);
    repository.importBackup(backup);

    expect(repository.listActive()).toEqual([{ ...newApplication, id }]);
    expect(events()).toHaveLength(1);
  });
});
