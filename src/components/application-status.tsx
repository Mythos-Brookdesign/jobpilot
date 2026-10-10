import { StyleSheet, Text, View } from 'react-native';

import type { ApplicationStatus } from '@/data/applications';

const STATUS_COLORS: Record<ApplicationStatus, { background: string; text: string; dot: string }> = {
  Gesendet: { background: '#E9EFF8', text: '#45658E', dot: '#6D8EB8' },
  Gespräch: { background: '#E2F1E9', text: '#286448', dot: '#3E8A63' },
  Angebot: { background: '#FFF0D8', text: '#8A5B18', dot: '#D19037' },
  Abgesagt: { background: '#F8E8E5', text: '#99574E', dot: '#C9786A' },
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const colors = STATUS_COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.text }]}>{status}</Text>
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