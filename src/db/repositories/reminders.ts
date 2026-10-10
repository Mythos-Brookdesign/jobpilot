import { and, asc, eq, gte, inArray, isNull, max } from 'drizzle-orm';

import { withoutNulls, type Database } from '@/db/database';
import { toJobApplication } from '@/db/repositories/applications';
import { createSettingsRepository } from '@/db/repositories/settings';
import { applications, appointments, reminders, statusEvents, type ReminderRow } from '@/db/schema';
import { createId } from '@/domain/application';
import {
  DEFAULT_REMINDER_SETTINGS,
  diffReminders,
  effectiveDueAt,
  planReminders,
  type Reminder,
  type ReminderSettings,
} from '@/domain/reminders';

export type ReminderWithCompany = Reminder & { company: string };

const DAY = 24 * 60 * 60 * 1000;

function toReminder({ createdAt: _, ...row }: ReminderRow): Reminder {
  return withoutNulls(row);
}

export function createRemindersRepository(db: Database) {
  const settings = createSettingsRepository(db);
  const notArchived = isNull(applications.archivedAt);

  /** Erinnerungen nicht gelöschter Bewerbungen, mit Firmenname, nach Fälligkeit sortiert */
  function withCompany(where = notArchived): ReminderWithCompany[] {
    return db
      .select({ reminder: reminders, company: applications.company })
      .from(reminders)
      .innerJoin(applications, eq(reminders.applicationId, applications.id))
      .where(where)
      .all()
      .map(({ reminder, company }) => ({ ...toReminder(reminder), company }))
      .sort((a, b) => effectiveDueAt(a).localeCompare(effectiveDueAt(b)));
  }

  function reminderSettings(): ReminderSettings {
    const stored = settings.get('reminders.followUpDays');
    const followUpDays = stored === undefined ? NaN : Number(stored);
    return {
      followUpDays: Number.isInteger(followUpDays)
        ? followUpDays
        : DEFAULT_REMINDER_SETTINGS.followUpDays,
      appointments: settings.get('reminders.appointments') !== 'off',
      thankYou: settings.get('reminders.thankYou') !== 'off',
    };
  }

  return {
    settings: reminderSettings,

    saveSettings(next: ReminderSettings) {
      settings.set('reminders.followUpDays', String(next.followUpDays));
      settings.set('reminders.appointments', next.appointments ? 'on' : 'off');
      settings.set('reminders.thankYou', next.thankYou ? 'on' : 'off');
    },

    /**
     * Gleicht die gespeicherten Erinnerungen mit den Regeln ab. Gibt zurück, ob sich etwas
     * geändert hat – so lässt sich eine Endlosschleife aus Ändern und Neuberechnen vermeiden.
     */
    reconcile(now = new Date()): boolean {
      const lastChange = db
        .select({ applicationId: statusEvents.applicationId, at: max(statusEvents.at) })
        .from(statusEvents)
        .groupBy(statusEvents.applicationId)
        .all();
      const lastChangeById = new Map(lastChange.map((row) => [row.applicationId, row.at]));

      const activeRows = db.select().from(applications).where(notArchived).all();
      const activeIds = activeRows.map((row) => row.id);
      const appointmentRows = activeIds.length
        ? db
            .select()
            .from(appointments)
            .where(
              and(
                inArray(appointments.applicationId, activeIds),
                // Vergangene Termine nur, solange ein Dankeschön noch infrage kommt
                gte(appointments.startsAt, new Date(now.getTime() - 7 * DAY).toISOString()),
              ),
            )
            .all()
        : [];

      const planned = planReminders({
        applications: activeRows.map((row) => ({
          ...toJobApplication(row),
          lastStatusChangeAt: lastChangeById.get(row.id) ?? row.createdAt,
        })),
        appointments: appointmentRows.map(({ createdAt: _, ...row }) => withoutNulls(row)),
        settings: reminderSettings(),
        now,
      });
      const stored = db.select().from(reminders).all().map(toReminder);
      const changes = diffReminders(planned, stored);
      if (!changes.insert.length && !changes.update.length && !changes.remove.length) return false;

      const timestamp = now.toISOString();
      db.transaction((tx) => {
        if (changes.remove.length) {
          tx.delete(reminders).where(inArray(reminders.key, changes.remove)).run();
        }
        for (const reminder of changes.insert) {
          tx.insert(reminders)
            .values({ ...reminder, createdAt: timestamp })
            .run();
        }
        for (const { key, dueAt, title, body } of changes.update) {
          tx.update(reminders).set({ dueAt, title, body }).where(eq(reminders.key, key)).run();
        }
      });
      return true;
    },

    /** Offene Erinnerungen aller Bewerbungen */
    open(): ReminderWithCompany[] {
      return withCompany(and(notArchived, isNull(reminders.doneAt)));
    },

    forApplication(applicationId: string): ReminderWithCompany[] {
      return withCompany(
        and(notArchived, isNull(reminders.doneAt), eq(reminders.applicationId, applicationId)),
      );
    },

    markDone(key: string, now = new Date()) {
      db.update(reminders).set({ doneAt: now.toISOString() }).where(eq(reminders.key, key)).run();
    },

    snooze(key: string, until: string) {
      db.update(reminders).set({ snoozedUntil: until }).where(eq(reminders.key, key)).run();
    },

    addCustom(applicationId: string, title: string, dueAt: string, now = new Date()) {
      const key = `custom:${createId()}`;
      db.insert(reminders)
        .values({
          key,
          applicationId,
          kind: 'custom',
          dueAt,
          title: title.trim(),
          body: '',
          createdAt: now.toISOString(),
        })
        .run();
      return key;
    },

    remove(key: string) {
      db.delete(reminders).where(eq(reminders.key, key)).run();
    },

    /** Für Tests und Auswertungen: alle gespeicherten Erinnerungen, auch erledigte */
    all(): Reminder[] {
      return db.select().from(reminders).orderBy(asc(reminders.dueAt)).all().map(toReminder);
    },
  };
}

export type RemindersRepository = ReturnType<typeof createRemindersRepository>;
