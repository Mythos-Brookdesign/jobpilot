import { Platform } from 'react-native';

import { SNOOZE_DAYS, effectiveDueAt, type Reminder } from '@/domain/reminders';
import { Notifications } from '@/features/reminders/notifications-module';
import { notificationId, planSchedule } from '@/features/reminders/schedule-plan';

// Lokale, zeitgesteuerte Benachrichtigungen. Im Browser gibt es eine eigene Datei ohne
// Systembenachrichtigungen; in Expo Go auf Android fehlt das Modul (siehe notifications-module).

export const notificationsSupported = Notifications !== null;

export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';
const CATEGORY = 'reminder';
const CHANNEL = 'reminders';

export type NotificationData = { reminderKey: string; applicationId: string; dueAt: string };

let configured: Promise<void> | null = null;

/** Einmalig: Anzeige im Vordergrund, Android-Kanal und Aktions-Buttons */
export function configureNotifications() {
  configured ??= (async () => {
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Erinnerungen',
        description: 'Nachhaken, Termine und eigene Erinnerungen zu Bewerbungen',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    // Die Buttons öffnen die App kurz, damit die Aktion sicher gespeichert wird
    await Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: ACTION_DONE, buttonTitle: 'Erledigt', options: { opensAppToForeground: true } },
      {
        identifier: ACTION_SNOOZE,
        buttonTitle: `In ${SNOOZE_DAYS} Tagen erneut`,
        options: { opensAppToForeground: true },
      },
    ]);
  })();
  return configured;
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function permissionState(): Promise<PermissionState> {
  if (!Notifications) return 'denied';
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  return settings.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return result.granted;
}

/** Gleicht die geplanten Benachrichtigungen mit den offenen Erinnerungen ab */
export async function syncScheduled(reminders: Reminder[], now = new Date()) {
  if (!Notifications) return;
  await configureNotifications();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const { cancel, schedule } = planSchedule(
    scheduled.map((request) => ({
      identifier: request.identifier,
      dueAt: (request.content.data as Partial<NotificationData> | undefined)?.dueAt,
    })),
    reminders,
    now,
  );

  await Promise.all(cancel.map((id) => Notifications!.cancelScheduledNotificationAsync(id)));
  for (const reminder of schedule) {
    const dueAt = effectiveDueAt(reminder);
    const data: NotificationData = {
      reminderKey: reminder.key,
      applicationId: reminder.applicationId,
      dueAt,
    };
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId(reminder),
      content: {
        title: reminder.title,
        ...(reminder.body ? { body: reminder.body } : {}),
        data,
        categoryIdentifier: CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(dueAt),
        channelId: CHANNEL,
      },
    });
  }
}
