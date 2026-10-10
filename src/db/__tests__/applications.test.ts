/**
 * @jest-environment node
 */
import { createApplicationsRepository } from '@/db/repositories/applications';
import { statusEvents } from '@/db/schema';
import { createTestDatabase } from '@/db/testing/create-test-database';
import type { ApplicationInput } from '@/domain/application';

const input: ApplicationInput = {
  company: 'Nordlicht Software',
  role: 'Senior Fullstack Developer',
  location: 'Berlin',
  appliedAt: '2026-10-01',
  status: 'applied',
  priority: 'normal',
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

    const created = repository.create(input, new Date('2026-10-01T09:00:00Z'));

    expect(repository.listActive()).toEqual([{ ...input, id: created.id }]);
    expect(events()).toMatchObject([
      {
        applicationId: created.id,
        fromStatus: null,
        toStatus: 'applied',
        at: '2026-10-01T09:00:00.000Z',
      },
    ]);
  });

  it('speichert alle optionalen Felder und liest sie unverändert zurück', () => {
    const { repository } = setup();
    const full: ApplicationInput = {
      ...input,
      workMode: 'hybrid',
      priority: 'high',
      source: 'LinkedIn',
      jobUrl: 'https://example.com/job',
      salaryMin: 75000,
      salaryMax: 85000,
      nextStep: 'Unterlagen schicken',
    };

    const { id } = repository.create(full);

    expect(repository.get(id)).toEqual({ ...full, id });
  });

  it('sortiert nach Bewerbungsdatum, neueste zuerst', () => {
    const { repository } = setup();
    repository.create({ ...input, company: 'Alt', appliedAt: '2026-09-01' });
    repository.create({ ...input, company: 'Neu', appliedAt: '2026-10-05' });
    repository.create({ ...input, company: 'Mitte', appliedAt: '2026-09-20' });

    expect(repository.listActive().map((a) => a.company)).toEqual(['Neu', 'Mitte', 'Alt']);
  });
});

describe('Bewerbungen bearbeiten', () => {
  it('überschreibt Felder und leert entfernte optionale Felder', () => {
    const { repository } = setup();
    const { id } = repository.create({ ...input, source: 'LinkedIn', salaryMin: 70000 });

    repository.update(id, { ...input, role: 'Lead Developer' });

    expect(repository.get(id)).toEqual({ ...input, role: 'Lead Developer', id });
  });

  it('protokolliert einen im Formular geänderten Status', () => {
    const { repository, events } = setup();
    const { id } = repository.create(input);

    repository.update(id, { ...input, status: 'screening' });
    repository.update(id, { ...input, status: 'screening', role: 'Andere Rolle' });

    expect(events().map((e) => e.toStatus)).toEqual(['applied', 'screening']);
  });
});

describe('Status ändern', () => {
  it('aktualisiert den Status und protokolliert den Wechsel', () => {
    const { repository } = setup();
    const { id } = repository.create(input, new Date('2026-10-01T09:00:00Z'));

    const changed = repository.changeStatus(id, 'interview', new Date('2026-10-03T10:00:00Z'));

    expect(changed).toBe(true);
    expect(repository.get(id)?.status).toBe('interview');
    expect(repository.statusEvents(id).at(-1)).toEqual({
      from: 'applied',
      to: 'interview',
      at: '2026-10-03T10:00:00.000Z',
    });
  });

  it('schreibt nichts, wenn der Status gleich bleibt', () => {
    const { repository, events } = setup();
    const { id } = repository.create(input);

    expect(repository.changeStatus(id, 'applied')).toBe(false);
    expect(events()).toHaveLength(1);
  });

  it('ignoriert unbekannte IDs', () => {
    const { repository } = setup();
    expect(repository.changeStatus('gibt-es-nicht', 'offer')).toBe(false);
  });
});

describe('Löschen und Wiederherstellen', () => {
  it('blendet gelöschte Bewerbungen überall aus und holt sie zurück', () => {
    const { repository } = setup();
    const { id } = repository.create(input);

    repository.archive(id);
    expect(repository.listActive()).toEqual([]);
    expect(repository.get(id)).toBeUndefined();
    expect(repository.histories()).toEqual([]);

    repository.restore(id);
    expect(repository.listActive().map((a) => a.id)).toEqual([id]);
  });
});

describe('histories', () => {
  it('liefert jede Bewerbung mit ihrem vollständigen Verlauf', () => {
    const { repository } = setup();
    const { id } = repository.create(input, new Date('2026-10-01T09:00:00Z'));
    repository.changeStatus(id, 'screening', new Date('2026-10-04T09:00:00Z'));
    repository.create({ ...input, company: 'Zweite' });

    const histories = repository.histories();

    expect(histories).toHaveLength(2);
    expect(histories.find((h) => h.application.id === id)?.events.map((e) => e.to)).toEqual([
      'applied',
      'screening',
    ]);
  });
});
