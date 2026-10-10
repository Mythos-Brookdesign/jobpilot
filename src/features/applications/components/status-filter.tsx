import { ScrollView, StyleSheet } from 'react-native';

import { FILTER_LABELS, STATUS_FILTERS, type StatusFilter } from '@/domain/application';
import { Chip } from '@/ui/chip';

export function StatusFilterBar({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (filter: StatusFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}>
      {STATUS_FILTERS.map((filter) => (
        <Chip
          key={filter}
          label={FILTER_LABELS[filter]}
          count={counts[filter]}
          selected={value === filter}
          onPress={() => onChange(filter)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: 8,
    paddingVertical: 14,
    paddingRight: 24,
  },
});
