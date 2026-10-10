import type { AiAction, requestSchemas } from '@/domain/ai';
import type { z } from 'zod';

// Inhalte der öffentlichen Web-Demo. In der Demo nimmt der Server nur Anfragen an, die aus
// genau diesen Daten bestehen – so lässt sich der Assistent ausprobieren, ohne dass beliebige
// Texte auf fremde Kosten verarbeitet werden.

export const DEMO_COMPANY = 'Nordlicht Software';
export const DEMO_ROLE = 'Senior Fullstack Developer';
export const DEMO_CONTACT = 'Jana Peters';

export const DEMO_POSTING = `Senior Fullstack Developer (m/w/d) – Hybrid in Berlin

Nordlicht Software entwickelt SaaS-Lösungen für die Energiewirtschaft. Für unser Plattform-Team (8 Entwickler:innen) suchen wir ab sofort Verstärkung.

Deine Aufgaben:
- Weiterentwicklung unserer Web-Plattform mit React, Next.js und TypeScript
- Entwicklung von APIs mit Node.js und PostgreSQL
- Aufbau und Pflege unserer CI/CD-Pipelines (GitHub Actions)
- Mentoring von Junior-Entwickler:innen

Dein Profil:
- Mehrjährige Erfahrung in der Fullstack-Entwicklung mit React und Node.js
- Sicherer Umgang mit TypeScript
- Erfahrung mit relationalen Datenbanken
- Wünschenswert: Erfahrung mit Docker und Kubernetes

Wir bieten 75.000 – 85.000 € Jahresgehalt, 30 Tage Urlaub, 3 Tage Homeoffice pro Woche.
Ansprechpartnerin: Jana Peters, jana.peters@nordlicht.example`;

export const DEMO_PROFILE = `Senior Fullstack-Entwicklerin mit 9 Jahren Erfahrung.
Aktuell: React, Next.js, Node.js und TypeScript in einer Produktfirma; Aufbau der CI/CD-Pipelines mit GitHub Actions.
Davor: PHP-Backend für große E-Commerce-Plattformen, Unit-Tests, agile Teams.
Datenbanken: MySQL, MongoDB. Betreut Werkstudierende und Juniors.`;

/** Gleich bis auf Leerraum – beim Kopieren ändern sich oft Zeilenumbrüche */
const same = (a: string | undefined, b: string) =>
  a !== undefined && a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();
const absentOr = (a: string | undefined, b: string) => a === undefined || same(a, b);

type Parsed<A extends AiAction> = z.infer<(typeof requestSchemas)[A]>;

/** Besteht die Anfrage ausschließlich aus Demo-Inhalten? */
export function isDemoRequest<A extends AiAction>(action: A, input: Parsed<A>): boolean {
  switch (action) {
    case 'stellenanzeige': {
      const { posting } = input as Parsed<'stellenanzeige'>;
      return same(posting, DEMO_POSTING);
    }
    case 'passung': {
      const { posting, profile } = input as Parsed<'passung'>;
      return same(posting, DEMO_POSTING) && same(profile, DEMO_PROFILE);
    }
    case 'vorbereitung': {
      const { posting, company, role, profile } = input as Parsed<'vorbereitung'>;
      return (
        same(posting, DEMO_POSTING) &&
        same(company, DEMO_COMPANY) &&
        same(role, DEMO_ROLE) &&
        absentOr(profile, DEMO_PROFILE)
      );
    }
    case 'entwurf': {
      const { company, role, posting, profile, contactName, context } = input as Parsed<'entwurf'>;
      return (
        same(company, DEMO_COMPANY) &&
        same(role, DEMO_ROLE) &&
        absentOr(posting, DEMO_POSTING) &&
        absentOr(profile, DEMO_PROFILE) &&
        absentOr(contactName, DEMO_CONTACT) &&
        context === undefined
      );
    }
    default:
      return false;
  }
}
