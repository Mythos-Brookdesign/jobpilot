import { z } from 'zod';

import { WORK_MODES } from '@/domain/application';

// Gemeinsame Verträge zwischen App und Server (API-Routen): Anfragen werden auf dem Server,
// Antworten in der App mit denselben Schemas geprüft. Kein Code mit Geheimnissen hier –
// diese Datei landet auch im App-Bundle.

export const AI_ACTIONS = ['stellenanzeige', 'passung', 'vorbereitung', 'entwurf'] as const;
export type AiAction = (typeof AI_ACTIONS)[number];

/** Grenzen gegen versehentlich riesige oder missbräuchliche Anfragen */
export const MAX_POSTING_CHARS = 20_000;
export const MAX_PROFILE_CHARS = 15_000;
const MIN_POSTING_CHARS = 80;

const posting = z
  .string()
  .trim()
  .min(MIN_POSTING_CHARS, 'Der Text ist zu kurz für eine Stellenanzeige.')
  .max(MAX_POSTING_CHARS, `Bitte höchstens ${MAX_POSTING_CHARS.toLocaleString('de-DE')} Zeichen.`);
const profile = z
  .string()
  .trim()
  .min(1, 'Bitte zuerst dein Profil in den Einstellungen hinterlegen.')
  .max(MAX_PROFILE_CHARS, `Das Profil ist zu lang (höchstens ${MAX_PROFILE_CHARS} Zeichen).`);
const shortText = z.string().trim().max(300);

// --- Anfragen ------------------------------------------------------------------------------

export const DRAFT_KINDS = ['anschreiben', 'nachfassen', 'dankeschoen'] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];
export const DRAFT_LABELS: Record<DraftKind, string> = {
  anschreiben: 'Anschreiben',
  nachfassen: 'Nachfass-Mail',
  dankeschoen: 'Dankes-Mail',
};

export const requestSchemas = {
  stellenanzeige: z.object({ posting }),
  passung: z.object({ posting, profile }),
  vorbereitung: z.object({
    posting,
    company: shortText,
    role: shortText,
    profile: profile.optional(),
  }),
  entwurf: z.object({
    kind: z.enum(DRAFT_KINDS),
    company: shortText,
    role: shortText,
    posting: posting.optional(),
    profile: profile.optional(),
    contactName: shortText.optional(),
    /** z. B. worüber im Gespräch gesprochen wurde */
    context: z.string().trim().max(2_000).optional(),
  }),
} satisfies Record<AiAction, z.ZodType>;

export type AiRequest<A extends AiAction> = z.input<(typeof requestSchemas)[A]>;

// --- Antworten (zugleich das Ausgabeformat für Claude) ----------------------------------------

export const responseSchemas = {
  stellenanzeige: z.object({
    company: z.string().describe('Name des Unternehmens, leer wenn nicht erkennbar'),
    role: z.string().describe('Stellenbezeichnung'),
    location: z.string().describe('Arbeitsort, leer wenn nicht genannt'),
    workMode: z.enum(WORK_MODES).nullable(),
    salaryMin: z.number().int().nullable().describe('Jahresgehalt in Euro, untere Grenze'),
    salaryMax: z.number().int().nullable().describe('Jahresgehalt in Euro, obere Grenze'),
    skills: z.array(z.string()).describe('Geforderte Fähigkeiten und Technologien, höchstens 12'),
    contactName: z.string().nullable(),
    contactEmail: z.string().nullable(),
    summary: z.string().describe('Zwei Sätze: Was ist das für eine Stelle?'),
  }),
  passung: z.object({
    fit: z.enum(['hoch', 'mittel', 'gering']),
    summary: z.string(),
    matches: z.array(z.string()).describe('Anforderungen, die das Profil klar erfüllt'),
    gaps: z.array(z.string()).describe('Anforderungen, die fehlen oder unklar sind'),
    talkingPoints: z
      .array(z.string())
      .describe('Was im Anschreiben oder Gespräch betont werden sollte'),
  }),
  vorbereitung: z.object({
    questions: z.array(
      z.object({
        question: z.string(),
        why: z.string().describe('Warum diese Frage wahrscheinlich ist'),
        hint: z.string().describe('Stichpunkte für eine gute Antwort'),
      }),
    ),
    questionsToAsk: z.array(z.string()).describe('Gute Rückfragen an das Unternehmen'),
  }),
  entwurf: z.object({
    subject: z.string(),
    body: z.string(),
  }),
} satisfies Record<AiAction, z.ZodType>;

export type AiResponse<A extends AiAction> = z.infer<(typeof responseSchemas)[A]>;

/** Fehlerantwort der API-Routen – Meldung ist für Nutzer formuliert */
export const errorSchema = z.object({ error: z.string() });
