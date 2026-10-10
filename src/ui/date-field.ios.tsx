import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet, Text, View } from 'react-native';

import { useSchemeName, useTheme } from '@/theme/use-theme';
import type { DateFieldProps } from '@/ui/date-field';

// iOS: kompakter System-Picker direkt im Formular
export function DateField({ label, value, mode, onChange }: DateFieldProps) {
  const theme = useTheme();
  const scheme = useSchemeName();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <DateTimePicker
        accessibilityLabel={label}
        value={value}
        mode={mode}
        display="compact"
        locale="de-DE"
        minuteInterval={5}
        themeVariant={scheme}
        accentColor={theme.accentText}
        onValueChange={(_event, picked) => onChange(picked)}
        style={styles.picker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  picker: {
    marginLeft: -8,
  },
});
