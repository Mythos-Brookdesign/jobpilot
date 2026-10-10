import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { openAppDatabase, type AppDatabase } from '@/db/client';
import migrations from '../../drizzle/migrations';

const DatabaseContext = createContext<AppDatabase | null>(null);

type DatabaseProviderProps = {
  children: ReactNode;
  /** Solange die Datenbank geöffnet und migriert wird */
  loading: ReactNode;
  renderError: (message: string) => ReactNode;
  onSettled?: () => void;
};

/** Öffnet die Datenbank, bringt das Schema auf den neuesten Stand und stellt sie bereit */
export function DatabaseProvider({
  children,
  loading,
  renderError,
  onSettled,
}: DatabaseProviderProps) {
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const [openError, setOpenError] = useState<Error | null>(null);

  useEffect(() => {
    openAppDatabase().then(setDatabase, (error: unknown) => {
      setOpenError(error instanceof Error ? error : new Error(String(error)));
    });
  }, []);

  useEffect(() => {
    if (openError) onSettled?.();
  }, [openError, onSettled]);

  if (openError) return renderError(openError.message);
  if (!database) return loading;

  return (
    <Migrated database={database} loading={loading} renderError={renderError} onSettled={onSettled}>
      {children}
    </Migrated>
  );
}

function Migrated({
  database,
  children,
  loading,
  renderError,
  onSettled,
}: DatabaseProviderProps & { database: AppDatabase }) {
  const { success, error } = useMigrations(database.db, migrations);

  useEffect(() => {
    if (success || error) onSettled?.();
  }, [success, error, onSettled]);

  if (error) return renderError(error.message);
  if (!success) return loading;

  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const database = useContext(DatabaseContext);
  if (!database) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return database;
}
