import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from '@/db/schema';

/**
 * Gemeinsamer Typ für alle synchronen SQLite-Treiber von Drizzle:
 * expo-sqlite in der App, better-sqlite3 in den Tests. `any`, weil sich der Rückgabetyp
 * von run() je Treiber unterscheidet.
 */
export type Database = BaseSQLiteDatabase<'sync', any, typeof schema>;

/** Macht aus NULL-Spalten fehlende Felder, passend zu den optionalen Domain-Feldern */
export function withoutNulls<T extends object>(row: T) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)) as {
    [K in keyof T]: Exclude<T[K], null> | (null extends T[K] ? undefined : never);
  };
}

/** Optionale Domain-Felder als NULL speichern, damit Updates sie auch leeren */
export function nullable<T>(value: T | undefined) {
  return value ?? null;
}
