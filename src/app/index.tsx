import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobApplicationRow } from '@/components/job-application-row';
import { ThemedText } from '@/components/themed-text';
import { useApplications } from '@/contexts/applications-context';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = '#176B4A';

export default function HomeScreen() {
  const theme = useTheme();
  const { applications } = useApplications();
  const activeCount = applications.filter(
    (application) => application.status === 'Gesendet' || application.status === 'Gespräch',
  ).length;
  const interviewCount = applications.filter((application) => application.status === 'Gespräch').length;
  const offerCount = applications.filter((application) => application.status === 'Angebot').length;
  const nextInterview = applications.find((application) => application.status === 'Gespräch');
  const greetingDate = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={[styles.wordmark, { color: theme.text }]}>jobpilot<Text style={{ color: ACCENT }}>.</Text></Text>
          <View style={[styles.profile, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.profileText, { color: theme.text }]}>M</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <ThemedText style={styles.eyebrow} themeColor="textSecondary">
            DEIN KARRIERE-DASHBOARD · {greetingDate.toLocaleUpperCase('de-DE')}
          </ThemedText>
          <ThemedText style={styles.title}>Deine Suche,{ '\n' }mit Überblick.</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Jeder gute nächste Schritt beginnt mit einem klaren Plan.
          </ThemedText>
        </View>

        <View style={[styles.metrics, { borderColor: theme.backgroundSelected }]}>
          <Metric value={activeCount} label="Aktiv" theme={theme} />
          <View style={[styles.metricDivider, { backgroundColor: theme.backgroundSelected }]} />
          <Metric value={interviewCount} label="Gespräche" theme={theme} />
          <View style={[styles.metricDivider, { backgroundColor: theme.backgroundSelected }]} />
          <Metric value={offerCount} label="Angebote" theme={theme} />
        </View>

        <View style={styles.sectionHeading}>
          <ThemedText style={styles.sectionTitle}>Dein nächster Schritt</ThemedText>
          <SymbolView
            name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }}
            tintColor={ACCENT}
            size={18}
          />
        </View>
        <View style={styles.focusPanel}>
          <View style={styles.focusTopline}>
            <View style={styles.focusIcon}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                tintColor={ACCENT}
                size={19}
              />
            </View>
            <Text style={styles.focusEyebrow}>{nextInterview ? 'IM PROZESS' : 'GUTER MOMENT'}</Text>
          </View>
          <Text style={styles.focusTitle}>
            {nextInterview ? nextInterview.company : 'Dein nächster Schritt wartet.'}
          </Text>
          <Text style={styles.focusText}>
            {nextInterview?.nextStep ?? 'Halte deine Bewerbungen an einem Ort im Blick.'}
          </Text>
          <Link href="/explore" asChild>
            <Text accessibilityRole="link" style={styles.focusLink}>
              Pipeline ansehen <Text style={styles.focusArrow}>↗</Text>
            </Text>
          </Link>
        </View>

        <View style={[styles.sectionHeading, styles.recentHeading]}>
          <View>
            <ThemedText style={styles.sectionTitle}>Zuletzt aktiv</ThemedText>
            <ThemedText style={styles.sectionCaption} themeColor="textSecondary">
              Deine Bewerbungen auf einen Blick
            </ThemedText>
          </View>
          <Link href="/explore" asChild>
            <Text accessibilityRole="link" style={styles.seeAll}>Alle ansehen</Text>
          </Link>
        </View>

        <View>
          {applications.slice(0, 3).map((application) => (
            <Link href="/explore" asChild key={application.id}>
              <JobApplicationRow application={application} onPress={() => {}} />
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  value,
  label,
  theme,
}: {
  value: number;
  label: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value.toString().padStart(2, '0')}</Text>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 42,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '700',
  },
  profile: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 13,
    fontWeight: '700',
  },
  intro: {
    paddingTop: 25,
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
    fontFamily: 'Georgia',
    fontSize: 37,
    lineHeight: 42,
    fontWeight: '400',
  },
  subtitle: {
    maxWidth: 310,
    fontSize: 14,
    lineHeight: 21,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
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
  metricDivider: {
    height: 34,
    width: StyleSheet.hairlineWidth,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 27,
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
  },
  focusPanel: {
    borderRadius: 12,
    backgroundColor: '#E4EEE7',
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
    backgroundColor: '#F4F6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusEyebrow: {
    color: '#50715F',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    fontWeight: '700',
  },
  focusTitle: {
    color: '#203D2E',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
  },
  focusText: {
    color: '#52695B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  focusLink: {
    color: ACCENT,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 15,
  },
  focusArrow: {
    fontSize: 15,
  },
  recentHeading: {
    alignItems: 'flex-end',
    marginTop: 28,
    marginBottom: 5,
  },
  sectionCaption: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  seeAll: {
    color: ACCENT,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    paddingBottom: 3,
  },
});