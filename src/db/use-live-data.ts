import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

/** Wartezeit nach der letzten Änderung, bevor neu gelesen wird */
const SETTLE_MS = 16;

export type TableName =
  | 'applications'
  | 'status_events'
  | 'contacts'
  | 'notes'
  | 'appointments'
  | 'reminders'
  | 'settings';

/**
 * Liest Daten und liest sie neu, sobald sich eine der Tabellen ändert.
 *
 * Statt Drizzles useLiveQuery: Dort löst jede geänderte Zeile eine eigene Abfrage aus –
 * ein Import mit 50 Bewerbungen also über 100 Abfragen und Re-Renders. Dieser Hook bündelt
 * die Meldungen und liest einmal neu, wenn die Änderungen abgeschlossen sind.
 * `deps` wie bei useEffect: Ändern sie sich (z. B. eine ID), wird sofort neu gelesen.
 */
export function useLiveData<T>(
  read: () => T,
  tables: readonly TableName[],
  deps: readonly unknown[] = [],
): T {
  const [data, setData] = useState(read);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });

  const depsKey = JSON.stringify(deps);
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setData(readRef.current());
  }, [depsKey]);

  const tableKey = tables.join(',');
  useEffect(() => {
    const watched = tableKey.split(',');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (!watched.includes(tableName)) return;
      clearTimeout(timer);
      timer = setTimeout(() => setData(readRef.current()), SETTLE_MS);
    });
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [tableKey]);

  return data;
}
