import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApplicationStatusBadge } from '@/components/application-status';
import type { JobApplication } from '@/data/applications';
import { useTheme } from '@/hooks/use-theme';

const AVATAR_COLORS = ['#E4EEE7', '#F5E9DD', '#E5EAF4', '#F2E6E8'];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );
}

export function JobApplicationRow({
  application,
  onPress,
}: {
  application: JobApplication;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const avatarColor = AVATAR_COLORS[application.company.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${application.company}, ${application.role}, Status ${application.status}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{application.company.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.details}>
        <View style={styles.titleLine}>
          <Text numberOfLines={1} style={[styles.company, { color: theme.text }]}>
            {application.company}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(application.appliedAt)}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.role, { color: theme.textSecondary }]}>
          {application.role} · {application.location}
        </Text>
        <ApplicationStatusBadge status={application.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE3DC',
  },
  pressed: {
    opacity: 0.62,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#294237',
    fontSize: 16,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  company: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    lineHeight: 16,
  },
  role: {
    fontSize: 12,
    lineHeight: 17,
  },
});