import Anthropic from '@anthropic-ai/sdk';

import { requestSchemas, type AiAction } from '@/domain/ai';
import {
  AiIncompleteError,
  AiRefusalError,
  createAiService,
  type AiService,
} from '@/server/ai-service';
import { createRateLimiter } from '@/server/rate-limit';

const limiter = createRateLimiter({ limit: 30, windowMs: 60 * 60 * 1000 });

type Dependencies = {
  /** null, wenn auf dem Server kein API-Key eingerichtet ist */
  service: AiService | null;
  allow: (key: string) => boolean;
};

// Client erst bei Bedarf anlegen – ohne Key soll der Server trotzdem starten
let defaultService: AiService | null | undefined;
function defaultDependencies(): Dependencies {
  if (defaultService === undefined) {
    defaultService = process.env.ANTHROPIC_API_KEY ? createAiService(new Anthropic()) : null;
  }
  return { service: defaultService, allow: limiter.allow };
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

  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unbekannt';
  if (!deps.allow(client)) {
    return errorResponse(429, 'Zu viele Anfragen in kurzer Zeit. Bitte versuche es später erneut.');
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchemas[action].safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, parsed.error.issues[0]?.message ?? 'Ungültige Anfrage.');
  }

  try {
    // Der Typ hängt an `action`; die Prüfung oben garantiert die passende Form
    const result = await deps.service.run(action, parsed.data as never);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AiRefusalError) {
      return errorResponse(422, 'Dazu kann der Assistent leider nichts beitragen.');
    }
    if (error instanceof AiIncompleteError) {
      return errorResponse(502, 'Die Antwort war unvollständig. Bitte versuche es noch einmal.');
    }
    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse(429, 'Der KI-Dienst ist gerade ausgelastet. Bitte gleich noch einmal.');
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Claude API: API-Key ungültig');
      return errorResponse(
        503,
        'Der KI-Assistent ist auf diesem Server nicht richtig eingerichtet.',
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API-Fehler ${error.status}:`, error.message);
      return errorResponse(502, 'Der KI-Dienst hat einen Fehler gemeldet. Bitte später erneut.');
    }
    console.error('KI-Anfrage fehlgeschlagen:', error);
    return errorResponse(500, 'Das hat leider nicht geklappt.');
  }
}
