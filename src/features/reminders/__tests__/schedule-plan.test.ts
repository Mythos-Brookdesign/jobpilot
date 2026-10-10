import type { Reminder } from '@/domain/reminders';
import { notificationId, planSchedule } from '@/features/reminders/schedule-plan';

const now = new Date('2026-10-10T10:00:00.000Z');

function reminder(key: string, dueAt: string, extra: Partial<Reminder> = {}): Reminder {
  return { key, applicationId: 'a1', kind: 'custom', dueAt, title: key, body: '', ...extra };
}

describe('planSchedule', () => {
  it('plant offene, zukünftige Erinnerungen ein', () => {
    const future = reminder('zukunft', '2026-10-11T09:00:00.000Z');
    const result = planSchedule(
      [],
      [
        future,
        reminder('vorbei', '2026-10-09T09:00:00.000Z'),
        reminder('erledigt', '2026-10-12T09:00:00.000Z', { doneAt: '2026-10-10T08:00:00.000Z' }),
      ],
      now,
    );
    expect(result).toEqual({ cancel: [], schedule: [future] });
  });

  it('lässt bereits richtig geplante Benachrichtigungen in Ruhe', () => {
    const r = reminder('a', '2026-10-11T09:00:00.000Z');
    expect(planSchedule([{ identifier: notificationId(r), dueAt: r.dueAt }], [r], now)).toEqual({
      cancel: [],
      schedule: [],
    });
  });

  it('plant verschobene Erinnerungen zum neuen Zeitpunkt neu', () => {
    const r = reminder('a', '2026-10-11T09:00:00.000Z', {
      snoozedUntil: '2026-10-14T09:00:00.000Z',
    });
    expect(planSchedule([{ identifier: notificationId(r), dueAt: r.dueAt }], [r], now)).toEqual({
      cancel: [notificationId(r)],
      schedule: [r],
    });
  });

  it('sagt entfallene ab, fasst fremde Benachrichtigungen aber nicht an', () => {
    expect(
      planSchedule(
        [
          { identifier: 'jobpilot:weg', dueAt: '2026-10-11T09:00:00.000Z' },
          { identifier: 'andere-app-logik', dueAt: '2026-10-11T09:00:00.000Z' },
        ],
        [],
        now,
      ),
    ).toEqual({ cancel: ['jobpilot:weg'], schedule: [] });
  });
});
