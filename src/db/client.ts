import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { createRepositories, type Repositories } from '@/db/repositories';
import * as schema from '@/db/schema';

export type AppDatabase = {
  db: ExpoSQLiteDatabase<typeof schema>;
  repositories: Repositories;
};

/** Im Browser darf nur eine Verbindung die Datenbankdatei (OPFS) halten */
export const DATABASE_LOCKED_MESSAGE =
  'jobpilot ist bereits in einem anderen Tab geöffnet. Schließe den anderen Tab und lade diese Seite neu.';

const LOCK_RETRIES = 12;
const LOCK_RETRY_MS = 250;

const isLockError = (error: unknown) =>
  error instanceof Error &&
  (error.name === 'NoModificationAllowedError' ||
    error.message.includes('NoModificationAllowedError') ||
    error.message.includes('Access Handles cannot be created'));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function openWithRetry(): Promise<SQLiteDatabase> {
  for (let attempt = 0; ; attempt++) {
    let sqlite: SQLiteDatabase | undefined;
    try {
      // enableChangeListener: Voraussetzung für die Live-Aktualisierung der Oberfläche
      sqlite = await openDatabaseAsync('jobpilot.db', { enableChangeListener: true });
      // Erste Abfragen hier, damit eine belegte Datei sofort auffällt und nicht erst später
      await sqlite.execAsync('PRAGMA foreign_keys = ON;');
      await sqlite.getFirstAsync('SELECT 1');
      return sqlite;
    } catch (error) {
      await sqlite?.closeAsync().catch(() => {});
      // Beim Neuladen hält die alte Seite die Datei noch kurz fest – kurz warten und erneut
      if (!isLockError(error)) throw error;
      if (attempt >= LOCK_RETRIES) throw new Error(DATABASE_LOCKED_MESSAGE);
      await wait(LOCK_RETRY_MS);
    }
  }
}

let opening: Promise<AppDatabase> | null = null;

/**
 * Öffnet die Datenbank einmalig. Bewusst asynchron: Im Browser läuft SQLite in einem Worker,
 * der erst starten kann, wenn der Haupt-Thread frei ist – ein synchrones Öffnen beim
 * Laden des Moduls würde sich selbst blockieren. Danach sind synchrone Abfragen möglich.
 */
export function openAppDatabase() {
  opening ??= openWithRetry().then((sqlite) => {
    const db = drizzle(sqlite, { schema });
    return { db, repositories: createRepositories(db) };
  });
  // Fehlgeschlagenes Öffnen nicht zwischenspeichern, damit ein erneuter Versuch möglich ist
  opening.catch(() => {
    opening = null;
  });
  return opening;
}
