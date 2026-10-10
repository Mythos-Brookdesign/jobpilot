import { toLocalIsoDate, type JobApplication } from '@/domain/application';
import { BACKUP_FORMAT, BACKUP_VERSION, type Backup } from '@/domain/backup';

// Beispieldaten mit Datum relativ zu heute, damit die Demo immer aktuell wirkt.
// Feste IDs: Mehrfaches Laden ersetzt die Beispiele, statt sie zu verdoppeln.

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalIsoDate(date);
}

export function createDemoApplications(): JobApplication[] {
  return [
    {
      id: 'demo-nordlicht-software',
      company: 'Nordlicht Software',
      role: 'Senior Fullstack Developer',
      location: 'Berlin · Hybrid',
      appliedAt: daysAgo(1),
      status: 'interview',
      nextStep: 'Fachgespräch mit dem Tech Lead',
    },
    {
      id: 'demo-form-funktion',
      company: 'Form & Funktion',
      role: 'Senior React Developer',
      location: 'Hamburg',
      appliedAt: daysAgo(3),
      status: 'sent',
    },
    {
      id: 'demo-studio-morgen',
      company: 'Studio Morgen',
      role: 'Lead Frontend Engineer',
      location: 'Remote',
      appliedAt: daysAgo(6),
      status: 'sent',
    },
    {
      id: 'demo-lumen-works',
      company: 'Lumen Works',
      role: 'Senior Node.js Engineer',
      location: 'München',
      appliedAt: daysAgo(11),
      status: 'offer',
    },
    {
      id: 'demo-pixelgarten',
      company: 'Pixelgarten',
      role: 'Fullstack Developer (PHP)',
      location: 'Köln',
      appliedAt: daysAgo(15),
      status: 'rejected',
    },
  ];
}

/** Beispieldaten im Backup-Format, damit sie über denselben Weg wie ein Import landen */
export function createDemoBackup(now = new Date()): Backup {
  const timestamp = now.toISOString();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: timestamp,
    applications: createDemoApplications().map((application) => {
      const appliedAt = new Date(`${application.appliedAt}T09:00:00`).toISOString();
      return {
        ...application,
        createdAt: appliedAt,
        updatedAt: timestamp,
        statusEvents: [
          { from: null, to: 'sent', at: appliedAt },
          ...(application.status === 'sent'
            ? []
            : [{ from: 'sent' as const, to: application.status, at: timestamp }]),
        ],
      };
    }),
  };
}
