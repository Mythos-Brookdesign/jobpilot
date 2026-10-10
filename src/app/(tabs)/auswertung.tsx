import { StyleSheet, Text, View } from 'react-native';

import { useLive } from '@/db/hooks';
import { bySource, funnel, responseStats, weeklyActivity } from '@/domain/insights';
import { FunnelChart, SourceTable, StatTile, WeeklyChart } from '@/features/insights/charts';
import { SerifFont } from '@/theme/colors';
import { useTheme } from '@/theme/use-theme';
import { Screen } from '@/ui/screen';
import { Section } from '@/ui/section';

const formatDays = (days: number) =>
  `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(days)} ${days === 1 ? 'Tag' : 'Tage'}`;

export default function InsightsScreen() {
  const theme = useTheme();
  const histories = useLive(
    ({ applications }) => applications.histories(),
    ['applications', 'status_events'],
  );

  const stages = funnel(histories);
  const responses = responseStats(histories);
  const sources = bySource(histories);
  const weeks = weeklyActivity(histories);
  const offers = stages.find((stage) => stage.stage === 'offer')?.count ?? 0;

  return (
    <Screen safeTop>
      <Text style={[styles.eyebrow, { color: theme.accentText }]}>DEINE ZAHLEN</Text>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        Auswertung
      </Text>

      {responses.submitted === 0 ? (
        <View style={[styles.empty, { borderColor: theme.backgroundSelected }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Noch keine Daten</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Sobald du dich auf Stellen bewirbst, siehst du hier, wie weit deine Bewerbungen kommen
            und welche Quellen am besten funktionieren.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.tiles}>
            <StatTile label="Bewerbungen" value={String(responses.submitted)} note="abgeschickt" />
            <StatTile
              label="Antwortquote"
              value={`${Math.round(responses.rate * 100)} %`}
              note={`${responses.responded} mit Rückmeldung`}
            />
            <StatTile
              label="Ø bis Rückmeldung"
              value={responses.averageDays === undefined ? '–' : formatDays(responses.averageDays)}
              note="nach dem Abschicken"
            />
            <StatTile label="Angebote" value={String(offers)} />
          </View>

          <Section title="Wie weit kommen deine Bewerbungen?">
            <FunnelChart stages={stages} />
          </Section>

          <Section title="Abgeschickt pro Woche">
            <WeeklyChart weeks={weeks} />
          </Section>

          <Section title="Erfolg je Quelle">
            <SourceTable rows={sources} />
          </Section>

          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            Gezählt wird die höchste erreichte Stufe – eine Absage nach dem Fachgespräch zählt also
            beim Fachgespräch mit. „Gemerkt“ fließt nicht ein.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    fontFamily: SerifFont,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
    marginTop: 5,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 22,
    marginTop: 24,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    paddingHorizontal: 4,
  },
});
