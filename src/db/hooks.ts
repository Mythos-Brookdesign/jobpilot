import { useDatabase } from '@/db/database-provider';
import type { Repositories } from '@/db/repositories';
import { useLiveData, type TableName } from '@/db/use-live-data';

/** Kurzform: Repositories aus dem Context und Live-Daten in einem */
export function useLive<T>(
  read: (repositories: Repositories) => T,
  tables: readonly TableName[],
  deps: readonly unknown[] = [],
): T {
  const { repositories } = useDatabase();
  return useLiveData(() => read(repositories), tables, deps);
}

export function useRepositories() {
  return useDatabase().repositories;
}
