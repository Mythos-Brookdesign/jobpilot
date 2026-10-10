import { desc, eq, inArray, isNull } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import * as schema from '@/db/schema';
import { applications, statusEvents, type ApplicationRow } from '@/db/schema';
import {
  createId,
  type ApplicationStatus,
  type JobApplication,
  type NewApplication,
} from '@/domain/application';
import { BACKUP_FORMAT, BACKUP_VERSION, type Backup } from '@/domain/backup';

/**
 * Gemeinsamer Typ für alle synchronen SQLite-Treiber von Drizzle:
 * expo-sqlite in der App, better-sqlite3 in den Tests. `any`, weil sich der Rückgabetyp
 * von run() je Treiber unterscheidet.
 */
export type Database = BaseSQLiteDatabase<'sync', any, typeof schema>;

export function toJobApplication(row: ApplicationRow): JobApplication {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    location: row.location,
    appliedAt: row.appliedAt,
    status: row.status,
    ...(row.nextStep ? { nextStep: row.nextStep } : {}),
  };
}

export function createApplicationsRepository(db: Database) {
  /** Nicht gelöschte Bewerbungen, neueste zuerst */
  function activeQuery() {
    return db
      .select()
      .from(applications)
      .where(isNull(applications.archivedAt))
      .orderBy(desc(applications.appliedAt), desc(applications.createdAt));
  }

  return {
    listActive(): JobApplication[] {
      return activeQuery().all().map(toJobApplication);
    },

    create(input: NewApplication, now = new Date()): JobApplication {
      const id = createId();
      const timestamp = now.toISOString();
      db.transaction((tx) => {
        tx.insert(applications)
          .values({
            ...input,
            id,
            nextStep: input.nextStep ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
          .run();
        tx.insert(statusEvents)
          .values({ applicationId: id, fromStatus: null, toStatus: input.status, at: timestamp })
          .run();
      });
      return { ...input, id };
    },

    /** Ändert den Status und protokolliert den Wechsel. false, wenn sich nichts ändert. */
    changeStatus(id: string, to: ApplicationStatus, now = new Date()): boolean {
      const timestamp = now.toISOString();
      return db.transaction((tx) => {
        const current = tx
          .select({ status: applications.status })
          .from(applications)
          .where(eq(applications.id, id))
          .get();
        if (!current || current.status === to) {
          return false;
        }
        tx.update(applications)
          .set({ status: to, updatedAt: timestamp })
          .where(eq(applications.id, id))
          .run();
        tx.insert(statusEvents)
          .values({ applicationId: id, fromStatus: current.status, toStatus: to, at: timestamp })
          .run();
        return true;
      });
    },

    /** Weiches Löschen: Eintrag verschwindet aus allen Listen, lässt sich aber zurückholen */
    archive(id: string, now = new Date()) {
      db.update(applications)
        .set({ archivedAt: now.toISOString() })
        .where(eq(applications.id, id))
        .run();
    },

    restore(id: string) {
      db.update(applications).set({ archivedAt: null }).where(eq(applications.id, id)).run();
    },

    exportBackup(now = new Date()): Backup {
      const rows = activeQuery().all();
      const events = rows.length
        ? db
            .select()
            .from(statusEvents)
            .where(
              inArray(
                statusEvents.applicationId,
                rows.map((row) => row.id),
              ),
            )
            .orderBy(statusEvents.at, statusEvents.id)
            .all()
        : [];

      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: now.toISOString(),
        applications: rows.map((row) => ({
          ...toJobApplication(row),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          statusEvents: events
            .filter((event) => event.applicationId === row.id)
            .map((event) => ({ from: event.fromStatus, to: event.toStatus, at: event.at })),
        })),
      };
    },

    /**
     * Übernimmt alle Einträge des Backups. Bewerbungen mit gleicher ID werden ersetzt
     * (auch gelöschte kommen zurück), alle anderen bleiben unverändert.
     */
    importBackup(backup: Backup): number {
      db.transaction((tx) => {
        for (const { statusEvents: events, ...application } of backup.applications) {
          const values = {
            ...application,
            nextStep: application.nextStep ?? null,
            archivedAt: null,
          };
          tx.insert(applications)
            .values(values)
            .onConflictDoUpdate({ target: applications.id, set: values })
            .run();
          tx.delete(statusEvents).where(eq(statusEvents.applicationId, application.id)).run();
          if (events.length) {
            tx.insert(statusEvents)
              .values(
                events.map((event) => ({
                  applicationId: application.id,
                  fromStatus: event.from,
                  toStatus: event.to,
                  at: event.at,
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

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
