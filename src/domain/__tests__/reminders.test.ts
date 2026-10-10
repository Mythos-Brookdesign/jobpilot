import type { JobApplication } from '@/domain/application';
import type { Appointment } from '@/domain/details';
import {
  DEFAULT_REMINDER_SETTINGS,
  diffReminders,
  dueToday,
  formatDue,
  planReminders,
  type PlanningInput,
  type Reminder,
} from '@/domain/reminders';

// Samstag, 10. Oktober 2026, 12:00 Uhr (lokale Zeit)
const now = new Date(2026, 9, 10, 12, 0);
const local = (day: number, hour = 9, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();

function application(overrides: Partial<JobApplication & { lastStatusChangeAt: string }> = {}) {
  return {
    id: 'a1',
    company: 'Nordlicht',
    role: 'Senior Dev',
    location: 'Berlin',
    appliedAt: '2026-10-01',
    status: 'applied' as const,
    priority: 'normal' as const,
    lastStatusChangeAt: local(1),
    ...overrides,
  };
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return { id: 't1', applicationId: 'a1', kind: 'video', startsAt: local(12, 10), ...overrides };
}

function plan(overrides: Partial<PlanningInput> = {}) {
  return planReminders({
    applications: [application()],
    appointments: [],
    settings: DEFAULT_REMINDER_SETTINGS,
    now,
    ...overrides,
  });
}

describe('Nachhaken', () => {
  it('erinnert X Tage nach der letzten Statusänderung um 9 Uhr', () => {
    expect(plan()).toEqual([
      {
        key: `follow-up:a1:${local(1)}`,
        applicationId: 'a1',
        kind: 'follow-up',
        dueAt: local(11),
        title: 'Nachhaken bei Nordlicht?',
        body: 'Seit 10 Tagen nichts Neues zu „Senior Dev“.',
      },
    ]);
  });

  it('gilt nur für laufende Bewerbungen', () => {
    for (const status of ['saved', 'offer', 'rejected', 'withdrawn'] as const) {
      expect(plan({ applications: [application({ status })] })).toEqual([]);
    }
  });

  it('entfällt, wenn schon ein Termin ansteht', () => {
    const reminders = plan({ appointments: [appointment()] });
    expect(reminders.some((r) => r.kind === 'follow-up')).toBe(false);
  });

  it('lässt sich abschalten', () => {
    expect(plan({ settings: { ...DEFAULT_REMINDER_SETTINGS, followUpDays: 0 } })).toEqual([]);
  });

  it('bekommt nach einer neuen Statusänderung einen neuen Schlüssel', () => {
    const before = plan()[0].key;
    const after = plan({
      applications: [application({ status: 'screening', lastStatusChangeAt: local(9) })],
    })[0];
    expect(after.key).not.toBe(before);
    expect(after.dueAt).toBe(local(19));
  });
});

describe('Termine', () => {
  const kinds = (reminders: ReturnType<typeof plan>) => reminders.map((r) => [r.kind, r.dueAt]);

  it('erinnert am Vortag um 18 Uhr, eine Stunde vorher und am Morgen danach', () => {
    expect(kinds(plan({ appointments: [appointment()] }))).toEqual([
      ['appointment-day-before', local(11, 18)],
      ['appointment-soon', local(12, 9)],
      ['thank-you', local(13, 9)],
    ]);
  });

  it('nennt Art, Firma, Uhrzeit und Ort', () => {
    const [dayBefore] = plan({ appointments: [appointment({ location: 'meet.example.com' })] });
    expect(dayBefore.title).toBe('Morgen: Video-Call bei Nordlicht');
    expect(dayBefore.body).toBe('10:00 Uhr · meet.example.com');
  });

  it('plant keine Erinnerung, deren Zeitpunkt schon vorbei ist', () => {
    // Termin heute um 12:30: Vortag und „eine Stunde vorher“ sind vorbei
    expect(kinds(plan({ appointments: [appointment({ startsAt: local(10, 12, 30) })] }))).toEqual([
      ['thank-you', local(11, 9)],
    ]);
  });

  it('erinnert ans Dankeschön nur für kürzlich vergangene Termine', () => {
    // Nachhaken aus, damit nur das Dankeschön betrachtet wird
    const settings = { ...DEFAULT_REMINDER_SETTINGS, followUpDays: 0 };
    expect(
      kinds(plan({ settings, appointments: [appointment({ startsAt: local(8, 15) })] })),
    ).toEqual([['thank-you', local(9, 9)]]);
    expect(plan({ settings, appointments: [appointment({ startsAt: local(2, 15) })] })).toEqual([]);
  });

  it('entfällt für abgeschlossene Bewerbungen', () => {
    const reminders = plan({
      applications: [application({ status: 'rejected' })],
      appointments: [appointment()],
    });
    expect(reminders).toEqual([]);
  });

  it('lässt sich getrennt abschalten', () => {
    const settings = { followUpDays: 0, appointments: false, thankYou: true };
    expect(kinds(plan({ appointments: [appointment()], settings }))).toEqual([
      ['thank-you', local(13, 9)],
    ]);
  });
});

describe('diffReminders', () => {
  const planned = plan();
  const stored = (overrides: Partial<Reminder> = {}): Reminder => ({ ...planned[0], ...overrides });

  it('legt neue an und lässt unveränderte in Ruhe', () => {
    expect(diffReminders(planned, [])).toEqual({ insert: planned, update: [], remove: [] });
    expect(diffReminders(planned, [stored({ doneAt: local(10) })])).toEqual({
      insert: [],
      update: [],
      remove: [],
    });
  });

  it('aktualisiert geänderte Texte oder Zeiten', () => {
    expect(diffReminders(planned, [stored({ dueAt: local(15) })]).update).toEqual(planned);
  });

  it('entfernt nicht mehr geplante, aber nie eigene Erinnerungen', () => {
    const custom: Reminder = { ...stored(), key: 'custom:x', kind: 'custom' };
    expect(diffReminders([], [stored(), custom]).remove).toEqual([planned[0].key]);
  });
});

describe('dueToday', () => {
  const reminder = (key: string, dueAt: string, extra: Partial<Reminder> = {}): Reminder => ({
    key,
    applicationId: 'a1',
    kind: 'custom',
    dueAt,
    title: key,
    body: '',
    ...extra,
  });

  it('liefert offene, bis heute fällige Erinnerungen, älteste zuerst', () => {
    const result = dueToday(
      [
        reminder('später', local(11, 9)),
        reminder('heute-abend', local(10, 20)),
        reminder('überfällig', local(8, 9)),
        reminder('erledigt', local(9, 9), { doneAt: local(9, 10) }),
        reminder('verschoben', local(9, 9), { snoozedUntil: local(13, 9) }),
      ],
      now,
    );
    expect(result.map((r) => r.key)).toEqual(['überfällig', 'heute-abend']);
  });

  it('beschreibt die Fälligkeit verständlich', () => {
    expect(formatDue(reminder('a', local(10, 20)), now)).toBe('Heute, 20:00 Uhr');
    expect(formatDue(reminder('b', local(11, 9)), now)).toBe('Morgen, 09:00 Uhr');
    expect(formatDue(reminder('c', local(9, 9)), now)).toBe('Seit gestern fällig');
    expect(formatDue(reminder('d', local(6, 9)), now)).toBe('Seit 4 Tagen fällig');
  });
});
