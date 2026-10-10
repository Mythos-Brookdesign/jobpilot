import { useRepositories } from '@/db/hooks';
import { useNotificationResponses } from '@/features/reminders/use-notification-responses';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';

/** Unsichtbarer Dienst im Root-Layout: Erinnerungen abgleichen und Benachrichtigungen beantworten */
export function ReminderService() {
  const repositories = useRepositories();
  useReminderSync(repositories);
  useNotificationResponses(repositories);
  return null;
}
