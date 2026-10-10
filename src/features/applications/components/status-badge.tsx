import { StyleSheet, Text, View } from 'react-native';

import { STATUS_LABELS, type ApplicationStatus } from '@/domain/application';
import { StatusColors } from '@/theme/colors';
import { useSchemeName } from '@/theme/use-theme';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const colors = StatusColors[useSchemeName()][status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
});
