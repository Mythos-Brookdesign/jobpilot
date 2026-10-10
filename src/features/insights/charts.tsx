import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { STATUS_LABELS } from '@/domain/application';
import type { funnel, SourceStats, weeklyActivity } from '@/domain/insights';
import { useTheme } from '@/theme/use-theme';

// Diagramme aus einfachen Views: wenige Werte, eine Farbe, keine Diagramm-Bibliothek nötig.
// Regeln: Balken höchstens 24 px dick, 4 px abgerundetes Datenende, gerade an der Grundlinie,
// Werte in Textfarbe (nie in Balkenfarbe), dezente Hilfslinien.

const BAR_THICKNESS = 22;
const percent = (share: number) => `${Math.round(share * 100)} %`;

// --- Kennzahl ---------------------------------------------------------------------------------

export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={[label, value, note].filter(Boolean).join(', ')}
      style={[
        styles.tile,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: theme.text }]}>{value}</Text>
      {note ? <Text style={[styles.tileNote, { color: theme.textSecondary }]}>{note}</Text> : null}
    </View>
  );
}

// --- Funnel: wie weit kommen Bewerbungen? -----------------------------------------------------

export function FunnelChart({ stages }: { stages: ReturnType<typeof funnel> }) {
  const theme = useTheme();
  const max = Math.max(1, ...stages.map((stage) => stage.count));

  return (
    <View style={styles.chart}>
      {stages.map((stage) => (
        <View
          key={stage.stage}
          accessible
          accessibilityLabel={`${STATUS_LABELS[stage.stage]}: ${stage.count}, ${percent(stage.share)}`}
          style={styles.funnelRow}>
          <Text numberOfLines={1} style={[styles.funnelLabel, { color: theme.textSecondary }]}>
            {STATUS_LABELS[stage.stage]}
          </Text>
          {/* Balken in eigener Fläche, Werte in fester Spalte – nichts kann überlaufen */}
          <View style={[styles.funnelTrack, { borderLeftColor: theme.chartGrid }]}>
            {stage.count > 0 ? (
              <View
                style={[
                  styles.funnelBar,
                  { width: `${(stage.count / max) * 100}%`, backgroundColor: theme.chartBar },
                ]}
              />
            ) : null}
          </View>
          <Text style={[styles.funnelValue, { color: theme.text }]}>
            {stage.count}
            <Text style={{ color: theme.textSecondary }}> · {percent(stage.share)}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

// --- Aktivität je Woche -----------------------------------------------------------------------

const CHART_HEIGHT = 120;

export function WeeklyChart({ weeks }: { weeks: ReturnType<typeof weeklyActivity> }) {
  const theme = useTheme();
  const current = weeks.length - 1;
  const [selected, setSelected] = useState(current);
  const max = Math.max(1, ...weeks.map((week) => week.count));
  // Saubere Obergrenze für die Achse: 1, 2, 5, 10, 20 …
  const top = [1, 2, 5, 10, 20, 50, 100].find((step) => step >= max) ?? max;
  const shown = weeks[selected];

  return (
    <View style={styles.chart}>
      {/* Ablesezeile: Antippen einer Säule zeigt ihren Wert (Hover gibt es auf dem Handy nicht) */}
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.readout, { color: theme.textSecondary }]}>
        <Text style={[styles.readoutValue, { color: theme.text }]}>
          {shown.count} {shown.count === 1 ? 'Bewerbung' : 'Bewerbungen'}
        </Text>
        {'  '}
        {selected === current ? 'diese Woche' : shown.label}
      </Text>

      <View style={styles.weeklyPlot}>
        <View style={styles.yAxis}>
          <Text style={[styles.tick, { color: theme.textSecondary }]}>{top}</Text>
          <Text style={[styles.tick, { color: theme.textSecondary }]}>0</Text>
        </View>
        <View style={styles.columns}>
          {/* Hilfslinien: oben und Grundlinie */}
          <View style={[styles.gridLine, { top: 0, backgroundColor: theme.chartGrid }]} />
          <View style={[styles.gridLine, { bottom: 0, backgroundColor: theme.chartGrid }]} />
          {weeks.map((week, index) => (
            <Pressable
              key={week.weekStart}
              accessibilityRole="button"
              accessibilityState={{ selected: index === selected }}
              accessibilityLabel={`${week.label}: ${week.count} ${week.count === 1 ? 'Bewerbung' : 'Bewerbungen'}`}
              onPress={() => setSelected(index)}
              style={styles.column}>
              <View
                style={[
                  styles.columnBar,
                  {
                    height: week.count ? Math.max(4, (week.count / top) * CHART_HEIGHT) : 0,
                    backgroundColor: index === current ? theme.chartBar : theme.chartBarMuted,
                    opacity: index === selected || selected === current ? 1 : 0.55,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.xAxis}>
        {weeks.map((week, index) => (
          <Text
            key={week.weekStart}
            style={[
              styles.xLabel,
              {
                color: index === selected ? theme.text : theme.textSecondary,
                fontWeight: index === selected ? '700' : '400',
              },
            ]}>
            {week.label.replace('KW ', '')}
          </Text>
        ))}
      </View>
      <Text style={[styles.axisTitle, { color: theme.textSecondary }]}>Kalenderwoche</Text>
    </View>
  );
}

// --- Erfolg je Quelle (Tabelle) ---------------------------------------------------------------

export function SourceTable({ rows }: { rows: SourceStats[] }) {
  const theme = useTheme();
  const headers = ['Quelle', 'Bew.', 'Gespr.', 'Angeb.'];
  return (
    <View accessibilityRole="list">
      <View style={[styles.tableRow, styles.tableHead, { borderBottomColor: theme.border }]}>
        {headers.map((header, index) => (
          <Text
            key={header}
            style={[
              index === 0 ? styles.tableFirst : styles.tableNumber,
              styles.tableHeadText,
              { color: theme.textSecondary },
            ]}>
            {header}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View
          key={row.source}
          accessible
          accessibilityLabel={`${row.source}: ${row.submitted} Bewerbungen, ${row.interviews} mit Gespräch, ${row.offers} Angebote`}
          style={[
            styles.tableRow,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
          ]}>
          <Text numberOfLines={1} style={[styles.tableFirst, { color: theme.text }]}>
            {row.source}
          </Text>
          {[row.submitted, row.interviews, row.offers].map((value, column) => (
            <Text key={column} style={[styles.tableNumber, { color: theme.text }]}>
              {value}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 160, // 2×2 auf dem Handy, 4 nebeneinander auf breiten Bildschirmen
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  tileLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  tileValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
  },
  tileNote: {
    fontSize: 11,
    lineHeight: 15,
  },
  chart: {
    padding: 15,
    gap: 10,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  funnelLabel: {
    width: 92,
    fontSize: 12,
  },
  funnelTrack: {
    flex: 1,
    minHeight: BAR_THICKNESS + 6,
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  funnelBar: {
    height: BAR_THICKNESS,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  funnelValue: {
    width: 76,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  readout: {
    fontSize: 12,
  },
  readoutValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  weeklyPlot: {
    flexDirection: 'row',
    gap: 8,
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 22,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tick: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    marginVertical: -6,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  column: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  columnBar: {
    width: '62%',
    maxWidth: 24,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xAxis: {
    flexDirection: 'row',
    marginLeft: 30,
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  axisTitle: {
    fontSize: 10,
    textAlign: 'center',
    marginLeft: 30,
    marginTop: -4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    paddingHorizontal: 15,
  },
  tableHead: {
    minHeight: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeadText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableFirst: {
    flex: 1,
    fontSize: 14,
  },
  tableNumber: {
    width: 56,
    textAlign: 'right',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});
