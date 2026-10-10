import type { StatusEvent } from '@/domain/application';
import type { Appointment, Note } from '@/domain/details';

export type TimelineItem =
  | { kind: 'status'; at: string; event: StatusEvent }
  | { kind: 'note'; at: string; note: Note }
  | { kind: 'appointment'; at: string; appointment: Appointment; upcoming: boolean };

/** Verlauf einer Bewerbung, neueste Einträge zuerst; geplante Termine stehen oben */
export function buildTimeline(
  {
    events,
    notes,
    appointments,
  }: { events: StatusEvent[]; notes: Note[]; appointments: Appointment[] },
  now = new Date(),
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...events.map((event) => ({ kind: 'status' as const, at: event.at, event })),
    ...notes.map((note) => ({ kind: 'note' as const, at: note.createdAt, note })),
    ...appointments.map((appointment) => ({
      kind: 'appointment' as const,
      at: appointment.startsAt,
      appointment,
      upcoming: new Date(appointment.startsAt) > now,
    })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
