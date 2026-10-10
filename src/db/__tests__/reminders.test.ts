/**
 * @jest-environment node
 */
import { createRepositories } from '@/db/repositories';
import { createTestDatabase } from '@/db/testing/create-test-database';
import type { ApplicationInput } from '@/domain/application';

// Samstag, 10. Oktober 2026, 12:00 Uhr (lokale Zeit)
const now = new Date(2026, 9, 10, 12, 0);
const local = (day: number, hour = 9) => new Date(2026, 9, day, hour, 0).toISOString();

const input: ApplicationInput = {
  company: 'Nordlicht',
  role: 'Senior Dev',
  location: 'Berlin',
  appliedAt: '2026-10-01',
  status: 'applied',
  priority: 'normal',
};

function setup() {
  const repositories = createRepositories(createTestDatabase());
  const { id } = repositories.applications.create(input, new Date(local(1)));
  return { ...repositories, applicationId: id };
}

const kinds = (list: { kind: string }[]) => list.map((r) => r.kind).sort();

describe('reconcile', () => {
  it('legt Erinnerungen nach den Regeln an und meldet, ob sich etwas geändert hat', () => {
    const { reminders } = setup();

    expect(reminders.reconcile(now)).toBe(true);
    expect(reminders.open().map((r) => [r.kind, r.dueAt, r.company])).toEqual([
      ['follow-up', local(11), 'Nordlicht'],
    ]);
    // Zweiter Lauf ohne Änderungen schreibt nichts – keine Endlosschleife
    expect(reminders.reconcile(now)).toBe(false);
  });

  it('ersetzt die Nachhaken-Erinnerung, sobald ein Termin ansteht', () => {
    const { reminders, details, applicationId } = setup();
    reminders.reconcile(now);

    details.saveAppointment(applicationId, { kind: 'video', startsAt: local(12, 10) });
    reminders.reconcile(now);

    expect(kinds(reminders.open())).toEqual([
      'appointment-day-before',
      'appointment-soon',
      'thank-you',
    ]);
  });

  it('plant neu, wenn ein Termin verschoben wird', () => {
    const { reminders, details, applicationId } = setup();
    const id = details.saveAppointment(applicationId, { kind: 'video', startsAt: local(12, 10) });
    reminders.reconcile(now);

    details.saveAppointment(applicationId, { kind: 'video', startsAt: local(14, 10) }, id);
    reminders.reconcile(now);

    const dayBefore = reminders.open().find((r) => r.kind === 'appointment-day-before');
    expect(dayBefore?.dueAt).toBe(local(13, 18));
    expect(reminders.all().filter((r) => r.kind === 'appointment-day-before')).toHaveLength(1);
  });

  it('übernimmt geänderte Einstellungen', () => {
    const { reminders } = setup();
    reminders.reconcile(now);

    reminders.saveSettings({ followUpDays: 14, appointments: true, thankYou: true });
    reminders.reconcile(now);

    expect(reminders.open()[0].dueAt).toBe(local(15));
  });

  it('entfernt Erinnerungen abgeschlossener Bewerbungen', () => {
    const { reminders, applications, applicationId } = setup();
    reminders.reconcile(now);

    applications.changeStatus(applicationId, 'rejected', now);
    reminders.reconcile(now);

    expect(reminders.open()).toEqual([]);
  });
});

describe('Erledigt, Später und eigene Erinnerungen', () => {
  it('blendet Erledigte aus und lässt sie beim nächsten Abgleich erledigt', () => {
    const { reminders } = setup();
    reminders.reconcile(now);
    const [followUp] = reminders.open();

    reminders.markDone(followUp.key, now);
    reminders.reconcile(now);

    expect(reminders.open()).toEqual([]);
    expect(reminders.all()[0].doneAt).toBe(now.toISOString());
  });

  it('verschiebt eine Erinnerung, ohne die ursprüngliche Fälligkeit zu verlieren', () => {
    const { reminders } = setup();
    reminders.reconcile(now);
    const [followUp] = reminders.open();

    reminders.snooze(followUp.key, local(14));
    reminders.reconcile(now);

    expect(reminders.open()[0]).toMatchObject({ dueAt: local(11), snoozedUntil: local(14) });
  });

  it('behält eigene Erinnerungen beim Abgleich', () => {
    const { reminders, applicationId } = setup();
    const key = reminders.addCustom(applicationId, '  Gehalt recherchieren ', local(13), now);

    reminders.reconcile(now);

    expect(reminders.forApplication(applicationId).find((r) => r.key === key)).toMatchObject({
      kind: 'custom',
      title: 'Gehalt recherchieren',
      dueAt: local(13),
    });
  });

  it('blendet Erinnerungen gelöschter Bewerbungen aus', () => {
    const { reminders, applications, applicationId } = setup();
    reminders.addCustom(applicationId, 'Anrufen', local(13), now);

    applications.archive(applicationId);

    expect(reminders.open()).toEqual([]);
  });
});
