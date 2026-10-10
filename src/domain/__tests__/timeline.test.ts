import { buildTimeline } from '@/domain/timeline';

describe('buildTimeline', () => {
  it('mischt Status, Notizen und Termine und sortiert neueste zuerst', () => {
    const timeline = buildTimeline(
      {
        events: [
          { from: null, to: 'applied', at: '2026-10-01T09:00:00.000Z' },
          { from: 'applied', to: 'screening', at: '2026-10-05T09:00:00.000Z' },
        ],
        notes: [
          { id: 'n1', applicationId: 'a', body: 'Notiz', createdAt: '2026-10-03T12:00:00.000Z' },
        ],
        appointments: [
          {
            id: 't1',
            applicationId: 'a',
            kind: 'video',
            startsAt: '2026-10-12T10:00:00.000Z',
          },
        ],
      },
      new Date('2026-10-10T12:00:00.000Z'),
    );

    expect(timeline.map((item) => item.kind)).toEqual(['appointment', 'status', 'note', 'status']);
    expect(timeline[0]).toMatchObject({ kind: 'appointment', upcoming: true });
  });
});
