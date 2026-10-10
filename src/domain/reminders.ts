import { matchesFilter, type JobApplication } from '@/domain/application';
import { APPOINTMENT_KIND_LABELS, type Appointment } from '@/domain/details';

// Erinnerungen entstehen aus Regeln (Nachhaken, Termine, Dankeschön) oder werden selbst angelegt.
// Der Schlüssel enthält die Grundlage der Erinnerung, z. B. den Zeitpunkt der letzten
// Statusänderung. Ändert sie sich, entsteht ein neuer Schlüssel und die alte Erinnerung entfällt –
// auch eine schon erledigte kommt so für die neue Situation zurück.

export const REMINDER_KINDS = [
  'follow-up',
  'appointment-day-before',
  'appointment-soon',
  'thank-you',
  'custom',
] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export type PlannedReminder = {
  key: string;
  applicationId: string;
  kind: ReminderKind;
  /** Zeitpunkt als ISO-8601 */
  dueAt: string;
  title: string;
  body: string;
};

export type Reminder = PlannedReminder & {
  doneAt?: string;
  /** Verschoben bis – ersetzt dueAt als Fälligkeit */
  snoozedUntil?: string;
};

export type ReminderSettings = {
  /** 0 = aus */
  followUpDays: number;
  appointments: boolean;
  thankYou: boolean;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  followUpDays: 10,
  appointments: true,
  thankYou: true,
};

export const FOLLOW_UP_OPTIONS = [0, 7, 10, 14] as const;
export const SNOOZE_DAYS = 3;

export type PlanningInput = {
  applications: (JobApplication & { lastStatusChangeAt: string })[];
  appointments: Appointment[];
  settings: ReminderSettings;
  now: Date;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Dankeschön nur für Termine, die höchstens so lange her sind */
const THANK_YOU_WINDOW_DAYS = 3;

/** Lokaler Kalendertag von `date`, verschoben um `days`, zur Uhrzeit `hour` */
function atLocalTime(date: Date, days: number, hour: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, hour, 0, 0, 0);
}

const timeOf = (date: Date) =>
  new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date);

/** Erinnerungen, die laut Regeln gerade gelten sollen */
export function planReminders({
  applications,
  appointments,
  settings,
  now,
}: PlanningInput): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  const byId = new Map(applications.map((application) => [application.id, application]));
  const hasUpcomingAppointment = new Set(
    appointments.filter((a) => new Date(a.startsAt) > now).map((a) => a.applicationId),
  );

  // Nachhaken: laufende Bewerbung, seit X Tagen keine Statusänderung und kein Termin in Sicht
  if (settings.followUpDays > 0) {
    for (const application of applications) {
      if (!matchesFilter(application.status, 'active')) continue;
      if (hasUpcomingAppointment.has(application.id)) continue;
      const due = atLocalTime(new Date(application.lastStatusChangeAt), settings.followUpDays, 9);
      planned.push({
        key: `follow-up:${application.id}:${application.lastStatusChangeAt}`,
        applicationId: application.id,
        kind: 'follow-up',
        dueAt: due.toISOString(),
        title: `Nachhaken bei ${application.company}?`,
        body: `Seit ${settings.followUpDays} Tagen nichts Neues zu „${application.role}“.`,
      });
    }
  }

  for (const appointment of appointments) {
    const application = byId.get(appointment.applicationId);
    if (!application || matchesFilter(application.status, 'closed')) continue;
    const start = new Date(appointment.startsAt);
    const kind = APPOINTMENT_KIND_LABELS[appointment.kind];
    const basis = `${appointment.id}:${appointment.startsAt}`;
    const where = appointment.location ?? application.role;

    if (settings.appointments && start > now) {
      const dayBefore = atLocalTime(start, -1, 18);
      if (dayBefore > now) {
        planned.push({
          key: `appointment-day-before:${basis}`,
          applicationId: application.id,
          kind: 'appointment-day-before',
          dueAt: dayBefore.toISOString(),
          title: `Morgen: ${kind} bei ${application.company}`,
          body: `${timeOf(start)} Uhr · ${where}`,
        });
      }
      const hourBefore = new Date(start.getTime() - HOUR);
      if (hourBefore > now) {
        planned.push({
          key: `appointment-soon:${basis}`,
          applicationId: application.id,
          kind: 'appointment-soon',
          dueAt: hourBefore.toISOString(),
          title: `In einer Stunde: ${kind} bei ${application.company}`,
          body: `${timeOf(start)} Uhr · ${where}`,
        });
      }
    }

    // Dankeschön am Morgen nach einem Termin, solange er nicht zu lange her ist
    const recentlyPast =
      start <= now && now.getTime() - start.getTime() <= THANK_YOU_WINDOW_DAYS * DAY;
    if (settings.thankYou && (start > now || recentlyPast)) {
      planned.push({
        key: `thank-you:${basis}`,
        applicationId: application.id,
        kind: 'thank-you',
        dueAt: atLocalTime(start, 1, 9).toISOString(),
        title: `Dankeschön an ${application.company}?`,
        body: `Eine kurze Nachricht nach dem ${kind} hinterlässt einen guten Eindruck.`,
      });
    }
  }

  return planned;
}

/** Fälligkeit unter Berücksichtigung von „Später“ */
export function effectiveDueAt(reminder: Reminder) {
  return reminder.snoozedUntil ?? reminder.dueAt;
}

export function isOpen(reminder: Reminder) {
  return !reminder.doneAt;
}

/** Offene Erinnerungen, die bis zum Ende des heutigen Tages fällig sind, älteste zuerst */
export function dueToday<T extends Reminder>(reminders: T[], now = new Date()): T[] {
  const endOfDay = atLocalTime(now, 1, 0).toISOString();
  return reminders
    .filter((reminder) => isOpen(reminder) && effectiveDueAt(reminder) < endOfDay)
    .sort((a, b) => effectiveDueAt(a).localeCompare(effectiveDueAt(b)));
}

export function snoozeUntil(now = new Date()) {
  return atLocalTime(now, SNOOZE_DAYS, 9).toISOString();
}

export type ReminderChanges = {
  insert: PlannedReminder[];
  update: PlannedReminder[];
  /** Schlüssel, die entfallen */
  remove: string[];
};

/**
 * Vergleicht geplante mit gespeicherten Erinnerungen. Eigene Erinnerungen bleiben unberührt,
 * Erledigt- und Später-Status bleiben bei unverändertem Schlüssel erhalten.
 */
export function diffReminders(planned: PlannedReminder[], stored: Reminder[]): ReminderChanges {
  const storedByKey = new Map(stored.map((reminder) => [reminder.key, reminder]));
  const plannedKeys = new Set(planned.map((reminder) => reminder.key));
  const changes: ReminderChanges = { insert: [], update: [], remove: [] };

  for (const reminder of planned) {
    const existing = storedByKey.get(reminder.key);
    if (!existing) changes.insert.push(reminder);
    else if (
      existing.dueAt !== reminder.dueAt ||
      existing.title !== reminder.title ||
      existing.body !== reminder.body
    ) {
      changes.update.push(reminder);
    }
  }
  for (const reminder of stored) {
    if (reminder.kind !== 'custom' && !plannedKeys.has(reminder.key)) {
      changes.remove.push(reminder.key);
    }
  }
  return changes;
}

export function formatDue(reminder: Reminder, now = new Date()) {
  const due = new Date(effectiveDueAt(reminder));
  const days = Math.round(
    (atLocalTime(due, 0, 0).getTime() - atLocalTime(now, 0, 0).getTime()) / DAY,
  );
  if (days < 0) return days === -1 ? 'Seit gestern fällig' : `Seit ${-days} Tagen fällig`;
  if (days === 0) return `Heute, ${timeOf(due)} Uhr`;
  if (days === 1) return `Morgen, ${timeOf(due)} Uhr`;
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(due);
}
