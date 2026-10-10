import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from '@/db/schema';

/**
 * Echte SQLite-Datenbank im Arbeitsspeicher, aufgebaut mit denselben Migrationen wie die App.
 * Nur für Tests – läuft unter Node, nicht in der App.
 */
export function createTestDatabase() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, '../../../drizzle') });
  return db;
}
