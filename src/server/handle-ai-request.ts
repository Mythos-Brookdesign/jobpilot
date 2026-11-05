import { requestSchemas, type AiAction } from '@/domain/ai';
import { isDemoRequest } from '@/domain/demo';
import {
  AiApiError,
  AiIncompleteError,
  AiRefusalError,
  type AiService,
} from '@/server/ai-contract';
import { createProviderFromEnv } from '@/server/ai-provider';
import { createRateLimiter } from '@/server/rate-limit';

const HOUR = 60 * 60 * 1000;
/** Öffentliche Web-Demo: nur Demo-Inhalte, engeres Limit, Antworten aus dem Zwischenspeicher */
const DEMO = process.env.JOBPILOT_DEMO === '1';
const limiter = createRateLimiter({ limit: DEMO ? 10 : 30, windowMs: HOUR });
const demoCache = new Map<string, unknown>();

type Dependencies = {
  /** null, wenn auf dem Server kein API-Key eingerichtet ist */
  service: AiService | null;
  allow: (key: string) => boolean;
  /** Demo-Modus: Zwischenspeicher für gleiche Anfragen; undefined = kein Demo-Modus */
  demoCache?: Map<string, unknown>;
};

// Dieses Modul kennt keinen Anbieter: Welcher Service aus der Server-Konfiguration entsteht,
// entscheidet `createProviderFromEnv()` (AI_PROVIDER). Fehlt die Konfiguration, ist der
// Service null und der Assistent antwortet mit 503.
// Der Service entsteht einmal je Prozess und bleibt dann bestehen: Der SDK-Client wird über
// alle Anfragen wiederverwendet (Verbindungen und TLS-Sitzungen), und eine unbekannte
// Konfiguration wird einmal geloggt statt bei jeder Anfrage. undefined = noch nicht gebaut,
// null = bewusst kein Provider (wird ebenfalls gemerkt).
let defaultService: AiService | null | undefined;
function defaultDependencies(): Dependencies {
  if (defaultService === undefined) {
    defaultService = createProviderFromEnv();
  }
  return {
    service: defaultService,
    allow: limiter.allow,
    demoCache: DEMO ? demoCache : undefined,
  };
}

const errorResponse = (status: number, error: string) => Response.json({ error }, { status });

/** Gemeinsamer Ablauf aller KI-Routen: Limit, Prüfung der Eingabe, Aufruf, verständliche Fehler */
export async function handleAiRequest(
  action: AiAction,
  request: Request,
  deps: Dependencies = defaultDependencies(),
) {
  if (!deps.service) {
    return errorResponse(503, 'Der KI-Assistent ist auf diesem Server nicht eingerichtet.');
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchemas[action].safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.issues[0]?.message ?? 'Ungültige Anfrage.');
  }

  const cacheKey = `${action}:${JSON.stringify(parsed.data)}`;
  if (deps.demoCache) {
    if (!isDemoRequest(action, parsed.data as never)) {
      return errorResponse(
        403,
        'In der Demo funktioniert der Assistent nur mit der Beispiel-Anzeige. In der App kannst du eigene Texte verwenden.',
      );
    }
    // Gleiche Demo-Anfrage schon beantwortet: kostenlos und sofort
    if (deps.demoCache.has(cacheKey)) return Response.json(deps.demoCache.get(cacheKey));
  }

  // Nur echte Aufrufe zählen gegen das Limit
  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unbekannt';
  if (!deps.allow(client)) {
    return errorResponse(429, 'Zu viele Anfragen in kurzer Zeit. Bitte versuche es später erneut.');
  }

  try {
    // Der Typ hängt an `action`; die Prüfung oben garantiert die passende Form
    const result = await deps.service.run(action, parsed.data as never);
    deps.demoCache?.set(cacheKey, result);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return errorResponse(422, 'Dazu kann der Assistent leider nichts beitragen.');
    }
    if (error instanceof AiIncompleteError) {
      return errorResponse(502, 'Die Antwort war unvollständig. Bitte versuche es noch einmal.');
    }
    if (error instanceof AiApiError) {
      if (error.status === 429) {
        return errorResponse(
          429,
          'Der KI-Dienst ist gerade ausgelastet. Bitte gleich noch einmal.',
        );
      }
      if (error.status === 401 || error.status === 403) {
        console.error(`KI-Dienst: API-Key ungültig (Status ${error.status})`);
        return errorResponse(
          503,
          'Der KI-Assistent ist auf diesem Server nicht richtig eingerichtet.',
        );
      }
      console.error(`KI-Dienst-Fehler ${error.status}:`, error.message);
      return errorResponse(502, 'Der KI-Dienst hat einen Fehler gemeldet. Bitte später erneut.');
    }
    console.error('KI-Anfrage fehlgeschlagen:', error);
    return errorResponse(500, 'Das hat leider nicht geklappt.');
  }
}
