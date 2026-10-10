// Reine Logik rund um Bewerbungen – ohne React, damit sie überall nutzbar und leicht testbar ist.
// Gespeichert werden englische Schlüssel, angezeigt die deutschen Texte.

/** Fortschritt einer Bewerbung, in dieser Reihenfolge */
export const PIPELINE_STATUSES = [
  'saved',
  'applied',
  'screening',
  'interview',
  'final',
  'offer',
] as const;

/** Endzustände ohne Fortschritt */
export const CLOSED_STATUSES = ['rejected', 'withdrawn'] as const;

export const APPLICATION_STATUSES = [...PIPELINE_STATUSES, ...CLOSED_STATUSES] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Gemerkt',
  applied: 'Beworben',
  screening: 'Screening',
  interview: 'Fachgespräch',
  final: 'Finale Runde',
  offer: 'Angebot',
  rejected: 'Abgesagt',
  withdrawn: 'Zurückgezogen',
};

export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'Vor Ort',
};

export const PRIORITIES = ['high', 'normal', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Hoch',
  normal: 'Normal',
  low: 'Niedrig',
};

/** Vorschläge im Formular, freie Eingabe bleibt möglich */
export const SOURCE_SUGGESTIONS = [
  'LinkedIn',
  'StepStone',
  'XING',
  'Indeed',
  'Firmenwebsite',
  'Empfehlung',
  'Recruiter',
];

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  workMode?: WorkMode;
  /** Kalendertag (YYYY-MM-DD): Bewerbungsdatum, bei „Gemerkt“ der Tag des Merkens */
  appliedAt: string;
  status: ApplicationStatus;
  priority: Priority;
  source?: string;
  jobUrl?: string;
  /** Jahresgehalt in Euro */
  salaryMin?: number;
  salaryMax?: number;
  nextStep?: string;
  /** Text der Stellenanzeige */
  jobDescription?: string;
};

export type ApplicationInput = Omit<JobApplication, 'id'>;

export type StatusEvent = { from: ApplicationStatus | null; to: ApplicationStatus; at: string };

// Filter fassen mehrere Status zu Gruppen zusammen
export const STATUS_FILTERS = [
  'all',
  'saved',
  'active',
  'interviewing',
  'offer',
  'closed',
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_STATUSES: Record<Exclude<StatusFilter, 'all'>, readonly ApplicationStatus[]> = {
  saved: ['saved'],
  active: ['applied', 'screening', 'interview', 'final'],
  interviewing: ['screening', 'interview', 'final'],
  offer: ['offer'],
  closed: CLOSED_STATUSES,
};

export const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Alle',
  saved: 'Gemerkt',
  active: 'Laufend',
  interviewing: 'Gespräche',
  offer: 'Angebote',
  closed: 'Abgeschlossen',
};

export function matchesFilter(status: ApplicationStatus, filter: StatusFilter) {
  return filter === 'all' || FILTER_STATUSES[filter].includes(status);
}

export function isStatusFilter(value: unknown): value is StatusFilter {
  return typeof value === 'string' && (STATUS_FILTERS as readonly string[]).includes(value);
}

export function countByFilter(applications: JobApplication[]) {
  const counts = Object.fromEntries(STATUS_FILTERS.map((filter) => [filter, 0])) as Record<
    StatusFilter,
    number
  >;
  for (const application of applications) {
    for (const filter of STATUS_FILTERS) {
      if (matchesFilter(application.status, filter)) counts[filter] += 1;
    }
  }
  return counts;
}

export function filterApplications(
  applications: JobApplication[],
  { filter, query }: { filter: StatusFilter; query: string },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');
  return applications.filter((application) => {
    const matchesQuery =
      !normalizedQuery ||
      [application.company, application.role, application.location, application.source ?? '']
        .join(' ')
        .toLocaleLowerCase('de-DE')
        .includes(normalizedQuery);
    return matchesFilter(application.status, filter) && matchesQuery;
  });
}

export const SORT_ORDERS = ['newest', 'priority', 'nextAppointment'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];
export const SORT_LABELS: Record<SortOrder, string> = {
  newest: 'Neueste',
  priority: 'Priorität',
  nextAppointment: 'Nächster Termin',
};

export function isSortOrder(value: unknown): value is SortOrder {
  return typeof value === 'string' && (SORT_ORDERS as readonly string[]).includes(value);
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

/**
 * Sortiert ohne die Eingabe zu verändern. Bei „Nächster Termin“ kommen Bewerbungen mit
 * dem frühesten anstehenden Termin zuerst, alle ohne Termin danach nach Datum.
 */
export function sortApplications(
  applications: JobApplication[],
  order: SortOrder,
  nextAppointmentById: ReadonlyMap<string, string> = new Map(),
) {
  const newestFirst = (a: JobApplication, b: JobApplication) =>
    b.appliedAt.localeCompare(a.appliedAt);

  return [...applications].sort((a, b) => {
    if (order === 'priority') {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || newestFirst(a, b);
    }
    if (order === 'nextAppointment') {
      const nextA = nextAppointmentById.get(a.id);
      const nextB = nextAppointmentById.get(b.id);
      if (nextA && nextB) return nextA.localeCompare(nextB);
      if (nextA) return -1;
      if (nextB) return 1;
    }
    return newestFirst(a, b);
  });
}

export function formatSalary(min?: number, max?: number) {
  const format = (value: number) =>
    new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value);
  if (min && max) return min === max ? `${format(min)} €` : `${format(min)}–${format(max)} €`;
  if (min) return `ab ${format(min)} €`;
  if (max) return `bis ${format(max)} €`;
  return undefined;
}

/** Eindeutig genug für lokale Daten, ohne native Abhängigkeit */
export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Lokaler Kalendertag als YYYY-MM-DD (toISOString allein würde in UTC umrechnen) */
export function toLocalIsoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** YYYY-MM-DD als lokales Datum um 12 Uhr – sicher gegen Zeitzonen- und Sommerzeitsprünge */
export function fromLocalIsoDate(day: string) {
  return new Date(`${day}T12:00:00`);
}
