// Kontakte, Notizen und Termine einer Bewerbung

export const APPOINTMENT_KINDS = ['phone', 'video', 'onsite', 'technical'] as const;
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number];
export const APPOINTMENT_KIND_LABELS: Record<AppointmentKind, string> = {
  phone: 'Telefon',
  video: 'Video-Call',
  onsite: 'Vor Ort',
  technical: 'Tech-Interview',
};

export type Appointment = {
  id: string;
  applicationId: string;
  kind: AppointmentKind;
  /** Zeitpunkt als ISO-8601 */
  startsAt: string;
  /** Adresse oder Link zum Call */
  location?: string;
  notes?: string;
};

export type AppointmentInput = Omit<Appointment, 'id' | 'applicationId'>;

/** Termin mit Firma und Position – für Listen über alle Bewerbungen hinweg */
export type UpcomingAppointment = Appointment & { company: string; role: string };

export type Contact = {
  id: string;
  applicationId: string;
  name: string;
  /** z. B. Recruiterin, Hiring Manager */
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
};

export type ContactInput = Omit<Contact, 'id' | 'applicationId'>;

export type Note = {
  id: string;
  applicationId: string;
  body: string;
  createdAt: string;
};

export function formatAppointmentTime(startsAt: string, now = new Date()) {
  const date = new Date(startsAt);
  const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(
    date,
  );
  const dayDiff = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (dayDiff === 0) return `Heute, ${time} Uhr`;
  if (dayDiff === 1) return `Morgen, ${time} Uhr`;
  const day = new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  }).format(date);
  return `${day}, ${time} Uhr`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
