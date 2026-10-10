import type { Database } from '@/db/database';
import { createApplicationsRepository } from '@/db/repositories/applications';
import { createBackupRepository } from '@/db/repositories/backup';
import { createDetailsRepository } from '@/db/repositories/details';
import { createSettingsRepository } from '@/db/repositories/settings';

export function createRepositories(db: Database) {
  return {
    applications: createApplicationsRepository(db),
    details: createDetailsRepository(db),
    settings: createSettingsRepository(db),
    backup: createBackupRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
