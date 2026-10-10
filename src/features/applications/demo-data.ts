import { toLocalIsoDate, type ApplicationStatus } from '@/domain/application';
import { DEMO_COMPANY, DEMO_CONTACT, DEMO_POSTING, DEMO_ROLE } from '@/domain/demo';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type Backup,
  type BackupApplication,
} from '@/domain/backup';

// Beispieldaten relativ zu heute, damit die Demo immer aktuell wirkt.
// Feste IDs: Mehrfaches Laden ersetzt die Beispiele, statt sie zu verdoppeln.

const DAY = 24 * 60 * 60 * 1000;

type DemoEntry = Omit<
  BackupApplication,
  'appliedAt' | 'createdAt' | 'updatedAt' | 'statusEvents' | 'appointments' | 'notes'
> & {
  /** vor wie vielen Tagen beworben bzw. gemerkt */
  daysAgo: number;
  /** Statusverlauf nach dem Start: [Status, Tage nach dem Start] */
  history: [ApplicationStatus, number][];
  /** Termine: [Tage ab heute, Stunde, Art, Ort/Link] */
  appointments?: [number, number, BackupApplication['appointments'][number]['kind'], string][];
  notes?: [number, string][];
};

const DEMO: DemoEntry[] = [
  {
    id: 'demo-nordlicht-software',
    company: DEMO_COMPANY,
    role: DEMO_ROLE,
    location: 'Berlin',
    workMode: 'hybrid',
    status: 'interview',
    priority: 'high',
    source: 'LinkedIn',
    jobUrl: 'https://example.com/jobs/nordlicht-fullstack',
    salaryMin: 75000,
    salaryMax: 85000,
    nextStep: 'Fachgespräch mit dem Tech Lead vorbereiten',
    // Die Beispiel-Anzeige: damit funktioniert der KI-Assistent auch in der Web-Demo
    jobDescription: DEMO_POSTING,
    daysAgo: 12,
    history: [
      ['applied', 0],
      ['screening', 4],
      ['interview', 8],
    ],
    contacts: [
      {
        id: 'demo-contact-jana',
        name: DEMO_CONTACT,
        role: 'Recruiterin',
        email: 'jana.peters@example.com',
      },
      { id: 'demo-contact-tobias', name: 'Tobias Brandt', role: 'Tech Lead' },
    ],
    appointments: [[1, 10, 'technical', 'https://meet.example.com/nordlicht']],
    notes: [[4, 'Screening lief gut. Fokus im Gespräch: Next.js, CI/CD und Teamgröße (8 Devs).']],
  },
  {
    id: 'demo-studio-morgen',
    company: 'Studio Morgen',
    role: 'Lead Frontend Engineer',
    location: 'Remote',
    workMode: 'remote',
    status: 'screening',
    priority: 'normal',
    source: 'Empfehlung',
    daysAgo: 6,
    history: [
      ['applied', 0],
      ['screening', 3],
    ],
    contacts: [{ id: 'demo-contact-lea', name: 'Lea Hoffmann', role: 'Head of Engineering' }],
    appointments: [[3, 14, 'phone', '']],
  },
  {
    id: 'demo-form-funktion',
    company: 'Form & Funktion',
    role: 'Senior React Developer',
    location: 'Hamburg',
    workMode: 'onsite',
    status: 'applied',
    priority: 'normal',
    source: 'StepStone',
    daysAgo: 3,
    history: [['applied', 0]],
    contacts: [],
  },
  {
    id: 'demo-hafenblick-digital',
    company: 'Hafenblick Digital',
    role: 'Senior Node.js Developer',
    location: 'München',
    workMode: 'hybrid',
    status: 'saved',
    priority: 'high',
    source: 'Firmenwebsite',
    jobUrl: 'https://example.com/karriere/node',
    nextStep: 'Anschreiben bis Freitag fertigstellen',
    daysAgo: 1,
    history: [],
    contacts: [],
  },
  {
    id: 'demo-lumen-works',
    company: 'Lumen Works',
    role: 'Senior Node.js Engineer',
    location: 'München',
    workMode: 'hybrid',
    status: 'offer',
    priority: 'high',
    source: 'Recruiter',
    salaryMin: 78000,
    salaryMax: 85000,
    nextStep: 'Angebot bis Ende der Woche beantworten',
    daysAgo: 30,
    history: [
      ['applied', 0],
      ['screening', 5],
      ['interview', 12],
      ['final', 20],
      ['offer', 26],
    ],
    contacts: [],
    notes: [[26, 'Angebot: 82.000 €, 30 Tage Urlaub, 2 Tage Homeoffice.']],
  },
  {
    id: 'demo-pixelgarten',
    company: 'Pixelgarten',
    role: 'Fullstack Developer (PHP)',
    location: 'Köln',
    workMode: 'onsite',
    status: 'rejected',
    priority: 'low',
    source: 'StepStone',
    daysAgo: 24,
    history: [
      ['applied', 0],
      ['screening', 7],
      ['rejected', 11],
    ],
    contacts: [],
  },
  {
    id: 'demo-quellwerk',
    company: 'Quellwerk',
    role: 'Senior Software Engineer',
    location: 'Remote',
    workMode: 'remote',
    status: 'applied',
    priority: 'normal',
    source: 'LinkedIn',
    daysAgo: 18,
    history: [['applied', 0]],
    contacts: [],
  },
];

export function createDemoBackup(now = new Date()): Backup {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9);
  const at = (daysFromToday: number, hour = 9) =>
    new Date(today.getTime() + daysFromToday * DAY + (hour - 9) * 60 * 60 * 1000).toISOString();

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    applications: DEMO.map(({ daysAgo, history, appointments, notes, ...entry }) => {
      const start = -daysAgo;
      const steps: [ApplicationStatus, number][] = [['saved', 0], ...history];
      // Beim direkten Bewerben beginnt der Verlauf mit „Beworben“ statt mit „Gemerkt“
      const statusEvents = (history[0]?.[1] === 0 ? history : steps).map(
        ([status, offset], index, all) => ({
          from: index === 0 ? null : all[index - 1][0],
          to: status,
          at: at(start + offset, 9 + index),
        }),
      );
      return {
        ...entry,
        appliedAt: toLocalIsoDate(new Date(at(start))),
        createdAt: at(start),
        updatedAt: statusEvents.at(-1)?.at ?? at(start),
        statusEvents,
        appointments: (appointments ?? []).map(([days, hour, kind, location], index) => ({
          id: `${entry.id}-appointment-${index}`,
          kind,
          startsAt: at(days, hour),
          ...(location ? { location } : {}),
        })),
        notes: (notes ?? []).map(([offset, body], index) => ({
          id: `${entry.id}-note-${index}`,
          body,
          createdAt: at(start + offset, 18),
        })),
      };
    }),
  };
}
