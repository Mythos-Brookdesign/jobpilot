// Reine Logik rund um Bewerbungen – ohne React, damit sie überall nutzbar und leicht testbar ist.

export const APPLICATION_STATUSES = ['sent', 'interview', 'offer', 'rejected'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// Gespeichert werden die englischen Schlüssel, angezeigt die deutschen Texte
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: 'Gesendet',
  interview: 'Gespräch',
  offer: 'Angebot',
  rejected: 'Abgesagt',
};

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  /** Kalendertag im Format YYYY-MM-DD */
  appliedAt: string;
  status: ApplicationStatus;
  nextStep?: string;
};

export type NewApplication = Omit<JobApplication, 'id'>;

export type StatusFilter = 'all' | ApplicationStatus;

export function countByStatus(applications: JobApplication[]) {
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0])) as Record<
    ApplicationStatus,
    number
  >;
  for (const application of applications) {
    counts[application.status] += 1;
  }
  return counts;
}

export function filterApplications(
  applications: JobApplication[],
  { status, query }: { status: StatusFilter; query: string },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');
  return applications.filter((application) => {
    const matchesStatus = status === 'all' || application.status === status;
    const matchesQuery =
      !normalizedQuery ||
      `${application.company} ${application.role} ${application.location}`
        .toLocaleLowerCase('de-DE')
        .includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });
}

/** Erste Bewerbung, für die ein Gespräch ansteht */
export function findNextInterview(applications: JobApplication[]) {
  return applications.find((application) => application.status === 'interview');
}

/** Lokaler Kalendertag als YYYY-MM-DD (toISOString allein würde in UTC umrechnen) */
export function toLocalIsoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
