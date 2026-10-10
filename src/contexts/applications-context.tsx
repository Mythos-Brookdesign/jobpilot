import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import {
  INITIAL_APPLICATIONS,
  type ApplicationStatus,
  type JobApplication,
  type NewApplication,
} from '@/data/applications';

type ApplicationsContextValue = {
  applications: JobApplication[];
  addApplication: (application: NewApplication) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

export function ApplicationsProvider({ children }: PropsWithChildren) {
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);

  function addApplication(application: NewApplication) {
    setApplications((current) => [{ ...application, id: `${Date.now()}` }, ...current]);
  }

  function updateApplicationStatus(id: string, status: ApplicationStatus) {
    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    );
  }

  return (
    <ApplicationsContext.Provider value={{ applications, addApplication, updateApplicationStatus }}>
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