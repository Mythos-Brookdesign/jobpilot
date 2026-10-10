import { asc, eq, inArray } from 'drizzle-orm';

import { nullable, withoutNulls, type Database } from '@/db/database';
import { createApplicationsRepository, toJobApplication } from '@/db/repositories/applications';
import { applications, appointments, contacts, notes, statusEvents } from '@/db/schema';
import { BACKUP_FORMAT, BACKUP_VERSION, type Backup } from '@/domain/backup';

export function createBackupRepository(db: Database) {
  const applicationsRepository = createApplicationsRepository(db);

  /** Alle Zeilen einer Tabelle zu den Bewerbungen, gruppiert nach Bewerbung */
  function groupBy<T extends { applicationId: string }>(rows: T[]) {
    const groups = new Map<string, Omit<T, 'applicationId'>[]>();
    for (const { applicationId, ...rest } of rows) {
      groups.set(applicationId, [...(groups.get(applicationId) ?? []), rest]);
    }
    return groups;
  }

  return {
    /** Alle nicht gelöschten Bewerbungen mit Verlauf, Kontakten, Notizen und Terminen */
    export(now = new Date()): Backup {
      const ids = applicationsRepository.listActive().map((application) => application.id);
      const rows = ids.length
        ? db.select().from(applications).where(inArray(applications.id, ids)).all()
        : [];
      const byId = new Map(rows.map((row) => [row.id, row]));
      const related = <T extends { applicationId: string }>(query: () => T[]) =>
        groupBy(ids.length ? query() : []);

      const events = related(() =>
        db
          .select()
          .from(statusEvents)
          .where(inArray(statusEvents.applicationId, ids))
          .orderBy(asc(statusEvents.at), asc(statusEvents.id))
          .all(),
      );
      const contactRows = related(() =>
        db
          .select()
          .from(contacts)
          .where(inArray(contacts.applicationId, ids))
          .orderBy(asc(contacts.createdAt))
          .all(),
      );
      const noteRows = related(() =>
        db
          .select()
          .from(notes)
          .where(inArray(notes.applicationId, ids))
          .orderBy(asc(notes.createdAt))
          .all(),
      );
      const appointmentRows = related(() =>
        db
          .select()
          .from(appointments)
          .where(inArray(appointments.applicationId, ids))
          .orderBy(asc(appointments.startsAt))
          .all(),
      );

      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: now.toISOString(),
        applications: ids.map((id) => {
          const row = byId.get(id)!;
          return {
            ...toJobApplication(row),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            statusEvents: (events.get(id) ?? []).map((e) => ({
              from: e.fromStatus,
              to: e.toStatus,
              at: e.at,
            })),
            contacts: (contactRows.get(id) ?? []).map(({ createdAt: _, ...c }) => withoutNulls(c)),
            notes: noteRows.get(id) ?? [],
            appointments: (appointmentRows.get(id) ?? []).map(({ createdAt: _, ...a }) =>
              withoutNulls(a),
            ),
          };
        }),
      };
    },

    /**
     * Übernimmt alle Einträge des Backups. Bewerbungen mit gleicher ID werden samt Details
     * ersetzt (auch gelöschte kommen zurück), alle anderen bleiben unverändert.
     */
    import(backup: Backup): number {
      db.transaction((tx) => {
        for (const entry of backup.applications) {
          const {
            statusEvents: events,
            contacts: contactList,
            notes: noteList,
            appointments: appointmentList,
            ...application
          } = entry;
          const values = {
            ...application,
            workMode: nullable(application.workMode),
            source: nullable(application.source),
            jobUrl: nullable(application.jobUrl),
            salaryMin: nullable(application.salaryMin),
            salaryMax: nullable(application.salaryMax),
            nextStep: nullable(application.nextStep),
            jobDescription: nullable(application.jobDescription),
            archivedAt: null,
          };
          tx.insert(applications)
            .values(values)
            .onConflictDoUpdate({ target: applications.id, set: values })
            .run();

          const applicationId = application.id;
          for (const table of [statusEvents, contacts, notes, appointments]) {
            tx.delete(table).where(eq(table.applicationId, applicationId)).run();
          }
          if (events.length) {
            tx.insert(statusEvents)
              .values(
                events.map((e) => ({
                  applicationId,
                  fromStatus: e.from,
                  toStatus: e.to,
                  at: e.at,
                })),
              )
              .run();
          }
          // Details tragen kein eigenes Erstellungsdatum im Backup – das der Bewerbung genügt
          const createdAt = application.createdAt;
          if (contactList.length) {
            tx.insert(contacts)
              .values(
                contactList.map((c) => ({
                  ...c,
                  applicationId,
                  role: nullable(c.role),
                  email: nullable(c.email),
                  phone: nullable(c.phone),
                  linkedinUrl: nullable(c.linkedinUrl),
                  createdAt,
                })),
              )
              .run();
          }
          if (noteList.length) {
            tx.insert(notes)
              .values(noteList.map((n) => ({ ...n, applicationId })))
              .run();
          }
          if (appointmentList.length) {
            tx.insert(appointments)
              .values(
                appointmentList.map((a) => ({
                  ...a,
                  applicationId,
                  location: nullable(a.location),
                  notes: nullable(a.notes),
                  createdAt,
                })),
              )
              .run();
          }
        }
      });
      return backup.applications.length;
    },
  };
}

export type BackupRepository = ReturnType<typeof createBackupRepository>;
