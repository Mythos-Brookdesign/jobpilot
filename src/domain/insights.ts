import {
  PIPELINE_STATUSES,
  fromLocalIsoDate,
  toLocalIsoDate,
  type ApplicationStatus,
  type JobApplication,
  type PipelineStatus,
  type StatusEvent,
} from '@/domain/application';

// Auswertungen über alle Bewerbungen. Grundlage ist der Statusverlauf, damit auch
// abgesagte Bewerbungen zählen, die vorher z. B. ein Fachgespräch erreicht hatten.

const DAY_MS = 24 * 60 * 60 * 1000;

export type ApplicationHistory = { application: JobApplication; events: StatusEvent[] };

/** Stufen im Funnel – „Gemerkt“ zählt nicht, weil noch keine Bewerbung raus ist */
export const FUNNEL_STAGES = PIPELINE_STATUSES.filter((status) => status !== 'saved');
type FunnelStage = (typeof FUNNEL_STAGES)[number];

const stageIndex = (status: ApplicationStatus) =>
  (PIPELINE_STATUSES as readonly string[]).indexOf(status);

/** Höchste erreichte Stufe laut Verlauf und aktuellem Status */
export function highestStage({ application, events }: ApplicationHistory): PipelineStatus {
  const reached = [application.status, ...events.map((event) => event.to)]
    .map(stageIndex)
    .filter((index) => index >= 0);
  return PIPELINE_STATUSES[Math.max(0, ...reached)];
}

/** Wurde die Bewerbung abgeschickt? Zählt auch, wenn sie später abgesagt wurde. */
function wasSubmitted(history: ApplicationHistory) {
  return highestStage(history) !== 'saved';
}

export function funnel(histories: ApplicationHistory[]) {
  const submitted = histories.filter(wasSubmitted);
  return FUNNEL_STAGES.map((stage: FunnelStage) => {
    const count = submitted.filter(
      (history) => stageIndex(highestStage(history)) >= stageIndex(stage),
    ).length;
    return { stage, count, share: submitted.length ? count / submitted.length : 0 };
  });
}

/** Erste Reaktion des Unternehmens: Einladung, Angebot oder Absage nach dem Bewerben */
function firstResponse({ events }: ApplicationHistory) {
  const appliedAt = events.find((event) => event.to === 'applied')?.at;
  if (!appliedAt) return undefined;
  const response = events.find(
    (event) =>
      event.at > appliedAt &&
      event.to !== 'applied' &&
      event.to !== 'withdrawn' &&
      event.to !== 'saved',
  );
  return response ? { appliedAt, respondedAt: response.at } : undefined;
}

export type ResponseStats = {
  /** Bewerbungen, die abgeschickt wurden */
  submitted: number;
  responded: number;
  /** 0 bis 1 */
  rate: number;
  /** Durchschnitt in Tagen, undefined ohne Rückmeldungen */
  averageDays?: number;
};

export function responseStats(histories: ApplicationHistory[]): ResponseStats {
  const submitted = histories.filter(wasSubmitted);
  const responses = submitted
    .map(firstResponse)
    .filter((response): response is NonNullable<typeof response> => response !== undefined);
  const days = responses.map(
    ({ appliedAt, respondedAt }) =>
      (new Date(respondedAt).getTime() - new Date(appliedAt).getTime()) / DAY_MS,
  );
  return {
    submitted: submitted.length,
    responded: responses.length,
    rate: submitted.length ? responses.length / submitted.length : 0,
    averageDays: days.length
      ? Math.round((days.reduce((sum, d) => sum + d, 0) / days.length) * 10) / 10
      : undefined,
  };
}

export type SourceStats = {
  source: string;
  submitted: number;
  interviews: number;
  offers: number;
};

export const UNKNOWN_SOURCE = 'Ohne Angabe';

/** Erfolg je Quelle, sortiert nach Anzahl der Bewerbungen */
export function bySource(histories: ApplicationHistory[]): SourceStats[] {
  const stats = new Map<string, SourceStats>();
  for (const history of histories.filter(wasSubmitted)) {
    const source = history.application.source?.trim() || UNKNOWN_SOURCE;
    const entry = stats.get(source) ?? { source, submitted: 0, interviews: 0, offers: 0 };
    const stage = stageIndex(highestStage(history));
    entry.submitted += 1;
    if (stage >= stageIndex('screening')) entry.interviews += 1;
    if (stage >= stageIndex('offer')) entry.offers += 1;
    stats.set(source, entry);
  }
  return [...stats.values()].sort(
    (a, b) => b.submitted - a.submitted || a.source.localeCompare(b.source, 'de'),
  );
}

/** Montag der Woche, in der `date` liegt */
function weekStart(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/** ISO-Kalenderwoche */
export function isoWeek(date: Date) {
  const thursday = weekStart(date);
  thursday.setDate(thursday.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4, 12);
  return 1 + Math.round((thursday.getTime() - weekStart(firstThursday).getTime()) / (7 * DAY_MS));
}

/** Abgeschickte Bewerbungen pro Woche, die letzten `weeks` Wochen bis einschließlich heute */
export function weeklyActivity(histories: ApplicationHistory[], now = new Date(), weeks = 8) {
  const currentWeek = weekStart(now);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - 7 * (weeks - 1 - i));
    return { weekStart: toLocalIsoDate(start), label: `KW ${isoWeek(start)}`, count: 0 };
  });
  for (const history of histories.filter(wasSubmitted)) {
    const key = toLocalIsoDate(weekStart(fromLocalIsoDate(history.application.appliedAt)));
    const bucket = buckets.find((b) => b.weekStart === key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}
