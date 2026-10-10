import { and, asc, desc, eq, gte, isNull, lt } from 'drizzle-orm';

import { nullable, withoutNulls, type Database } from '@/db/database';
import { applications, appointments, contacts, notes } from '@/db/schema';
import { createId } from '@/domain/application';
import type {
  Appointment,
  AppointmentInput,
  Contact,
  ContactInput,
  Note,
  UpcomingAppointment,
} from '@/domain/details';

/** Kontakte, Notizen und Termine einer Bewerbung */
export function createDetailsRepository(db: Database) {
  return {
    // --- Kontakte ---

    contacts(applicationId: string): Contact[] {
      return db
        .select()
        .from(contacts)
        .where(eq(contacts.applicationId, applicationId))
        .orderBy(asc(contacts.createdAt))
        .all()
        .map(({ createdAt: _, ...row }) => withoutNulls(row));
    },

    contact(id: string): Contact | undefined {
      const row = db.select().from(contacts).where(eq(contacts.id, id)).get();
      if (!row) return undefined;
      const { createdAt: _, ...contact } = withoutNulls(row);
      return contact;
    },

    /** Legt an (ohne id) oder überschreibt (mit id) */
    saveContact(applicationId: string, input: ContactInput, id?: string, now = new Date()) {
      const values = {
        name: input.name,
        role: nullable(input.role),
        email: nullable(input.email),
        phone: nullable(input.phone),
        linkedinUrl: nullable(input.linkedinUrl),
      };
      if (id) {
        db.update(contacts).set(values).where(eq(contacts.id, id)).run();
        return id;
      }
      const newId = createId();
      db.insert(contacts)
        .values({ ...values, id: newId, applicationId, createdAt: now.toISOString() })
        .run();
      return newId;
    },

    deleteContact(id: string) {
      db.delete(contacts).where(eq(contacts.id, id)).run();
    },

    // --- Notizen ---

    notes(applicationId: string): Note[] {
      return db
        .select()
        .from(notes)
        .where(eq(notes.applicationId, applicationId))
        .orderBy(desc(notes.createdAt))
        .all();
    },

    addNote(applicationId: string, body: string, now = new Date()) {
      const id = createId();
      db.insert(notes)
        .values({ id, applicationId, body: body.trim(), createdAt: now.toISOString() })
        .run();
      return id;
    },

    deleteNote(id: string) {
      db.delete(notes).where(eq(notes.id, id)).run();
    },

    // --- Termine ---

    appointments(applicationId: string): Appointment[] {
      return db
        .select()
        .from(appointments)
        .where(eq(appointments.applicationId, applicationId))
        .orderBy(asc(appointments.startsAt))
        .all()
        .map(({ createdAt: _, ...row }) => withoutNulls(row));
    },

    appointment(id: string): Appointment | undefined {
      const row = db.select().from(appointments).where(eq(appointments.id, id)).get();
      if (!row) return undefined;
      const { createdAt: _, ...appointment } = withoutNulls(row);
      return appointment;
    },

    saveAppointment(applicationId: string, input: AppointmentInput, id?: string, now = new Date()) {
      const values = {
        kind: input.kind,
        startsAt: input.startsAt,
        location: nullable(input.location),
        notes: nullable(input.notes),
      };
      if (id) {
        db.update(appointments).set(values).where(eq(appointments.id, id)).run();
        return id;
      }
      const newId = createId();
      db.insert(appointments)
        .values({ ...values, id: newId, applicationId, createdAt: now.toISOString() })
        .run();
      return newId;
    },

    deleteAppointment(id: string) {
      db.delete(appointments).where(eq(appointments.id, id)).run();
    },

    /** Termine aller nicht gelöschten Bewerbungen im Zeitraum [from, to), früheste zuerst */
    upcomingAppointments(from: Date, to: Date): UpcomingAppointment[] {
      return db
        .select({
          appointment: appointments,
          company: applications.company,
          role: applications.role,
        })
        .from(appointments)
        .innerJoin(applications, eq(appointments.applicationId, applications.id))
        .where(
          and(
            isNull(applications.archivedAt),
            gte(appointments.startsAt, from.toISOString()),
            lt(appointments.startsAt, to.toISOString()),
          ),
        )
        .orderBy(asc(appointments.startsAt))
        .all()
        .map(({ appointment: { createdAt: _, ...appointment }, company, role }) => ({
          ...withoutNulls(appointment),
          company,
          role,
        }));
    },

    /** Frühester anstehender Termin je Bewerbung – für die Sortierung */
    nextAppointmentByApplication(now = new Date()): Map<string, string> {
      const rows = db
        .select({ applicationId: appointments.applicationId, startsAt: appointments.startsAt })
        .from(appointments)
        .where(gte(appointments.startsAt, now.toISOString()))
        .orderBy(asc(appointments.startsAt))
        .all();
      const next = new Map<string, string>();
      for (const row of rows) {
        if (!next.has(row.applicationId)) next.set(row.applicationId, row.startsAt);
      }
      return next;
    },
  };
}

export type DetailsRepository = ReturnType<typeof createDetailsRepository>;
