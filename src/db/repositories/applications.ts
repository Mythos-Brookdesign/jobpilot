import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import { nullable, withoutNulls, type Database } from '@/db/database';
import { applications, statusEvents, type ApplicationRow } from '@/db/schema';
import {
  createId,
  type ApplicationInput,
  type ApplicationStatus,
  type JobApplication,
  type StatusEvent,
} from '@/domain/application';
import type { ApplicationHistory } from '@/domain/insights';

export function toJobApplication(row: ApplicationRow): JobApplication {
  const { createdAt: _c, updatedAt: _u, archivedAt: _a, ...application } = withoutNulls(row);
  return application;
}

function toColumns(input: ApplicationInput) {
  return {
    ...input,
    workMode: nullable(input.workMode),
    source: nullable(input.source),
    jobUrl: nullable(input.jobUrl),
    salaryMin: nullable(input.salaryMin),
    salaryMax: nullable(input.salaryMax),
    nextStep: nullable(input.nextStep),
  };
}

const notArchived = isNull(applications.archivedAt);

export function createApplicationsRepository(db: Database) {
  function insertEvent(
    tx: Pick<Database, 'insert'>,
    applicationId: string,
    from: ApplicationStatus | null,
    to: ApplicationStatus,
    at: string,
  ) {
    tx.insert(statusEvents).values({ applicationId, fromStatus: from, toStatus: to, at }).run();
  }

  return {
    /** Nicht gelöschte Bewerbungen, neueste zuerst */
    listActive(): JobApplication[] {
      return db
        .select()
        .from(applications)
        .where(notArchived)
        .orderBy(desc(applications.appliedAt), desc(applications.createdAt))
        .all()
        .map(toJobApplication);
    },

    get(id: string): JobApplication | undefined {
      const row = db
        .select()
        .from(applications)
        .where(and(eq(applications.id, id), notArchived))
        .get();
      return row ? toJobApplication(row) : undefined;
    },

    create(input: ApplicationInput, now = new Date()): JobApplication {
      const id = createId();
      const timestamp = now.toISOString();
      db.transaction((tx) => {
        tx.insert(applications)
          .values({ ...toColumns(input), id, createdAt: timestamp, updatedAt: timestamp })
          .run();
        insertEvent(tx, id, null, input.status, timestamp);
      });
      return { ...input, id };
    },

    /** Speichert alle Felder; ein geänderter Status wird wie bei changeStatus protokolliert */
    update(id: string, input: ApplicationInput, now = new Date()) {
      const timestamp = now.toISOString();
      db.transaction((tx) => {
        const current = tx
          .select({ status: applications.status })
          .from(applications)
          .where(eq(applications.id, id))
          .get();
        if (!current) return;
        tx.update(applications)
          .set({ ...toColumns(input), updatedAt: timestamp })
          .where(eq(applications.id, id))
          .run();
        if (current.status !== input.status) {
          insertEvent(tx, id, current.status, input.status, timestamp);
        }
      });
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
        insertEvent(tx, id, current.status, to, timestamp);
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

    statusEvents(applicationId: string): StatusEvent[] {
      return db
        .select()
        .from(statusEvents)
        .where(eq(statusEvents.applicationId, applicationId))
        .orderBy(asc(statusEvents.at), asc(statusEvents.id))
        .all()
        .map((row) => ({ from: row.fromStatus, to: row.toStatus, at: row.at }));
    },

    /** Alle nicht gelöschten Bewerbungen mit ihrem Verlauf – für die Auswertungen */
    histories(): ApplicationHistory[] {
      const rows = db
        .select({ application: applications, event: statusEvents })
        .from(applications)
        .leftJoin(statusEvents, eq(statusEvents.applicationId, applications.id))
        .where(notArchived)
        .orderBy(asc(statusEvents.at), asc(statusEvents.id))
        .all();
      const byId = new Map<string, ApplicationHistory>();
      for (const { application, event } of rows) {
        const history = byId.get(application.id) ?? {
          application: toJobApplication(application),
          events: [],
        };
        if (event)
          history.events.push({ from: event.fromStatus, to: event.toStatus, at: event.at });
        byId.set(application.id, history);
      }
      return [...byId.values()];
    },
  };
}

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
