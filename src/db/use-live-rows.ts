import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

/** Wartezeit nach der letzten Änderung, bevor neu gelesen wird */
const SETTLE_MS = 16;

/**
 * Liest Zeilen und liest sie neu, sobald sich eine der Tabellen ändert.
 *
 * Statt Drizzles useLiveQuery: Dort löst jede geänderte Zeile eine eigene Abfrage aus –
 * ein Import mit 50 Bewerbungen also über 100 Abfragen und Re-Renders. Dieser Hook bündelt
 * die Meldungen und liest einmal neu, wenn die Änderungen abgeschlossen sind.
 */
export function useLiveRows<T>(read: () => T[], tables: readonly string[]): T[] {
  const [rows, setRows] = useState(read);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });

  const tableKey = tables.join(',');
  useEffect(() => {
    const watched = tableKey.split(',');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (!watched.includes(tableName)) return;
      clearTimeout(timer);
      timer = setTimeout(() => setRows(readRef.current()), SETTLE_MS);
    });
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [tableKey]);

  return rows;
}
