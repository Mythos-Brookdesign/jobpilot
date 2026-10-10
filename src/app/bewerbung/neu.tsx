import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useRepositories } from '@/db/hooks';
import { toLocalIsoDate } from '@/domain/application';
import { emptyApplicationForm } from '@/domain/forms';
import { ApplicationForm } from '@/features/applications/components/application-form';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { useGoBack } from '@/ui/navigation';

export default function NewApplicationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { applications } = useRepositories();
  const goBack = useGoBack('/bewerbungen');

  return (
    <ApplicationForm
      header={
        <View style={[styles.fromPosting, { borderColor: theme.backgroundSelected }]}>
          <Text style={[styles.fromPostingText, { color: theme.text }]}>
            Stellenanzeige zur Hand? Der KI-Assistent füllt die Felder für dich aus.
          </Text>
          <Button
            label="Aus Anzeige übernehmen"
            icon={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
            variant="secondary"
            compact
            onPress={() => router.replace('/bewerbung/aus-anzeige')}
          />
        </View>
      }
      initialValues={emptyApplicationForm(toLocalIsoDate(new Date()))}
      submitLabel="Speichern"
      onCancel={goBack}
      onSubmit={(input) => {
        const { id } = applications.create(input);
        // Statt zurück direkt zur neuen Bewerbung, damit man Kontakte und Termine ergänzen kann
        router.replace({ pathname: '/bewerbung/[id]', params: { id } });
      }}
    />
  );
}

const styles = StyleSheet.create({
  fromPosting: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  fromPostingText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
