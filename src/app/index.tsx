import { Link, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { countByStatus, findNextInterview } from '@/domain/application';
import { useApplications } from '@/features/applications/applications-context';
import { ApplicationRow } from '@/features/applications/components/application-row';
import { SerifFont, type ThemeColors } from '@/theme/colors';
import { useTheme } from '@/theme/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { applications } = useApplications();
  const counts = countByStatus(applications);
  const nextInterview = findNextInterview(applications);
  const greetingDate = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Im Browser steht die Wortmarke bereits in der Navigationsleiste */}
        {Platform.OS !== 'web' && (
          <View style={styles.topBar}>
            <Text style={[styles.wordmark, { color: theme.text }]}>
              jobpilot<Text style={{ color: theme.accentText }}>.</Text>
            </Text>
            <View style={[styles.profile, { backgroundColor: theme.backgroundSelected }]}>
              <Text style={[styles.profileText, { color: theme.text }]}>M</Text>
            </View>
          </View>
        )}

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            DEIN KARRIERE-DASHBOARD · {greetingDate.toLocaleUpperCase('de-DE')}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Deine Suche,{'\n'}mit Überblick.
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Jeder gute nächste Schritt beginnt mit einem klaren Plan.
          </Text>
        </View>

        <View style={[styles.metrics, { borderColor: theme.backgroundSelected }]}>
          <Metric value={counts.sent + counts.interview} label="Aktiv" theme={theme} />
          <View style={[styles.metricDivider, { backgroundColor: theme.backgroundSelected }]} />
          <Metric value={counts.interview} label="Gespräche" theme={theme} />
          <View style={[styles.metricDivider, { backgroundColor: theme.backgroundSelected }]} />
          <Metric value={counts.offer} label="Angebote" theme={theme} />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dein nächster Schritt</Text>
          <SymbolView
            name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }}
            tintColor={theme.accentText}
            size={18}
          />
        </View>
        <View style={[styles.focusPanel, { backgroundColor: theme.accentSoft }]}>
          <View style={styles.focusTopline}>
            <View style={[styles.focusIcon, { backgroundColor: theme.background }]}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                tintColor={theme.accentText}
                size={19}
              />
            </View>
            <Text style={[styles.focusEyebrow, { color: theme.accentSoftEyebrow }]}>
              {nextInterview ? 'IM PROZESS' : 'GUTER MOMENT'}
            </Text>
          </View>
          <Text style={[styles.focusTitle, { color: theme.accentSoftText }]}>
            {nextInterview ? nextInterview.company : 'Dein nächster Schritt wartet.'}
          </Text>
          <Text style={[styles.focusText, { color: theme.accentSoftMuted }]}>
            {nextInterview?.nextStep ?? 'Halte deine Bewerbungen an einem Ort im Blick.'}
          </Text>
          <Link href="/bewerbungen" style={[styles.focusLink, { color: theme.accentText }]}>
            Pipeline ansehen <Text style={styles.focusArrow}>↗</Text>
          </Link>
        </View>

        <View style={[styles.sectionHeading, styles.recentHeading]}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Zuletzt aktiv</Text>
            <Text style={[styles.sectionCaption, { color: theme.textSecondary }]}>
              Deine Bewerbungen auf einen Blick
            </Text>
          </View>
          <Link href="/bewerbungen" style={[styles.seeAll, { color: theme.accentText }]}>
            Alle ansehen
          </Link>
        </View>

        <View>
          {applications.slice(0, 3).map((application) => (
            <ApplicationRow
              application={application}
              key={application.id}
              onPress={() => router.push('/bewerbungen')}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label, theme }: { value: number; label: string; theme: ThemeColors }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: theme.text }]}>
        {value.toString().padStart(2, '0')}
      </Text>
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
    fontFamily: SerifFont,
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
  focusLink: {
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
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    paddingBottom: 3,
  },
});
