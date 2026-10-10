import type { Repositories } from '@/db/repositories';
import { DEMO_PROFILE } from '@/domain/demo';
import { createDemoBackup } from '@/features/applications/demo-data';

/**
 * Öffentliche Web-Demo (beim Build mit EXPO_PUBLIC_DEMO=1). Expo setzt den Wert beim Bündeln
 * fest ein – in der normalen App ist er nie gesetzt.
 */
export const isDemo = process.env.EXPO_PUBLIC_DEMO === '1';

/** Beim ersten Besuch Beispieldaten und Beispielprofil laden */
export function seedDemoIfEmpty(repositories: Repositories) {
  if (repositories.applications.listActive().length > 0) return;
  repositories.backup.import(createDemoBackup());
  repositories.settings.set('profile.text', DEMO_PROFILE);
}

/** Demo in den Ausgangszustand bringen */
export function resetDemo(repositories: Repositories) {
  repositories.backup.clearAll();
  repositories.backup.import(createDemoBackup());
  repositories.settings.set('profile.text', DEMO_PROFILE);
}
