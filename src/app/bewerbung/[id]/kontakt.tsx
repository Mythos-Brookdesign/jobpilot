import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useRepositories } from '@/db/hooks';
import {
  contactToForm,
  emptyContactForm,
  parseContactForm,
  type ContactFormField,
  type ContactFormValues,
} from '@/domain/forms';
import { Button } from '@/ui/button';
import { confirm } from '@/ui/dialogs';
import { FormField } from '@/ui/form-field';
import { useGoBack } from '@/ui/navigation';

export default function ContactScreen() {
  const { id, kontaktId } = useLocalSearchParams<{ id: string; kontaktId?: string }>();
  const { details } = useRepositories();
  const goBack = useGoBack({ pathname: '/bewerbung/[id]', params: { id } });
  const existing = kontaktId ? details.contact(kontaktId) : undefined;
  const [values, setValues] = useState<ContactFormValues>(() =>
    existing ? contactToForm(existing) : emptyContactForm(),
  );
  const [errors, setErrors] = useState<Partial<Record<ContactFormField, string>>>({});

  function set(field: ContactFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors(({ [field]: _, ...rest }) => rest);
  }

  function save() {
    const result = parseContactForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    details.saveContact(id, result.value, existing?.id);
    goBack();
  }

  async function remove() {
    if (!existing) return;
    const confirmed = await confirm({
      title: `${existing.name} löschen?`,
      message: 'Der Kontakt wird endgültig entfernt.',
      confirmLabel: 'Löschen',
    });
    if (!confirmed) return;
    details.deleteContact(existing.id);
    goBack();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: existing ? 'Kontakt bearbeiten' : 'Neuer Kontakt' }} />
      <FormField
        label="Name"
        value={values.name}
        onChangeText={(text) => set('name', text)}
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
      />
      <FormField
        label="Rolle"
        value={values.role}
        onChangeText={(text) => set('role', text)}
        placeholder="z. B. Recruiterin, Tech Lead"
      />
      <FormField
        label="E-Mail"
        value={values.email}
        onChangeText={(text) => set('email', text)}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={errors.email}
      />
      <FormField
        label="Telefon"
        value={values.phone}
        onChangeText={(text) => set('phone', text)}
        autoComplete="tel"
        keyboardType="phone-pad"
      />
      <FormField
        label="LinkedIn-Profil"
        value={values.linkedinUrl}
        onChangeText={(text) => set('linkedinUrl', text)}
        placeholder="linkedin.com/in/…"
        autoCapitalize="none"
        keyboardType="url"
        error={errors.linkedinUrl}
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
            label="Kontakt löschen"
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
