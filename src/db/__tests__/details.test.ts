/**
 * @jest-environment node
 */
import { createRepositories } from '@/db/repositories';
import { createTestDatabase } from '@/db/testing/create-test-database';
import type { ApplicationInput } from '@/domain/application';

const input: ApplicationInput = {
  company: 'Nordlicht Software',
  role: 'Senior Fullstack Developer',
  location: 'Berlin',
  appliedAt: '2026-10-01',
  status: 'interview',
  priority: 'normal',
};

function setup() {
  const db = createTestDatabase();
  const repositories = createRepositories(db);
  const { id } = repositories.applications.create(input);
  return { ...repositories, applicationId: id };
}

describe('Kontakte', () => {
  it('legt an, bearbeitet und löscht', () => {
    const { details, applicationId } = setup();

    const id = details.saveContact(applicationId, { name: 'Jana', email: 'jana@example.com' });
    expect(details.contacts(applicationId)).toEqual([
      { id, applicationId, name: 'Jana', email: 'jana@example.com' },
    ]);

    details.saveContact(applicationId, { name: 'Jana Peters', role: 'Recruiterin' }, id);
    expect(details.contact(id)).toEqual({
      id,
      applicationId,
      name: 'Jana Peters',
      role: 'Recruiterin',
    });

    details.deleteContact(id);
    expect(details.contacts(applicationId)).toEqual([]);
  });
});

describe('Notizen', () => {
  it('speichert getrimmt und listet neueste zuerst', () => {
    const { details, applicationId } = setup();
    details.addNote(applicationId, '  Erste  ', new Date('2026-10-01T10:00:00Z'));
    details.addNote(applicationId, 'Zweite', new Date('2026-10-02T10:00:00Z'));

    expect(details.notes(applicationId).map((n) => n.body)).toEqual(['Zweite', 'Erste']);
  });
});

describe('Termine', () => {
  it('liefert anstehende Termine im Zeitraum mit Firma, früheste zuerst', () => {
    const { details, applications, applicationId } = setup();
    const other = applications.create({ ...input, company: 'Studio Morgen' }).id;
    details.saveAppointment(applicationId, { kind: 'video', startsAt: '2026-10-14T08:00:00.000Z' });
    details.saveAppointment(other, { kind: 'phone', startsAt: '2026-10-12T09:00:00.000Z' });
    details.saveAppointment(other, { kind: 'onsite', startsAt: '2026-10-30T09:00:00.000Z' });
    details.saveAppointment(other, { kind: 'onsite', startsAt: '2026-10-01T09:00:00.000Z' });

    const upcoming = details.upcomingAppointments(
      new Date('2026-10-10T00:00:00Z'),
      new Date('2026-10-17T00:00:00Z'),
    );

    expect(upcoming.map((a) => [a.company, a.kind])).toEqual([
      ['Studio Morgen', 'phone'],
      ['Nordlicht Software', 'video'],
    ]);
  });

  it('blendet Termine gelöschter Bewerbungen aus', () => {
    const { details, applications, applicationId } = setup();
    details.saveAppointment(applicationId, { kind: 'video', startsAt: '2026-10-14T08:00:00.000Z' });
    applications.archive(applicationId);

    expect(details.upcomingAppointments(new Date('2026-10-10Z'), new Date('2026-10-20Z'))).toEqual(
      [],
    );
  });

  it('kennt je Bewerbung den nächsten anstehenden Termin', () => {
    const { details, applicationId } = setup();
    details.saveAppointment(applicationId, { kind: 'video', startsAt: '2026-10-20T08:00:00.000Z' });
    details.saveAppointment(applicationId, { kind: 'phone', startsAt: '2026-10-14T08:00:00.000Z' });
    details.saveAppointment(applicationId, { kind: 'phone', startsAt: '2026-10-01T08:00:00.000Z' });

    expect(details.nextAppointmentByApplication(new Date('2026-10-10Z'))).toEqual(
      new Map([[applicationId, '2026-10-14T08:00:00.000Z']]),
    );
  });

  it('bearbeitet einen Termin und leert entfernte Felder', () => {
    const { details, applicationId } = setup();
    const id = details.saveAppointment(applicationId, {
      kind: 'onsite',
      startsAt: '2026-10-14T08:00:00.000Z',
      location: 'Hauptstraße 1',
    });

    details.saveAppointment(
      applicationId,
      { kind: 'video', startsAt: '2026-10-15T08:00:00.000Z' },
      id,
    );

    expect(details.appointment(id)).toEqual({
      id,
      applicationId,
      kind: 'video',
      startsAt: '2026-10-15T08:00:00.000Z',
    });
  });
});

describe('Einstellungen', () => {
  it('speichert und überschreibt Werte', () => {
    const { settings } = setup();
    expect(settings.get('applications.sort')).toBeUndefined();

    settings.set('applications.sort', 'priority');
    settings.set('applications.sort', 'newest');

    expect(settings.get('applications.sort')).toBe('newest');
  });
});
