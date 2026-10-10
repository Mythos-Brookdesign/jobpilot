import type { Repositories } from '@/db/repositories';
import { toLocalIsoDate } from '@/domain/application';
import { parseBackup, serializeBackup } from '@/domain/backup';
import { toCsv } from '@/domain/csv';
import { pickTextFile, shareFile } from '@/features/data-transfer/files';
import { confirm, notify } from '@/ui/dialogs';

const today = () => toLocalIsoDate(new Date());

export async function exportBackupFile({ backup }: Repositories) {
  await shareFile({
    name: `jobpilot-backup-${today()}.json`,
    content: serializeBackup(backup.export()),
    mimeType: 'application/json',
  });
}

export async function exportCsvFile({ applications }: Repositories) {
  await shareFile({
    name: `jobpilot-bewerbungen-${today()}.csv`,
    content: toCsv(applications.listActive()),
    mimeType: 'text/csv',
  });
}

/** Datei wählen, prüfen, bestätigen lassen und übernehmen */
export async function importBackupFile({ backup }: Repositories) {
  const text = await pickTextFile(['application/json', 'text/plain']);
  if (text === null) return;

  const result = parseBackup(text);
  if (!result.ok) {
    notify('Import nicht möglich', result.error);
    return;
  }

  const count = result.backup.applications.length;
  const confirmed = await confirm({
    title: `${count} ${count === 1 ? 'Bewerbung' : 'Bewerbungen'} importieren?`,
    message:
      'Einträge, die es schon gibt, werden durch den Stand aus dem Backup ersetzt. Alle anderen bleiben erhalten.',
    confirmLabel: 'Importieren',
  });
  if (!confirmed) return;

  backup.import(result.backup);
  notify(
    'Import abgeschlossen',
    `${count} ${count === 1 ? 'Bewerbung' : 'Bewerbungen'} übernommen.`,
  );
}
