import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  STATUS_LABELS,
  WORK_MODE_LABELS,
  fromLocalIsoDate,
  type JobApplication,
} from '@/domain/application';
import { formatAppointmentTime } from '@/domain/details';
import { StatusBadge } from '@/features/applications/components/status-badge';
import { AvatarColors } from '@/theme/colors';
import { useSchemeName, useTheme } from '@/theme/use-theme';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(
    fromLocalIsoDate(date),
  );
}

/** Ort und Arbeitsmodell ohne Dopplung wie „Remote · Remote“ */
export function placeLabel(application: JobApplication) {
  const mode = application.workMode ? WORK_MODE_LABELS[application.workMode] : undefined;
  if (!application.location) return mode;
  if (!mode || application.location.toLowerCase() === mode.toLowerCase())
    return application.location;
  return `${application.location} · ${mode}`;
}

export function ApplicationRow({
  application,
  nextAppointment,
  onPress,
}: {
  application: JobApplication;
  /** ISO-Zeitpunkt des nächsten Termins, falls vorhanden */
  nextAppointment?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const avatar = AvatarColors[useSchemeName()];
  const avatarBackground =
    avatar.backgrounds[application.company.charCodeAt(0) % avatar.backgrounds.length];

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[
        application.company,
        application.role,
        `Status ${STATUS_LABELS[application.status]}`,
        application.priority === 'high' ? 'hohe Priorität' : undefined,
        nextAppointment ? `Termin ${formatAppointmentTime(nextAppointment)}` : undefined,
      ]
        .filter(Boolean)
        .join(', ')}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.avatar, { backgroundColor: avatarBackground }]}>
        <Text style={[styles.avatarText, { color: avatar.text }]}>
          {application.company.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.details}>
        <View style={styles.titleLine}>
          <Text numberOfLines={1} style={[styles.company, { color: theme.text }]}>
            {application.priority === 'high' ? (
              <Text style={{ color: theme.accentText }}>● </Text>
            ) : null}
            {application.company}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(application.appliedAt)}
          </Text>
        </View>
        <Text numberOfLines={1} style={[styles.role, { color: theme.textSecondary }]}>
          {[application.role, placeLabel(application)].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.badges}>
          <StatusBadge status={application.status} />
          {nextAppointment ? (
            <Text numberOfLines={1} style={[styles.appointment, { color: theme.accentText }]}>
              {formatAppointmentTime(nextAppointment)}
            </Text>
          ) : null}
        </View>
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
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appointment: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '600',
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
