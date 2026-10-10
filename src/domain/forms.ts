import { z } from 'zod';

import {
  APPLICATION_STATUSES,
  PRIORITIES,
  WORK_MODES,
  type ApplicationInput,
  type JobApplication,
} from '@/domain/application';
import {
  APPOINTMENT_KINDS,
  type Appointment,
  type AppointmentInput,
  type Contact,
  type ContactInput,
} from '@/domain/details';

// Formulare liefern Text. Hier wird geprüft und in die Domain-Typen umgewandelt,
// mit einer verständlichen Meldung pro Feld.

export type FormResult<T, F extends string> =
  { ok: true; value: T } | { ok: false; errors: Partial<Record<F, string>> };

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined);

/** Ergänzt fehlendes https://, damit „firma.de/jobs“ auch funktioniert */
const optionalUrl = optionalText.pipe(
  z
    .string()
    .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
    .pipe(z.url({ protocol: /^https?$/, message: 'Bitte einen gültigen Link eingeben' }))
    .optional(),
);

const optionalEuro = z
  .string()
  .trim()
  .transform((value) => value.replace(/[.\s€]/g, ''))
  .refine((value) => value === '' || /^\d+$/.test(value), 'Bitte nur ganze Euro-Beträge')
  .transform((value) => (value === '' ? undefined : Number(value)));

function collectErrors<F extends string>(error: z.ZodError): Partial<Record<F, string>> {
  const errors: Partial<Record<F, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as F;
    errors[field] ??= issue.message;
  }
  return errors;
}

// --- Bewerbung -------------------------------------------------------------------------------

export type ApplicationFormValues = {
  company: string;
  role: string;
  location: string;
  workMode: ApplicationInput['workMode'] | '';
  appliedAt: string;
  status: ApplicationInput['status'];
  priority: ApplicationInput['priority'];
  source: string;
  jobUrl: string;
  salaryMin: string;
  salaryMax: string;
  nextStep: string;
};

export type ApplicationFormField = keyof ApplicationFormValues;

const applicationSchema = z
  .object({
    company: z.string().trim().min(1, 'Bitte das Unternehmen angeben'),
    role: z.string().trim().min(1, 'Bitte die Position angeben'),
    location: z.string().trim(),
    workMode: z.union([z.enum(WORK_MODES), z.literal('')]).transform((value) => value || undefined),
    appliedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte ein Datum wählen'),
    status: z.enum(APPLICATION_STATUSES),
    priority: z.enum(PRIORITIES),
    source: optionalText,
    jobUrl: optionalUrl,
    salaryMin: optionalEuro,
    salaryMax: optionalEuro,
    nextStep: optionalText,
  })
  .refine((v) => !v.salaryMin || !v.salaryMax || v.salaryMin <= v.salaryMax, {
    path: ['salaryMax'],
    message: 'Darf nicht kleiner als „von“ sein',
  });

export function emptyApplicationForm(today: string): ApplicationFormValues {
  return {
    company: '',
    role: '',
    location: '',
    workMode: '',
    appliedAt: today,
    status: 'applied',
    priority: 'normal',
    source: '',
    jobUrl: '',
    salaryMin: '',
    salaryMax: '',
    nextStep: '',
  };
}

export function applicationToForm(application: JobApplication): ApplicationFormValues {
  return {
    company: application.company,
    role: application.role,
    location: application.location,
    workMode: application.workMode ?? '',
    appliedAt: application.appliedAt,
    status: application.status,
    priority: application.priority,
    source: application.source ?? '',
    jobUrl: application.jobUrl ?? '',
    salaryMin: formatEuroInput(application.salaryMin),
    salaryMax: formatEuroInput(application.salaryMax),
    nextStep: application.nextStep ?? '',
  };
}

/** 75000 → „75.000“ – lesbar im Formular, parseApplicationForm versteht es wieder */
function formatEuroInput(value?: number) {
  return value === undefined ? '' : new Intl.NumberFormat('de-DE').format(value);
}

export function parseApplicationForm(
  values: ApplicationFormValues,
): FormResult<ApplicationInput, ApplicationFormField> {
  const result = applicationSchema.safeParse(values);
  if (!result.success) return { ok: false, errors: collectErrors(result.error) };
  return { ok: true, value: withoutUndefined(result.data) };
}

// --- Termin ----------------------------------------------------------------------------------

export type AppointmentFormValues = {
  kind: AppointmentInput['kind'];
  startsAt: Date;
  location: string;
  notes: string;
};

export type AppointmentFormField = keyof AppointmentFormValues;

const appointmentSchema = z.object({
  kind: z.enum(APPOINTMENT_KINDS),
  startsAt: z.date().transform((date) => date.toISOString()),
  location: optionalText,
  notes: optionalText,
});

export function emptyAppointmentForm(now = new Date()): AppointmentFormValues {
  // Vorschlag: morgen, 10 Uhr
  const startsAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
  return { kind: 'video', startsAt, location: '', notes: '' };
}

export function appointmentToForm(appointment: Appointment): AppointmentFormValues {
  return {
    kind: appointment.kind,
    startsAt: new Date(appointment.startsAt),
    location: appointment.location ?? '',
    notes: appointment.notes ?? '',
  };
}

export function parseAppointmentForm(
  values: AppointmentFormValues,
): FormResult<AppointmentInput, AppointmentFormField> {
  const result = appointmentSchema.safeParse(values);
  if (!result.success) return { ok: false, errors: collectErrors(result.error) };
  return { ok: true, value: withoutUndefined(result.data) };
}

// --- Kontakt ---------------------------------------------------------------------------------

export type ContactFormValues = Record<keyof ContactInput, string>;
export type ContactFormField = keyof ContactFormValues;

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Bitte einen Namen angeben'),
  role: optionalText,
  email: optionalText.pipe(z.email('Bitte eine gültige E-Mail-Adresse eingeben').optional()),
  phone: optionalText,
  linkedinUrl: optionalUrl,
});

export function emptyContactForm(): ContactFormValues {
  return { name: '', role: '', email: '', phone: '', linkedinUrl: '' };
}

export function contactToForm(contact: Contact): ContactFormValues {
  return {
    name: contact.name,
    role: contact.role ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    linkedinUrl: contact.linkedinUrl ?? '',
  };
}

export function parseContactForm(
  values: ContactFormValues,
): FormResult<ContactInput, ContactFormField> {
  const result = contactSchema.safeParse(values);
  if (!result.success) return { ok: false, errors: collectErrors(result.error) };
  return { ok: true, value: withoutUndefined(result.data) };
}

/** Leere optionale Felder ganz weglassen statt sie als undefined mitzuführen */
function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}
