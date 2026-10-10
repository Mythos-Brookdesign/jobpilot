import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

// Android: Felder zeigen den Wert, ein Tippen öffnet den System-Dialog (empfohlene API).
// iOS und Browser haben eigene Dateien.

export type DateFieldProps = {
  label: string;
  value: Date;
  mode: 'date' | 'datetime';
  onChange: (value: Date) => void;
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(date);

export function DateField({ label, value, mode, onChange }: DateFieldProps) {
  const theme = useTheme();

  function open(part: 'date' | 'time') {
    DateTimePickerAndroid.open({
      value,
      mode: part,
      is24Hour: true,
      onValueChange: (_event, picked) => {
        // Datum und Uhrzeit getrennt wählen, den jeweils anderen Teil behalten
        const next = new Date(value);
        if (part === 'date')
          next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        onChange(next);
      },
    });
  }

  const box = [
    styles.box,
    { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
  ];

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatDate(value)}, ändern`}
          onPress={() => open('date')}
          style={[box, styles.date]}>
          <Text style={[styles.value, { color: theme.text }]}>{formatDate(value)}</Text>
        </Pressable>
        {mode === 'datetime' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Uhrzeit: ${formatTime(value)}, ändern`}
            onPress={() => open('time')}
            style={box}>
            <Text style={[styles.value, { color: theme.text }]}>{formatTime(value)} Uhr</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
  },
  date: {
    flex: 1,
  },
  value: {
    fontSize: 15,
  },
});
