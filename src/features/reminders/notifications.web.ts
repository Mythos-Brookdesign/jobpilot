import type { Reminder } from '@/domain/reminders';

// Im Browser keine Systembenachrichtigungen: Fällige Erinnerungen erscheinen in der Übersicht.

export const notificationsSupported = false;

export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';

export type NotificationData = { reminderKey: string; applicationId: string; dueAt: string };
export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function configureNotifications() {}

export async function permissionState(): Promise<PermissionState> {
  return 'denied';
}

export async function requestPermission() {
  return false;
}

export async function syncScheduled(_reminders: Reminder[], _now?: Date) {}
