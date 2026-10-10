import { z } from 'zod';

import { APPLICATION_STATUSES, PRIORITIES, WORK_MODES } from '@/domain/application';
import { APPOINTMENT_KINDS } from '@/domain/details';

// Austauschformat für Export und Import. Bei inkompatiblen Änderungen `version` erhöhen
// und in upgrade() eine Umwandlung für die alte Version ergänzen.

export const BACKUP_FORMAT = 'jobpilot-backup';
export const BACKUP_VERSION = 2;

const status = z.enum(APPLICATION_STATUSES);
const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT erwartet');
const timestamp = z.iso.datetime({ offset: true });

const backupApplication = z.object({
  id: z.string().min(1),
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  location: z.string(),
  workMode: z.enum(WORK_MODES).optional(),
  appliedAt: calendarDay,
  status,
  priority: z.enum(PRIORITIES),
  source: z.string().optional(),
  jobUrl: z.string().optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  nextStep: z.string().optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
  statusEvents: z.array(z.object({ from: status.nullable(), to: status, at: timestamp })),
  contacts: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      role: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
    }),
  ),
  notes: z.array(z.object({ id: z.string().min(1), body: z.string(), createdAt: timestamp })),
  appointments: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum(APPOINTMENT_KINDS),
      startsAt: timestamp,
      location: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: timestamp,
  applications: z.array(backupApplication),
});

export type Backup = z.infer<typeof backupSchema>;
export type BackupApplication = z.infer<typeof backupApplication>;

export type ParseBackupResult = { ok: true; backup: Backup } | { ok: false; error: string };

// Version 1 kannte nur vier Status; „sent“ heißt seit Version 2 „applied“
const V1_STATUS: Record<string, string> = { sent: 'applied' };

type JsonObject = Record<string, unknown>;

/** Hebt ältere Backups auf die aktuelle Version, bevor sie geprüft werden */
function upgrade(json: JsonObject): JsonObject {
  if (json.version !== 1 || !Array.isArray(json.applications)) return json;
  const status = (value: unknown) =>
    typeof value === 'string' ? (V1_STATUS[value] ?? value) : value;
  return {
    ...json,
    version: 2,
    applications: (json.applications as JsonObject[]).map((application) => ({
      ...application,
      status: status(application.status),
      priority: 'normal',
      statusEvents: Array.isArray(application.statusEvents)
        ? (application.statusEvents as JsonObject[]).map((event) => ({
            ...event,
            from: status(event.from),
            to: status(event.to),
          }))
        : application.statusEvents,
      contacts: [],
      notes: [],
      appointments: [],
    })),
  };
}

export function parseBackup(text: string): ParseBackupResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' };
  }

  if (typeof json !== 'object' || json === null || !('format' in json)) {
    return { ok: false, error: 'Die Datei ist kein jobpilot-Backup.' };
  }
  if (json.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Die Datei ist kein jobpilot-Backup.' };
  }
  const version = 'version' in json ? json.version : undefined;
  if (version !== 1 && version !== BACKUP_VERSION) {
    return { ok: false, error: `Backup-Version ${String(version)} wird nicht unterstützt.` };
  }

  const result = backupSchema.safeParse(upgrade(json as JsonObject));
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');
    return { ok: false, error: `Ungültiger Eintrag (${path}): ${issue.message}` };
  }
  return { ok: true, backup: result.data };
}

export function serializeBackup(backup: Backup) {
  return JSON.stringify(backup, null, 2);
}
