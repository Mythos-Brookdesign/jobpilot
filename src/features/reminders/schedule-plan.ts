import { effectiveDueAt, isOpen, type Reminder } from '@/domain/reminders';

/** Nur Benachrichtigungen mit diesem Präfix gehören uns und werden abgeglichen */
export const NOTIFICATION_PREFIX = 'jobpilot:';

export const notificationId = (reminder: Pick<Reminder, 'key'>) =>
  `${NOTIFICATION_PREFIX}${reminder.key}`;

export type ScheduledNotification = { identifier: string; dueAt?: string };

/**
 * Vergleicht geplante Systembenachrichtigungen mit den offenen Erinnerungen.
 * Ergebnis: was abzusagen und was (neu) einzuplanen ist. Mehrfach ausführen ist unschädlich.
 */
export function planSchedule(
  scheduled: ScheduledNotification[],
  reminders: Reminder[],
  now = new Date(),
) {
  const wanted = new Map(
    reminders
      .filter((reminder) => isOpen(reminder) && new Date(effectiveDueAt(reminder)) > now)
      .map((reminder) => [notificationId(reminder), reminder]),
  );
  const current = new Map(
    scheduled
      .filter((notification) => notification.identifier.startsWith(NOTIFICATION_PREFIX))
      .map((notification) => [notification.identifier, notification.dueAt]),
  );

  const cancel = [...current.entries()]
    .filter(([identifier, dueAt]) => {
      const reminder = wanted.get(identifier);
      return !reminder || effectiveDueAt(reminder) !== dueAt;
    })
    .map(([identifier]) => identifier);

  const schedule = [...wanted.entries()]
    .filter(([identifier, reminder]) => current.get(identifier) !== effectiveDueAt(reminder))
    .map(([, reminder]) => reminder);

  return { cancel, schedule };
}
