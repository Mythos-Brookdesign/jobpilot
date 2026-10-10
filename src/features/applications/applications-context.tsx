import { createContext, useContext, type PropsWithChildren } from 'react';

import type { ApplicationsRepository } from '@/db/applications-repository';
import { useDatabase } from '@/db/database-provider';
import { useLiveRows } from '@/db/use-live-rows';
import type { JobApplication } from '@/domain/application';

// Eine Live-Abfrage für die ganze App: Jede Änderung in der Datenbank aktualisiert alle Screens.
// Schreibzugriffe laufen direkt über das Repository.

type ApplicationsContextValue = {
  applications: JobApplication[];
  repository: ApplicationsRepository;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

const WATCHED_TABLES = ['applications'] as const;

export function ApplicationsProvider({ children }: PropsWithChildren) {
  const { applications: repository } = useDatabase();
  const applications = useLiveRows(() => repository.listActive(), WATCHED_TABLES);

  return (
    <ApplicationsContext.Provider value={{ applications, repository }}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationsProvider');
  }
  return context;
}
