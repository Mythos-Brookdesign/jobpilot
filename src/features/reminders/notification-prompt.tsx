import { StyleSheet, Text, View } from 'react-native';

import { useLive, useRepositories } from '@/db/hooks';
import {
  dismissNotificationPrompt,
  enableNotifications,
} from '@/features/reminders/enable-notifications';
import { notificationsSupported } from '@/features/reminders/notifications';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';

/**
 * Erklärt vor der Systemabfrage, wofür Benachrichtigungen da sind. Erscheint erst, wenn es
 * tatsächlich Erinnerungen gibt, und verschwindet nach „Aktivieren“ oder „Nicht jetzt“.
 */
export function NotificationPrompt() {
  const theme = useTheme();
  const repositories = useRepositories();
  const visible = useLive(
    ({ settings, reminders }) =>
      notificationsSupported &&
      settings.get('reminders.notifications') === undefined &&
      reminders.open().length > 0,
    ['settings', 'reminders'],
  );

  if (!visible) return null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <Text style={[styles.title, { color: theme.text }]}>Erinnerungen aufs Handy?</Text>
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        jobpilot erinnert dich ans Nachhaken, am Vortag an Termine und ans Dankeschön danach. Alles
        bleibt auf deinem Gerät, und du kannst es jederzeit in den Einstellungen ändern.
      </Text>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Nicht jetzt"
            variant="secondary"
            compact
            onPress={() => dismissNotificationPrompt(repositories)}
          />
        </View>
        <View style={styles.action}>
          <Button label="Aktivieren" compact onPress={() => enableNotifications(repositories)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  action: {
    flex: 1,
  },
});
