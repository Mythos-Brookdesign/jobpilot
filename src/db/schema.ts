import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { APPLICATION_STATUSES } from '@/domain/application';

// Zeitpunkte als ISO-8601-Text, Kalendertage als YYYY-MM-DD.
// Nach Änderungen: `npm run db:generate` erzeugt die nächste Migration in ./drizzle

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    company: text('company').notNull(),
    role: text('role').notNull(),
    location: text('location').notNull(),
    appliedAt: text('applied_at').notNull(),
    status: text('status', { enum: APPLICATION_STATUSES }).notNull(),
    nextStep: text('next_step'),
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

export type ApplicationRow = typeof applications.$inferSelect;
export type StatusEventRow = typeof statusEvents.$inferSelect;
