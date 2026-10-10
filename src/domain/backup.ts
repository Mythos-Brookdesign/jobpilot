import { z } from 'zod';

import { APPLICATION_STATUSES } from '@/domain/application';

// Austauschformat für Export und Import. Bei inkompatiblen Änderungen `version` erhöhen
// und in parseBackup eine Umwandlung für alte Versionen ergänzen.

export const BACKUP_FORMAT = 'jobpilot-backup';
export const BACKUP_VERSION = 1;

const status = z.enum(APPLICATION_STATUSES);
const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT erwartet');
const timestamp = z.iso.datetime({ offset: true });

const backupApplication = z.object({
  id: z.string().min(1),
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  location: z.string(),
  appliedAt: calendarDay,
  status,
  nextStep: z.string().optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
  statusEvents: z.array(z.object({ from: status.nullable(), to: status, at: timestamp })),
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
  if ('version' in json && json.version !== BACKUP_VERSION) {
    return { ok: false, error: `Backup-Version ${String(json.version)} wird nicht unterstützt.` };
  }

  const result = backupSchema.safeParse(json);
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
