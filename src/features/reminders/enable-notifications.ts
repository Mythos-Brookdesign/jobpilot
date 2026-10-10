import { Linking } from 'react-native';

import type { Repositories } from '@/db/repositories';
import { permissionState, requestPermission } from '@/features/reminders/notifications';
import { confirm } from '@/ui/dialogs';

/**
 * Schaltet Benachrichtigungen ein. Die Erklärung steht vorher in der App (Hinweiskarte bzw.
 * Einstellungen), erst dann fragt das System. Wurde früher abgelehnt, geht es nur noch über
 * die Systemeinstellungen.
 */
export async function enableNotifications(repositories: Repositories): Promise<boolean> {
  const state = await permissionState();
  if (state === 'denied') {
    const openSettings = await confirm({
      title: 'Benachrichtigungen sind blockiert',
      message: 'Du kannst sie in den Systemeinstellungen für jobpilot erlauben.',
      confirmLabel: 'Einstellungen öffnen',
    });
    if (openSettings) await Linking.openSettings();
    return false;
  }
  const granted = state === 'granted' || (await requestPermission());
  if (granted) repositories.settings.set('reminders.notifications', 'on');
  return granted;
}

export function disableNotifications(repositories: Repositories) {
  repositories.settings.set('reminders.notifications', 'off');
}

/** Hinweiskarte in der Übersicht nicht mehr zeigen */
export function dismissNotificationPrompt(repositories: Repositories) {
  repositories.settings.set('reminders.notifications', 'dismissed');
}
