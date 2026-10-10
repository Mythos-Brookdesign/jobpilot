import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import type { Repositories } from '@/db/repositories';
import type { TableName } from '@/db/use-live-data';
import { permissionState, syncScheduled } from '@/features/reminders/notifications';

const WATCHED: TableName[] = [
  'applications',
  'status_events',
  'appointments',
  'reminders',
  'settings',
];
const SETTLE_MS = 300;

/** Sind Benachrichtigungen in der App eingeschaltet und vom System erlaubt? */
export async function notificationsEnabled(repositories: Repositories) {
  return (
    repositories.settings.get('reminders.notifications') === 'on' &&
    (await permissionState()) === 'granted'
  );
}

/**
 * Hält Erinnerungen aktuell: Regeln neu anwenden, dann Systembenachrichtigungen abgleichen.
 * Läuft beim Start, nach Datenänderungen (gebündelt) und wenn die App wieder in den
 * Vordergrund kommt – dann können inzwischen Fristen abgelaufen sein.
 */
export function useReminderSync(repositories: Repositories) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let pending = false;

    async function run() {
      // Nie zwei Läufe gleichzeitig; Änderungen währenddessen lösen genau einen weiteren aus
      if (running) {
        pending = true;
        return;
      }
      running = true;
      try {
        do {
          pending = false;
          const now = new Date();
          repositories.reminders.reconcile(now);
          const enabled = await notificationsEnabled(repositories);
          await syncScheduled(enabled ? repositories.reminders.open() : [], now);
        } while (pending);
      } catch (error) {
        console.warn('Erinnerungen konnten nicht geplant werden', error);
      } finally {
        running = false;
      }
    }

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, SETTLE_MS);
    };

    run();
    const changes = addDatabaseChangeListener(({ tableName }) => {
      if ((WATCHED as string[]).includes(tableName)) schedule();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule();
    });
    return () => {
      clearTimeout(timer);
      changes.remove();
      appState.remove();
    };
  }, [repositories]);
}
