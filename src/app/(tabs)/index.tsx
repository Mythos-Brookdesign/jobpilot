import { Link, useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLive, useRepositories } from '@/db/hooks';
import { countByFilter, matchesFilter, type StatusFilter } from '@/domain/application';
import { APPOINTMENT_KIND_LABELS, formatAppointmentTime } from '@/domain/details';
import { dueToday } from '@/domain/reminders';
import { ApplicationRow } from '@/features/applications/components/application-row';
import { createDemoBackup } from '@/features/applications/demo-data';
import { NotificationPrompt } from '@/features/reminders/notification-prompt';
import { ReminderList } from '@/features/reminders/reminder-list';
import { SerifFont } from '@/theme/colors';
import { useTheme } from '@/theme/use-theme';
import { ListRow } from '@/ui/list-row';
import { Screen } from '@/ui/screen';
import { Section } from '@/ui/section';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const METRICS: { filter: StatusFilter; label: string }[] = [
  { filter: 'active', label: 'Laufend' },
  { filter: 'interviewing', label: 'Gespräche' },
  { filter: 'offer', label: 'Angebote' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { backup } = useRepositories();
  const { applications, upcoming, due } = useLive(
    (repositories) => {
      const now = new Date();
      return {
        applications: repositories.applications.listActive(),
        upcoming: repositories.details.upcomingAppointments(now, new Date(now.getTime() + WEEK_MS)),
        due: dueToday(repositories.reminders.open(), now),
      };
    },
    ['applications', 'appointments', 'reminders'],
  );

  const isEmpty = applications.length === 0;
  const counts = countByFilter(applications);
  const nextAppointment = upcoming[0];
  // Ohne Termin: die wichtigste laufende Bewerbung mit einem geplanten nächsten Schritt
  const focus = applications
    .filter((a) => a.nextStep && !matchesFilter(a.status, 'closed'))
    .sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high'))[0];
  const greetingDate = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const open = (id: string) => router.push({ pathname: '/bewerbung/[id]', params: { id } });

  return (
    <Screen safeTop>
      {/* Im Browser steht die Wortmarke bereits in der Navigationsleiste */}
      {Platform.OS !== 'web' && (
        <Text style={[styles.wordmark, { color: theme.text }]}>
          jobpilot<Text style={{ color: theme.accentText }}>.</Text>
        </Text>
      )}

      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
          DEIN KARRIERE-DASHBOARD · {greetingDate.toLocaleUpperCase('de-DE')}
        </Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          Deine Suche,{'\n'}mit Überblick.
        </Text>
      </View>

      <View style={[styles.metrics, { borderColor: theme.backgroundSelected }]}>
        {METRICS.map((metric, index) => (
          <Pressable
            key={metric.filter}
            accessibilityRole="link"
            accessibilityLabel={`${counts[metric.filter]} ${metric.label}, Liste öffnen`}
            onPress={() =>
              router.push({ pathname: '/bewerbungen', params: { filter: metric.filter } })
            }
            style={({ pressed }) => [
              styles.metric,
              index > 0 && {
                borderLeftWidth: StyleSheet.hairlineWidth,
                borderLeftColor: theme.backgroundSelected,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {counts[metric.filter].toString().padStart(2, '0')}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{metric.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.focusPanel, { backgroundColor: theme.accentSoft }]}>
        <View style={styles.focusTopline}>
          <View style={[styles.focusIcon, { backgroundColor: theme.background }]}>
            <SymbolView
              name={
                nextAppointment
                  ? { ios: 'calendar', android: 'event', web: 'event' }
                  : { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }
              }
              tintColor={theme.accentText}
              size={19}
            />
          </View>
          <Text style={[styles.focusEyebrow, { color: theme.accentSoftEyebrow }]}>
            {isEmpty
              ? 'LOS GEHT’S'
              : nextAppointment
                ? 'NÄCHSTER TERMIN'
                : focus
                  ? 'DEIN NÄCHSTER SCHRITT'
                  : 'GUTER MOMENT'}
          </Text>
        </View>
        <Text style={[styles.focusTitle, { color: theme.accentSoftText }]}>
          {isEmpty
            ? 'Deine Pipeline ist noch leer.'
            : nextAppointment
              ? `${nextAppointment.company}: ${APPOINTMENT_KIND_LABELS[nextAppointment.kind]}`
              : focus
                ? focus.company
                : 'Zeit für die nächste Bewerbung.'}
        </Text>
        <Text style={[styles.focusText, { color: theme.accentSoftMuted }]}>
          {isEmpty
            ? 'Leg deine erste Bewerbung an oder schau dir die App mit Beispieldaten an.'
            : nextAppointment
              ? formatAppointmentTime(nextAppointment.startsAt)
              : (focus?.nextStep ?? 'Keine offenen Termine oder Aufgaben – alles im Griff.')}
        </Text>
        <View style={styles.focusActions}>
          {isEmpty ? (
            <>
              <FocusLink href="/bewerbung/neu" label="Erste Bewerbung anlegen" />
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => backup.import(createDemoBackup())}>
                <Text style={[styles.focusLink, { color: theme.accentSoftMuted }]}>
                  Beispieldaten laden
                </Text>
              </Pressable>
            </>
          ) : nextAppointment || focus ? (
            <FocusLink
              href={{
                pathname: '/bewerbung/[id]',
                params: { id: nextAppointment?.applicationId ?? focus!.id },
              }}
              label="Bewerbung öffnen"
            />
          ) : (
            <FocusLink href="/bewerbung/neu" label="Bewerbung anlegen" />
          )}
        </View>
      </View>

      {due.length > 0 ? (
        <Section title="Heute fällig">
          <ReminderList
            reminders={due}
            showCompany
            onOpen={(reminder) => open(reminder.applicationId)}
          />
        </Section>
      ) : null}
      <NotificationPrompt />

      {upcoming.length > 1 ? (
        <Section title="Nächste 7 Tage">
          {upcoming.slice(1).map((appointment, index) => (
            <ListRow
              key={appointment.id}
              first={index === 0}
              icon={{ ios: 'calendar', android: 'event', web: 'event' }}
              highlight
              title={`${appointment.company} · ${APPOINTMENT_KIND_LABELS[appointment.kind]}`}
              subtitle={formatAppointmentTime(appointment.startsAt)}
              onPress={() => open(appointment.applicationId)}
            />
          ))}
        </Section>
      ) : null}

      {isEmpty ? null : (
        <>
          <View style={styles.recentHeading}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Zuletzt aktiv</Text>
            <Link href="/bewerbungen" style={[styles.seeAll, { color: theme.accentText }]}>
              Alle ansehen
            </Link>
          </View>
          {applications.slice(0, 3).map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              onPress={() => open(application.id)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

function FocusLink({ href, label }: { href: Href; label: string }) {
  const theme = useTheme();
  return (
    <Link href={href} style={[styles.focusLink, { color: theme.accentText }]}>
      {label} <Text style={styles.focusArrow}>↗</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: -8,
  },
  intro: {
    paddingTop: 22,
    paddingBottom: 20,
    gap: 10,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  title: {
    fontFamily: SerifFont,
    fontSize: 37,
    lineHeight: 42,
    fontWeight: '400',
  },
  metrics: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 15,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  focusPanel: {
    borderRadius: 12,
    padding: 17,
  },
  focusTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },
  focusIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusEyebrow: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    fontWeight: '700',
  },
  focusTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
  },
  focusText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  focusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 22,
    rowGap: 4,
    marginTop: 15,
  },
  focusLink: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  focusArrow: {
    fontSize: 15,
  },
  recentHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 30,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    paddingBottom: 3,
  },
});
