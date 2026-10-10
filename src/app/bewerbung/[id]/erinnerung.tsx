import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRepositories } from '@/db/hooks';
import { notificationsSupported } from '@/features/reminders/notifications';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { DateField } from '@/ui/date-field';
import { FormField } from '@/ui/form-field';
import { useGoBack } from '@/ui/navigation';

/** Vorschlag: morgen um 9 Uhr */
function tomorrowMorning() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
}

export default function CustomReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { reminders } = useRepositories();
  const goBack = useGoBack({ pathname: '/bewerbung/[id]', params: { id } });
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(tomorrowMorning);
  const [error, setError] = useState<string>();

  function save() {
    if (!title.trim()) {
      setError('Woran soll jobpilot dich erinnern?');
      return;
    }
    reminders.addCustom(id, title, dueAt.toISOString());
    goBack();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <FormField
        label="Woran erinnern?"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError(undefined);
        }}
        placeholder="z. B. Gehaltsvorstellung recherchieren"
        autoFocus
        error={error}
      />
      <DateField label="Wann" mode="datetime" value={dueAt} onChange={setDueAt} />
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        {notificationsSupported
          ? 'Sind Benachrichtigungen eingeschaltet, meldet sich jobpilot zu diesem Zeitpunkt.'
          : 'Im Browser erscheint die Erinnerung ab diesem Zeitpunkt in der Übersicht unter „Heute fällig“.'}
      </Text>
      <View style={styles.actions}>
        <View style={styles.half}>
          <Button label="Abbrechen" variant="secondary" onPress={goBack} />
        </View>
        <View style={styles.half}>
          <Button label="Speichern" onPress={save} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: 22,
    paddingBottom: 48,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
});
