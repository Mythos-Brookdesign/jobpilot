import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  PIPELINE_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
  type JobApplication,
} from '@/domain/application';
import { formatAppointmentTime } from '@/domain/details';
import { StatusColors } from '@/theme/colors';
import { useSchemeName, useTheme } from '@/theme/use-theme';

const COLUMNS: { key: string; title: string; statuses: ApplicationStatus[] }[] = [
  ...PIPELINE_STATUSES.map((status) => ({
    key: status,
    title: STATUS_LABELS[status],
    statuses: [status],
  })),
  { key: 'closed', title: 'Abgeschlossen', statuses: ['rejected', 'withdrawn'] },
];

/** Board-Ansicht für breite Bildschirme: eine Spalte je Status */
export function KanbanBoard({
  applications,
  nextAppointments,
  onOpen,
}: {
  applications: JobApplication[];
  nextAppointments: ReadonlyMap<string, string>;
  onOpen: (id: string) => void;
}) {
  const theme = useTheme();
  const scheme = useSchemeName();

  return (
    <ScrollView horizontal contentContainerStyle={styles.board} showsHorizontalScrollIndicator>
      {COLUMNS.map((column) => {
        const cards = applications.filter((a) => column.statuses.includes(a.status));
        const colors = StatusColors[scheme][column.statuses[0]];
        return (
          <View
            key={column.key}
            accessibilityRole="list"
            accessibilityLabel={`${column.title}, ${cards.length}`}
            style={[styles.column, { backgroundColor: theme.backgroundSelected }]}>
            <View style={styles.columnHeader}>
              <View style={[styles.dot, { backgroundColor: colors.dot }]} />
              <Text style={[styles.columnTitle, { color: theme.text }]}>{column.title}</Text>
              <Text style={[styles.count, { color: theme.textSecondary }]}>{cards.length}</Text>
            </View>
            {cards.map((application) => {
              const next = nextAppointments.get(application.id);
              return (
                <Pressable
                  key={application.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${application.company}, ${application.role}`}
                  onPress={() => onOpen(application.id)}
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <Text numberOfLines={1} style={[styles.company, { color: theme.text }]}>
                    {application.priority === 'high' ? (
                      <Text style={{ color: theme.accentText }}>● </Text>
                    ) : null}
                    {application.company}
                  </Text>
                  <Text numberOfLines={2} style={[styles.role, { color: theme.textSecondary }]}>
                    {application.role}
                  </Text>
                  {column.key === 'closed' ? (
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {STATUS_LABELS[application.status]}
                    </Text>
                  ) : null}
                  {next ? (
                    <Text style={[styles.meta, { color: theme.accentText }]}>
                      {formatAppointmentTime(next)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 12,
    paddingBottom: 16,
  },
  column: {
    width: 232,
    borderRadius: 14,
    padding: 10,
    gap: 8,
    alignSelf: 'flex-start',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  count: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 11,
    gap: 3,
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
    lineHeight: 17,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  pressed: {
    opacity: 0.7,
  },
});
