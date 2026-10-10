import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SymbolViewProps } from 'expo-symbols';

import { useRepositories } from '@/db/hooks';
import type { ReminderWithCompany } from '@/db/repositories/reminders';
import {
  SNOOZE_DAYS,
  effectiveDueAt,
  formatDue,
  snoozeUntil,
  type ReminderKind,
} from '@/domain/reminders';
import { useTheme } from '@/theme/use-theme';
import { ListRow } from '@/ui/list-row';

const ICONS: Record<ReminderKind, SymbolViewProps['name']> = {
  'follow-up': { ios: 'arrow.uturn.forward', android: 'reply', web: 'reply' },
  'appointment-day-before': { ios: 'calendar', android: 'event', web: 'event' },
  'appointment-soon': { ios: 'clock', android: 'schedule', web: 'schedule' },
  'thank-you': { ios: 'hand.thumbsup', android: 'thumb_up', web: 'thumb_up' },
  custom: { ios: 'bell', android: 'notifications', web: 'notifications' },
};

type ReminderListProps = {
  reminders: ReminderWithCompany[];
  /** Firmenname zeigen – auf der Übersicht ja, auf der Detailseite nicht nötig */
  showCompany?: boolean;
  onOpen?: (reminder: ReminderWithCompany) => void;
};

export function ReminderList({ reminders, showCompany = false, onOpen }: ReminderListProps) {
  const theme = useTheme();
  const { reminders: repository } = useRepositories();
  const now = new Date();

  return (
    <View>
      {reminders.map((reminder, index) => {
        const overdue = new Date(effectiveDueAt(reminder)) <= now;
        const due = formatDue(reminder, now);
        return (
          <ListRow
            key={reminder.key}
            first={index === 0}
            icon={ICONS[reminder.kind]}
            highlight={overdue}
            title={reminder.title}
            // Erste Zeile: wann fällig; zweite Zeile: worum es geht
            subtitle={[
              due,
              [
                reminder.body,
                showCompany && reminder.kind === 'custom' ? reminder.company : undefined,
              ]
                .filter(Boolean)
                .join(' · '),
            ]
              .filter(Boolean)
              .join('\n')}
            onPress={onOpen ? () => onOpen(reminder) : undefined}
            trailing={
              <View style={styles.actions}>
                <Action
                  label="Erledigt"
                  accessibilityLabel={`${reminder.title}: erledigt`}
                  onPress={() => repository.markDone(reminder.key)}
                  color={theme.accentText}
                  border={theme.backgroundSelected}
                />
                <Action
                  label="Später"
                  accessibilityLabel={`${reminder.title}: in ${SNOOZE_DAYS} Tagen erneut erinnern`}
                  onPress={() => repository.snooze(reminder.key, snoozeUntil())}
                  color={theme.textSecondary}
                  border={theme.backgroundSelected}
                />
              </View>
            }
          />
        );
      })}
    </View>
  );
}

function Action({
  label,
  accessibilityLabel,
  onPress,
  color,
  border,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  color: string;
  border: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { borderColor: border }, pressed && styles.pressed]}>
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 6,
  },
  action: {
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});
