import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import {
  createApplicationsRepository,
  type ApplicationsRepository,
} from '@/db/applications-repository';
import * as schema from '@/db/schema';

export type AppDatabase = {
  db: ExpoSQLiteDatabase<typeof schema>;
  applications: ApplicationsRepository;
};

let opening: Promise<AppDatabase> | null = null;

/**
 * Öffnet die Datenbank einmalig. Bewusst asynchron: Im Browser läuft SQLite in einem Worker,
 * der erst starten kann, wenn der Haupt-Thread frei ist – ein synchrones Öffnen beim
 * Laden des Moduls würde sich selbst blockieren. Danach sind synchrone Abfragen möglich.
 */
export function openAppDatabase() {
  opening ??= (async () => {
    // enableChangeListener: Voraussetzung für useLiveQuery (Oberfläche aktualisiert sich selbst)
    const sqlite = await openDatabaseAsync('jobpilot.db', { enableChangeListener: true });
    await sqlite.execAsync('PRAGMA foreign_keys = ON;');
    const db = drizzle(sqlite, { schema });
    return { db, applications: createApplicationsRepository(db) };
  })();
  return opening;
}
