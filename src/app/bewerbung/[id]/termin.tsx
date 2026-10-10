import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRepositories } from '@/db/hooks';
import { APPOINTMENT_KINDS, APPOINTMENT_KIND_LABELS } from '@/domain/details';
import {
  appointmentToForm,
  emptyAppointmentForm,
  parseAppointmentForm,
  type AppointmentFormValues,
} from '@/domain/forms';
import { Button } from '@/ui/button';
import { DateField } from '@/ui/date-field';
import { confirm } from '@/ui/dialogs';
import { FormField } from '@/ui/form-field';
import { useGoBack } from '@/ui/navigation';
import { SegmentedControl } from '@/ui/segmented-control';

export default function AppointmentScreen() {
  const { id, terminId } = useLocalSearchParams<{ id: string; terminId?: string }>();
  const { details } = useRepositories();
  const goBack = useGoBack({ pathname: '/bewerbung/[id]', params: { id } });
  const existing = terminId ? details.appointment(terminId) : undefined;
  const [values, setValues] = useState<AppointmentFormValues>(() =>
    existing ? appointmentToForm(existing) : emptyAppointmentForm(),
  );

  const set = <K extends keyof AppointmentFormValues>(field: K, value: AppointmentFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  function save() {
    const result = parseAppointmentForm(values);
    if (!result.ok) return;
    details.saveAppointment(id, result.value, existing?.id);
    goBack();
  }

  async function remove() {
    if (!existing) return;
    const confirmed = await confirm({
      title: 'Termin löschen?',
      message: 'Der Termin wird endgültig entfernt.',
      confirmLabel: 'Löschen',
    });
    if (!confirmed) return;
    details.deleteAppointment(existing.id);
    goBack();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: existing ? 'Termin bearbeiten' : 'Neuer Termin' }} />
      <SegmentedControl
        label="Art"
        options={APPOINTMENT_KINDS.map((value) => ({
          value,
          label: APPOINTMENT_KIND_LABELS[value],
        }))}
        value={values.kind}
        onChange={(kind) => set('kind', kind)}
      />
      <DateField
        label="Wann"
        mode="datetime"
        value={values.startsAt}
        onChange={(startsAt) => set('startsAt', startsAt)}
      />
      <FormField
        label={values.kind === 'onsite' ? 'Adresse' : 'Link oder Telefonnummer'}
        value={values.location}
        onChangeText={(location) => set('location', location)}
        placeholder={
          values.kind === 'onsite' ? 'z. B. Hauptstraße 1, München' : 'z. B. https://meet…'
        }
        autoCapitalize="none"
      />
      <FormField
        label="Notizen"
        value={values.notes}
        onChangeText={(notes) => set('notes', notes)}
        placeholder="Wer ist dabei? Was soll vorbereitet werden?"
        multiline
      />
      <View style={styles.actions}>
        <View style={styles.half}>
          <Button label="Abbrechen" variant="secondary" onPress={goBack} />
        </View>
        <View style={styles.half}>
          <Button label="Speichern" onPress={save} />
        </View>
      </View>
      {existing ? (
        <View style={styles.delete}>
          <Button
            label="Termin löschen"
            variant="danger"
            icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
            onPress={remove}
          />
        </View>
      ) : null}
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  half: {
    flex: 1,
  },
  delete: {
    marginTop: 24,
  },
});
