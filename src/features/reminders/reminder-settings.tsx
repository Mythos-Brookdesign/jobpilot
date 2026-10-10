import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Switch, Text, View } from 'react-native';

import { useLive, useRepositories } from '@/db/hooks';
import { FOLLOW_UP_OPTIONS, type ReminderSettings as Settings } from '@/domain/reminders';
import {
  disableNotifications,
  enableNotifications,
} from '@/features/reminders/enable-notifications';
import {
  notificationsSupported,
  permissionState,
  type PermissionState,
} from '@/features/reminders/notifications';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { SegmentedControl } from '@/ui/segmented-control';

/** Systemerlaubnis – neu prüfen, wenn man aus den Systemeinstellungen zurückkommt */
function usePermissionState() {
  const [state, setState] = useState<PermissionState>();
  useEffect(() => {
    const refresh = () => {
      permissionState().then(setState);
    };
    refresh();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);
  return state;
}

export function ReminderSettings() {
  const theme = useTheme();
  const repositories = useRepositories();
  const permission = usePermissionState();
  const { settings, optedIn } = useLive(
    ({ reminders, settings: store }) => ({
      settings: reminders.settings(),
      optedIn: store.get('reminders.notifications') === 'on',
    }),
    ['settings'],
  );
  const save = (change: Partial<Settings>) =>
    repositories.reminders.saveSettings({ ...settings, ...change });

  const active = optedIn && permission === 'granted';
  const status = !notificationsSupported
    ? 'Im Browser nicht verfügbar – fällige Erinnerungen erscheinen in der Übersicht.'
    : active
      ? 'Eingeschaltet. Erinnerungen kommen als Benachrichtigung.'
      : optedIn && permission === 'denied'
        ? 'In den Systemeinstellungen blockiert.'
        : 'Ausgeschaltet. Fällige Erinnerungen siehst du in der Übersicht.';

  return (
    <View style={styles.body}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.label, { color: theme.text }]}>Benachrichtigungen</Text>
          <Text style={[styles.caption, { color: theme.textSecondary }]}>{status}</Text>
        </View>
        {notificationsSupported ? (
          <Button
            label={active ? 'Ausschalten' : 'Einschalten'}
            variant={active ? 'secondary' : 'primary'}
            compact
            onPress={() =>
              active ? disableNotifications(repositories) : enableNotifications(repositories)
            }
          />
        ) : null}
      </View>

      <View style={[styles.block, { borderTopColor: theme.border }]}>
        <SegmentedControl
          label="Nachhaken, wenn sich so lange nichts tut"
          options={FOLLOW_UP_OPTIONS.map((days) => ({
            value: String(days),
            label: days === 0 ? 'Aus' : `${days} Tage`,
          }))}
          value={String(settings.followUpDays)}
          onChange={(value) => save({ followUpDays: Number(value) })}
        />
      </View>

      <ToggleRow
        label="Termine"
        caption="Am Vortag um 18 Uhr und eine Stunde vorher"
        value={settings.appointments}
        onChange={(appointments) => save({ appointments })}
      />
      <ToggleRow
        label="Dankeschön"
        caption="Am Morgen nach einem Termin"
        value={settings.thankYou}
        onChange={(thankYou) => save({ thankYou })}
      />
    </View>
  );
}

function ToggleRow({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;
  caption: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, styles.block, { borderTopColor: theme.border }]}>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>{caption}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accent, false: theme.backgroundSelected }}
        thumbColor="#FFFFFF"
        // react-native-web nutzt für den eingeschalteten Zustand eine eigene Eigenschaft
        {...({ activeThumbColor: '#FFFFFF' } as object)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 15,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  block: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
  },
});
