export const APPLICATION_STATUSES = ['Gesendet', 'Gespräch', 'Angebot', 'Abgesagt'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  appliedAt: string;
  status: ApplicationStatus;
  nextStep?: string;
};

export type NewApplication = Omit<JobApplication, 'id'>;

export const INITIAL_APPLICATIONS: JobApplication[] = [
  {
    id: 'nordlicht-studio',
    company: 'Nordlicht Studio',
    role: 'Product Designer',
    location: 'Berlin',
    appliedAt: '2026-10-09',
    status: 'Gespräch',
    nextStep: 'Zweitgespräch am 14. Okt.',
  },
  {
    id: 'form-funktion',
    company: 'Form & Funktion',
    role: 'UX Designer',
    location: 'Hamburg',
    appliedAt: '2026-10-07',
    status: 'Gesendet',
  },
  {
    id: 'studio-morgen',
    company: 'Studio Morgen',
    role: 'Brand Designer',
    location: 'Remote',
    appliedAt: '2026-10-04',
    status: 'Gesendet',
  },
  {
    id: 'lumen-works',
    company: 'Lumen Works',
    role: 'Product Designer',
    location: 'München',
    appliedAt: '2026-09-29',
    status: 'Angebot',
  },
  {
    id: 'pixelgarten',
    company: 'Pixelgarten',
    role: 'Visual Designer',
    location: 'Köln',
    appliedAt: '2026-09-25',
    status: 'Abgesagt',
  },
];