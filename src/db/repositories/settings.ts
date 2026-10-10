import { eq } from 'drizzle-orm';

import type { Database } from '@/db/database';
import { settings } from '@/db/schema';

export type SettingKey =
  | 'applications.filter'
  | 'applications.sort'
  | 'applications.view'
  | 'reminders.followUpDays'
  | 'reminders.appointments'
  | 'reminders.thankYou'
  /** Nutzer hat Benachrichtigungen in der App eingeschaltet (zusätzlich zur Systemerlaubnis) */
  | 'reminders.notifications';

/** Einfache Schlüssel-Wert-Einstellungen in derselben Datenbank */
export function createSettingsRepository(db: Database) {
  return {
    get(key: SettingKey): string | undefined {
      return db.select().from(settings).where(eq(settings.key, key)).get()?.value;
    },

    set(key: SettingKey, value: string) {
      db.insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
        .run();
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
