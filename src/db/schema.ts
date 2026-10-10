import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { APPLICATION_STATUSES, PRIORITIES, WORK_MODES } from '@/domain/application';
import { APPOINTMENT_KINDS } from '@/domain/details';
import { REMINDER_KINDS } from '@/domain/reminders';

// Zeitpunkte als ISO-8601-Text, Kalendertage als YYYY-MM-DD.
// Nach Änderungen: `npm run db:generate -- --name …` erzeugt die nächste Migration in ./drizzle

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    company: text('company').notNull(),
    role: text('role').notNull(),
    location: text('location').notNull(),
    workMode: text('work_mode', { enum: WORK_MODES }),
    appliedAt: text('applied_at').notNull(),
    status: text('status', { enum: APPLICATION_STATUSES }).notNull(),
    priority: text('priority', { enum: PRIORITIES }).notNull().default('normal'),
    source: text('source'),
    jobUrl: text('job_url'),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    nextStep: text('next_step'),
    /** Text der Stellenanzeige – Grundlage für den KI-Assistenten */
    jobDescription: text('job_description'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    /** Gesetzt = gelöscht, lässt sich aber wiederherstellen */
    archivedAt: text('archived_at'),
  },
  (table) => [index('applications_archived_at_idx').on(table.archivedAt)],
);

/** Jede Statusänderung – Grundlage für Timeline und Auswertungen */
export const statusEvents = sqliteTable(
  'status_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    /** null beim Anlegen der Bewerbung */
    fromStatus: text('from_status', { enum: APPLICATION_STATUSES }),
    toStatus: text('to_status', { enum: APPLICATION_STATUSES }).notNull(),
    at: text('at').notNull(),
  },
  (table) => [index('status_events_application_id_idx').on(table.applicationId)],
);

export const contacts = sqliteTable(
  'contacts',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    role: text('role'),
    email: text('email'),
    phone: text('phone'),
    linkedinUrl: text('linkedin_url'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('contacts_application_id_idx').on(table.applicationId)],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('notes_application_id_idx').on(table.applicationId)],
);

export const appointments = sqliteTable(
  'appointments',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: APPOINTMENT_KINDS }).notNull(),
    startsAt: text('starts_at').notNull(),
    location: text('location'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('appointments_application_id_idx').on(table.applicationId),
    index('appointments_starts_at_idx').on(table.startsAt),
  ],
);

/**
 * Erinnerungen – Quelle der Wahrheit für die In-App-Liste und die Benachrichtigungen.
 * Der Schlüssel dient zugleich als ID der geplanten Benachrichtigung.
 */
export const reminders = sqliteTable(
  'reminders',
  {
    key: text('key').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: REMINDER_KINDS }).notNull(),
    dueAt: text('due_at').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    doneAt: text('done_at'),
    snoozedUntil: text('snoozed_until'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('reminders_application_id_idx').on(table.applicationId),
    index('reminders_due_at_idx').on(table.dueAt),
  ],
);

/** Kleine App-Einstellungen wie zuletzt gewählter Filter oder Sortierung */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type ApplicationRow = typeof applications.$inferSelect;
export type StatusEventRow = typeof statusEvents.$inferSelect;
export type ContactRow = typeof contacts.$inferSelect;
export type NoteRow = typeof notes.$inferSelect;
export type AppointmentRow = typeof appointments.$inferSelect;
export type ReminderRow = typeof reminders.$inferSelect;
