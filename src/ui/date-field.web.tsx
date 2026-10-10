import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';
import type { DateFieldProps } from '@/ui/date-field';

// Browser: natives <input type="date"> bzw. "datetime-local" mit Kalender des Browsers

const pad = (n: number) => String(n).padStart(2, '0');

function toInputValue(date: Date, mode: DateFieldProps['mode']) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === 'date' ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromInputValue(text: string, mode: DateFieldProps['mode']) {
  // Ohne Zeitzone gelesen = lokale Zeit; bei reinem Datum 12 Uhr gegen Zeitzonensprünge
  const date = new Date(mode === 'date' ? `${text}T12:00` : text);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DateField({ label, value, mode, onChange }: DateFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {createElement('input', {
        type: mode === 'date' ? 'date' : 'datetime-local',
        'aria-label': label,
        value: toInputValue(value, mode),
        onChange: (event: { target: { value: string } }) => {
          const next = fromInputValue(event.target.value, mode);
          if (next) onChange(next);
        },
        style: {
          minHeight: 48,
          boxSizing: 'border-box',
          borderRadius: 10,
          border: `1px solid ${theme.backgroundSelected}`,
          backgroundColor: theme.background,
          color: theme.text,
          colorScheme: 'light dark',
          padding: '0 13px',
          fontSize: 15,
          // gleiche Schrift wie react-native-web, sonst fällt das Feld auf Times zurück
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        },
      })}
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
});
