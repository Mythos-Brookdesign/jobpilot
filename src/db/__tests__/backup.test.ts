/**
 * @jest-environment node
 */
import { createRepositories } from '@/db/repositories';
import { contacts, statusEvents } from '@/db/schema';
import { createTestDatabase } from '@/db/testing/create-test-database';
import type { ApplicationInput } from '@/domain/application';
import { parseBackup, serializeBackup } from '@/domain/backup';
import { createDemoBackup } from '@/features/applications/demo-data';

const input: ApplicationInput = {
  company: 'Nordlicht Software',
  role: 'Senior Fullstack Developer',
  location: 'Berlin',
  workMode: 'hybrid',
  appliedAt: '2026-10-01',
  status: 'applied',
  priority: 'high',
  source: 'LinkedIn',
};

const exportTime = new Date('2026-10-10T12:00:00Z');

function setup() {
  const db = createTestDatabase();
  return { db, ...createRepositories(db) };
}

describe('Export und Import', () => {
  it('überträgt Bewerbungen mit Verlauf, Kontakten, Notizen und Terminen verlustfrei', () => {
    const source = setup();
    const { id } = source.applications.create(input, new Date('2026-10-01T09:00:00Z'));
    source.applications.changeStatus(id, 'interview', new Date('2026-10-02T09:00:00Z'));
    source.details.saveContact(id, { name: 'Jana Peters', role: 'Recruiterin' });
    source.details.addNote(id, 'Lief gut', new Date('2026-10-02T18:00:00Z'));
    source.details.saveAppointment(id, { kind: 'video', startsAt: '2026-10-14T08:00:00.000Z' });

    const backup = source.backup.export(exportTime);
    const parsed = parseBackup(serializeBackup(backup));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const target = setup();
    expect(target.backup.import(parsed.backup)).toBe(1);

    expect(target.backup.export(exportTime)).toEqual(backup);
    expect(target.details.contacts(id)).toHaveLength(1);
    expect(target.details.appointments(id)).toHaveLength(1);
  });

  it('exportiert keine gelöschten Bewerbungen', () => {
    const { applications, backup } = setup();
    const { id } = applications.create(input);
    applications.create({ ...input, company: 'Bleibt' });
    applications.archive(id);

    expect(backup.export().applications.map((a) => a.company)).toEqual(['Bleibt']);
  });

  it('ersetzt beim erneuten Import vorhandene Einträge samt Details, statt sie zu verdoppeln', () => {
    const { db, applications, details, backup } = setup();
    const { id } = applications.create(input);
    details.saveContact(id, { name: 'Jana' });
    const saved = backup.export();

    applications.changeStatus(id, 'rejected');
    details.saveContact(id, { name: 'Später hinzugefügt' });
    applications.archive(id);
    backup.import(saved);

    expect(applications.get(id)?.status).toBe('applied');
    expect(db.select().from(statusEvents).all()).toHaveLength(1);
    expect(
      db
        .select()
        .from(contacts)
        .all()
        .map((c) => c.name),
    ).toEqual(['Jana']);
  });

  it('kann die Beispieldaten laden und mehrfach laden, ohne sie zu verdoppeln', () => {
    const { applications, backup } = setup();
    const demo = createDemoBackup(new Date('2026-10-10T12:00:00'));

    backup.import(demo);
    backup.import(demo);

    expect(applications.listActive()).toHaveLength(demo.applications.length);
  });
});
