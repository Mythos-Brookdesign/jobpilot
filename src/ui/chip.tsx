import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  /** Zusatz hinter dem Text, z. B. eine Anzahl */
  count?: number;
  onPress: () => void;
};

export function Chip({ label, selected = false, count, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.backgroundSelected,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, { color: selected ? theme.onAccent : theme.textSecondary }]}>
        {label}
        {count === undefined ? null : <Text style={styles.count}> {count}</Text>}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  count: {
    fontWeight: '400',
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.7,
  },
});
