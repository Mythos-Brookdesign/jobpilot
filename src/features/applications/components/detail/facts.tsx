import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PRIORITY_LABELS,
  formatSalary,
  fromLocalIsoDate,
  type JobApplication,
} from '@/domain/application';
import { useTheme } from '@/theme/use-theme';

const formatDay = (day: string) =>
  new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    fromLocalIsoDate(day),
  );

/** Eckdaten der Bewerbung als Liste aus Bezeichnung und Wert; leere Angaben entfallen */
export function Facts({ application }: { application: JobApplication }) {
  const theme = useTheme();
  const rows: { label: string; value: string; url?: string }[] = [
    {
      label: application.status === 'saved' ? 'Gemerkt am' : 'Beworben am',
      value: formatDay(application.appliedAt),
    },
    { label: 'Priorität', value: PRIORITY_LABELS[application.priority] },
    ...(application.source ? [{ label: 'Quelle', value: application.source }] : []),
    ...(formatSalary(application.salaryMin, application.salaryMax)
      ? [{ label: 'Gehalt', value: formatSalary(application.salaryMin, application.salaryMax)! }]
      : []),
    ...(application.jobUrl
      ? [
          {
            label: 'Stellenanzeige',
            value: application.jobUrl.replace(/^https?:\/\/(www\.)?/, ''),
            url: application.jobUrl,
          },
        ]
      : []),
  ];

  return (
    <View>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
          ]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{row.label}</Text>
          {row.url ? (
            <Pressable
              accessibilityRole="link"
              accessibilityHint="Öffnet die Stellenanzeige im Browser"
              onPress={() => Linking.openURL(row.url!)}
              style={styles.valueBox}>
              <Text
                numberOfLines={1}
                style={[styles.value, styles.link, { color: theme.accentText }]}>
                {row.value} ↗
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.value, styles.valueBox, { color: theme.text }]}>{row.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  label: {
    width: 118,
    fontSize: 13,
  },
  valueBox: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
