import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  APPLICATION_STATUSES,
  PRIORITIES,
  PRIORITY_LABELS,
  SOURCE_SUGGESTIONS,
  STATUS_LABELS,
  WORK_MODES,
  WORK_MODE_LABELS,
  fromLocalIsoDate,
  toLocalIsoDate,
  type ApplicationInput,
} from '@/domain/application';
import {
  parseApplicationForm,
  type ApplicationFormField,
  type ApplicationFormValues,
} from '@/domain/forms';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { DateField } from '@/ui/date-field';
import { FormField } from '@/ui/form-field';
import { SegmentedControl } from '@/ui/segmented-control';

type ApplicationFormProps = {
  initialValues: ApplicationFormValues;
  submitLabel: string;
  onSubmit: (input: ApplicationInput) => void;
  onCancel: () => void;
};

/** Gemeinsames Formular für „Neue Bewerbung“ und „Bearbeiten“ */
export function ApplicationForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ApplicationFormProps) {
  const theme = useTheme();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<ApplicationFormField, string>>>({});

  function set<K extends ApplicationFormField>(field: K, value: ApplicationFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    // Fehler des Feldes verschwindet, sobald es geändert wird
    if (errors[field]) setErrors(({ [field]: _, ...rest }) => rest);
  }

  function submit() {
    const result = parseApplicationForm(values);
    if (result.ok) onSubmit(result.value);
    else setErrors(result.errors);
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      <FormField
        label="Unternehmen"
        value={values.company}
        onChangeText={(text) => set('company', text)}
        placeholder="z. B. Nordlicht Software"
        autoCapitalize="words"
        error={errors.company}
      />
      <FormField
        label="Position"
        value={values.role}
        onChangeText={(text) => set('role', text)}
        placeholder="z. B. Senior Fullstack Developer"
        autoCapitalize="words"
        error={errors.role}
      />

      <Text style={[styles.group, { color: theme.textSecondary }]}>Status</Text>
      <View style={styles.chips}>
        {APPLICATION_STATUSES.map((status) => (
          <Chip
            key={status}
            label={STATUS_LABELS[status]}
            selected={values.status === status}
            onPress={() => set('status', status)}
          />
        ))}
      </View>
      <DateField
        label={values.status === 'saved' ? 'Gemerkt am' : 'Beworben am'}
        mode="date"
        value={fromLocalIsoDate(values.appliedAt)}
        onChange={(date) => set('appliedAt', toLocalIsoDate(date))}
      />
      <SegmentedControl
        label="Priorität"
        options={PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] }))}
        value={values.priority}
        onChange={(priority) => set('priority', priority)}
      />

      <Text style={[styles.group, { color: theme.textSecondary }]}>Stelle</Text>
      <FormField
        label="Ort"
        value={values.location}
        onChangeText={(text) => set('location', text)}
        placeholder="z. B. München"
        autoCapitalize="words"
      />
      <SegmentedControl
        label="Arbeitsmodell"
        options={[
          { value: '' as const, label: 'Offen' },
          ...WORK_MODES.map((value) => ({ value, label: WORK_MODE_LABELS[value] })),
        ]}
        value={values.workMode ?? ''}
        onChange={(workMode) => set('workMode', workMode)}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <FormField
            label="Gehalt von (€/Jahr)"
            value={values.salaryMin}
            onChangeText={(text) => set('salaryMin', text)}
            placeholder="70.000"
            keyboardType="number-pad"
            error={errors.salaryMin}
          />
        </View>
        <View style={styles.half}>
          <FormField
            label="bis (€/Jahr)"
            value={values.salaryMax}
            onChangeText={(text) => set('salaryMax', text)}
            placeholder="85.000"
            keyboardType="number-pad"
            error={errors.salaryMax}
          />
        </View>
      </View>
      <FormField
        label="Link zur Stellenanzeige"
        value={values.jobUrl}
        onChangeText={(text) => set('jobUrl', text)}
        placeholder="https://…"
        autoCapitalize="none"
        keyboardType="url"
        error={errors.jobUrl}
      />
      <FormField
        label="Quelle"
        value={values.source}
        onChangeText={(text) => set('source', text)}
        placeholder="Wo hast du die Stelle gefunden?"
        autoCapitalize="words"
      />
      <View style={[styles.chips, styles.suggestions]}>
        {SOURCE_SUGGESTIONS.map((source) => (
          <Chip
            key={source}
            label={source}
            selected={values.source === source}
            onPress={() => set('source', source)}
          />
        ))}
      </View>

      <Text style={[styles.group, { color: theme.textSecondary }]}>Planung</Text>
      <FormField
        label="Nächster Schritt"
        value={values.nextStep}
        onChangeText={(text) => set('nextStep', text)}
        placeholder="z. B. Anschreiben bis Freitag fertigstellen"
        multiline
      />

      {hasErrors ? (
        <Text accessibilityRole="alert" style={[styles.summary, { color: theme.danger }]}>
          Bitte prüfe die markierten Felder.
        </Text>
      ) : null}
      <View style={styles.actions}>
        <View style={styles.half}>
          <Button label="Abbrechen" variant="secondary" onPress={onCancel} />
        </View>
        <View style={styles.half}>
          <Button label={submitLabel} onPress={submit} />
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
  group: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  suggestions: {
    marginTop: -6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  summary: {
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
