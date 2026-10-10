import type { ApplicationStatus, JobApplication, StatusEvent } from '@/domain/application';
import {
  bySource,
  funnel,
  highestStage,
  isoWeek,
  responseStats,
  weeklyActivity,
  type ApplicationHistory,
} from '@/domain/insights';

/** Verlauf aus [Status, Tag im Oktober 2026] */
function history(
  steps: [ApplicationStatus, number][],
  overrides: Partial<JobApplication> = {},
): ApplicationHistory {
  const events: StatusEvent[] = steps.map(([to, day], index) => ({
    from: index === 0 ? null : steps[index - 1][0],
    to,
    at: `2026-10-${String(day).padStart(2, '0')}T09:00:00.000Z`,
  }));
  return {
    application: {
      id: overrides.company ?? 'id',
      company: 'Firma',
      role: 'Dev',
      location: '',
      appliedAt: `2026-10-${String(steps[0][1]).padStart(2, '0')}`,
      status: steps.at(-1)![0],
      priority: 'normal',
      ...overrides,
    },
    events,
  };
}

const histories = [
  // Absage nach dem Fachgespräch: zählt trotzdem bis „Fachgespräch“
  history(
    [
      ['applied', 1],
      ['screening', 3],
      ['interview', 6],
      ['rejected', 9],
    ],
    { source: 'LinkedIn' },
  ),
  history(
    [
      ['applied', 2],
      ['screening', 6],
      ['interview', 8],
      ['final', 12],
      ['offer', 15],
    ],
    { source: 'LinkedIn' },
  ),
  history([['applied', 5]], { source: 'StepStone' }),
  history(
    [
      ['applied', 5],
      ['rejected', 7],
    ],
    { source: 'StepStone' },
  ),
  // Nur gemerkt: zählt in keiner Auswertung
  history([['saved', 8]]),
  // Gemerkt und wieder verworfen, ohne sich zu bewerben
  history([
    ['saved', 2],
    ['withdrawn', 4],
  ]),
];

describe('highestStage', () => {
  it('nimmt die höchste je erreichte Stufe, nicht den aktuellen Status', () => {
    expect(highestStage(histories[0])).toBe('interview');
    expect(highestStage(histories[1])).toBe('offer');
    expect(highestStage(histories[5])).toBe('saved');
  });
});

describe('funnel', () => {
  it('zählt abgeschickte Bewerbungen je erreichter Stufe', () => {
    expect(funnel(histories).map(({ stage, count }) => [stage, count])).toEqual([
      ['applied', 4],
      ['screening', 2],
      ['interview', 2],
      ['final', 1],
      ['offer', 1],
    ]);
  });

  it('liefert Anteile bezogen auf alle abgeschickten Bewerbungen', () => {
    expect(funnel(histories).find((s) => s.stage === 'offer')?.share).toBe(0.25);
  });

  it('kommt mit leeren Daten zurecht', () => {
    expect(funnel([]).every((stage) => stage.count === 0 && stage.share === 0)).toBe(true);
  });
});

describe('responseStats', () => {
  it('zählt Einladungen und Absagen als Rückmeldung und mittelt die Wartezeit', () => {
    // Rückmeldungen nach 2, 4 und 2 Tagen; eine Bewerbung ohne Antwort
    expect(responseStats(histories)).toEqual({
      submitted: 4,
      responded: 3,
      rate: 0.75,
      averageDays: 2.7,
    });
  });

  it('liefert ohne Rückmeldungen keinen Durchschnitt', () => {
    expect(responseStats([history([['applied', 1]])]).averageDays).toBeUndefined();
  });
});

describe('bySource', () => {
  it('fasst Bewerbungen, Gespräche und Angebote je Quelle zusammen', () => {
    expect(bySource(histories)).toEqual([
      { source: 'LinkedIn', submitted: 2, interviews: 2, offers: 1 },
      { source: 'StepStone', submitted: 2, interviews: 0, offers: 0 },
    ]);
  });

  it('fasst fehlende Quellen unter „Ohne Angabe“ zusammen', () => {
    expect(bySource([history([['applied', 1]])])[0].source).toBe('Ohne Angabe');
  });
});

describe('weeklyActivity', () => {
  it('zählt Bewerbungen je Woche (Montag bis Sonntag) bis einschließlich heute', () => {
    const weeks = weeklyActivity(histories, new Date(2026, 9, 10), 3);
    expect(weeks).toEqual([
      { weekStart: '2026-09-21', label: 'KW 39', count: 0 },
      { weekStart: '2026-09-28', label: 'KW 40', count: 2 },
      { weekStart: '2026-10-05', label: 'KW 41', count: 2 },
    ]);
  });
});

describe('isoWeek', () => {
  it('rechnet Kalenderwochen nach ISO 8601, auch über den Jahreswechsel', () => {
    expect(isoWeek(new Date(2026, 9, 10))).toBe(41);
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1);
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53);
    expect(isoWeek(new Date(2025, 11, 29))).toBe(1);
  });
});
