import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import type { Repositories } from '@/db/repositories';
import { snoozeUntil } from '@/domain/reminders';
import {
  ACTION_DONE,
  ACTION_SNOOZE,
  type NotificationData,
} from '@/features/reminders/notifications';
import { Notifications } from '@/features/reminders/notifications-module';
import { NOTIFICATION_PREFIX } from '@/features/reminders/schedule-plan';

/**
 * Reagiert auf Benachrichtigungen – auch wenn die App erst durch das Antippen gestartet wurde:
 * „Erledigt“ und „Später“ speichern direkt, ein Tippen öffnet die Bewerbung.
 */
function useResponses(repositories: Repositories) {
  const router = useRouter();
  const response = Notifications!.useLastNotificationResponse();

  useEffect(() => {
    if (!response) return;
    const { identifier, content } = response.notification.request;
    if (!identifier.startsWith(NOTIFICATION_PREFIX)) return;
    const data = content.data as Partial<NotificationData>;
    if (!data.reminderKey || !data.applicationId) return;

    if (response.actionIdentifier === ACTION_DONE) {
      repositories.reminders.markDone(data.reminderKey);
    } else if (response.actionIdentifier === ACTION_SNOOZE) {
      repositories.reminders.snooze(data.reminderKey, snoozeUntil());
    } else {
      router.push({ pathname: '/bewerbung/[id]', params: { id: data.applicationId } });
    }
    // Nicht beim nächsten Rendern erneut verarbeiten
    Notifications!.clearLastNotificationResponse();
  }, [response, repositories, router]);
}

/** Ohne Benachrichtigungsmodul (Expo Go auf Android) gibt es nichts zu verarbeiten */
function useNothing(_repositories: Repositories) {}

// Die Auswahl steht beim Laden fest, die Hook-Reihenfolge bleibt also stabil
export const useNotificationResponses = Notifications ? useResponses : useNothing;
