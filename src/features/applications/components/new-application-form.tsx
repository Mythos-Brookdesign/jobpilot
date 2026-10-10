import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { toLocalIsoDate } from '@/domain/application';
import { useApplications } from '@/features/applications/applications-context';
import { useTheme } from '@/theme/use-theme';
import { FormField } from '@/ui/form-field';

export function NewApplicationForm({ onSaved }: { onSaved: () => void }) {
  const theme = useTheme();
  const { repository } = useApplications();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  function save() {
    if (!company.trim() || !role.trim()) {
      setError('Bitte Unternehmen und Position ausfüllen.');
      return;
    }
    repository.create({
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || 'Ort nicht angegeben',
      appliedAt: toLocalIsoDate(new Date()),
      status: 'sent',
    });
    onSaved();
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <FormField
        label="Unternehmen"
        value={company}
        onChangeText={setCompany}
        placeholder="z. B. Nordlicht Software"
      />
      <FormField
        label="Position"
        value={role}
        onChangeText={setRole}
        placeholder="z. B. Senior Fullstack Developer"
      />
      <FormField
        label="Ort oder Arbeitsmodell"
        value={location}
        onChangeText={setLocation}
        placeholder="z. B. München oder Remote"
      />
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={save}
        style={({ pressed }) => [
          styles.submit,
          { backgroundColor: theme.accent },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.submitText, { color: theme.onAccent }]}>Bewerbung speichern</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  submit: {
    minHeight: 49,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  submitText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
