import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CLOSED_STATUSES,
  PIPELINE_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from '@/domain/application';
import { StatusColors } from '@/theme/colors';
import { useSchemeName, useTheme } from '@/theme/use-theme';

/**
 * Pipeline als Schrittfolge: erledigte Schritte gefüllt, der aktuelle hervorgehoben.
 * Endzustände (Absage, Zurückgezogen) stehen getrennt dahinter.
 */
export function StatusPicker({
  value,
  onChange,
}: {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
}) {
  const theme = useTheme();
  const currentIndex = (PIPELINE_STATUSES as readonly string[]).indexOf(value);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel="Status"
      contentContainerStyle={styles.row}>
      {PIPELINE_STATUSES.map((status, index) => (
        <Step
          key={status}
          status={status}
          done={currentIndex > index}
          selected={status === value}
          onPress={() => onChange(status)}
        />
      ))}
      <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
      {CLOSED_STATUSES.map((status) => (
        <Step
          key={status}
          status={status}
          done={false}
          selected={status === value}
          onPress={() => onChange(status)}
        />
      ))}
    </ScrollView>
  );
}

function Step({
  status,
  done,
  selected,
  onPress,
}: {
  status: ApplicationStatus;
  done: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const colors = StatusColors[useSchemeName()][status];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Status ${STATUS_LABELS[status]}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        {
          backgroundColor: selected ? colors.background : theme.backgroundElement,
          borderColor: selected ? colors.dot : theme.backgroundSelected,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: done || selected ? colors.dot : theme.backgroundSelected },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: selected ? colors.text : done ? theme.text : theme.textSecondary },
        ]}>
        {STATUS_LABELS[status]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingRight: 24,
  },
  step: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 22,
    marginHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
