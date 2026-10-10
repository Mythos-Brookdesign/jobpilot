import { toLocalIsoDate, type JobApplication } from '@/domain/application';

// Beispieldaten mit Datum relativ zu heute, damit die Demo immer aktuell wirkt
function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalIsoDate(date);
}

export function createDemoApplications(): JobApplication[] {
  return [
    {
      id: 'nordlicht-software',
      company: 'Nordlicht Software',
      role: 'Senior Fullstack Developer',
      location: 'Berlin · Hybrid',
      appliedAt: daysAgo(1),
      status: 'interview',
      nextStep: 'Fachgespräch mit dem Tech Lead',
    },
    {
      id: 'form-funktion',
      company: 'Form & Funktion',
      role: 'Senior React Developer',
      location: 'Hamburg',
      appliedAt: daysAgo(3),
      status: 'sent',
    },
    {
      id: 'studio-morgen',
      company: 'Studio Morgen',
      role: 'Lead Frontend Engineer',
      location: 'Remote',
      appliedAt: daysAgo(6),
      status: 'sent',
    },
    {
      id: 'lumen-works',
      company: 'Lumen Works',
      role: 'Senior Node.js Engineer',
      location: 'München',
      appliedAt: daysAgo(11),
      status: 'offer',
    },
    {
      id: 'pixelgarten',
      company: 'Pixelgarten',
      role: 'Fullstack Developer (PHP)',
      location: 'Köln',
      appliedAt: daysAgo(15),
      status: 'rejected',
    },
  ];
}
