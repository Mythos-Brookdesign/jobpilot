import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { APPLICATION_STATUSES, STATUS_LABELS, type StatusFilter } from '@/domain/application';
import { useTheme } from '@/theme/use-theme';

const FILTERS: StatusFilter[] = ['all', ...APPLICATION_STATUSES];

export function filterLabel(filter: StatusFilter) {
  return filter === 'all' ? 'Alle' : STATUS_LABELS[filter];
}

export function StatusFilterBar({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (filter: StatusFilter) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}>
      {FILTERS.map((filter) => {
        const selected = value === filter;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={filter}
            onPress={() => onChange(filter)}
            style={[
              styles.filter,
              {
                backgroundColor: selected ? theme.accent : theme.backgroundElement,
                borderColor: selected ? theme.accent : theme.backgroundSelected,
              },
            ]}>
            <Text
              style={[
                styles.filterText,
                { color: selected ? theme.onAccent : theme.textSecondary },
              ]}>
              {filterLabel(filter)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: 8,
    paddingVertical: 16,
    paddingRight: 24,
  },
  filter: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
  },
  filterText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
