import {
  errorSchema,
  responseSchemas,
  type AiAction,
  type AiRequest,
  type AiResponse,
} from '@/domain/ai';

// Ruft die KI-Routen des eigenen Servers auf. Relative URLs gehen in der Entwicklung an den
// Dev-Server; für die veröffentlichte App setzt `origin` im expo-router-Plugin die Adresse.

export class AiRequestError extends Error {}

export async function callAi<A extends AiAction>(
  action: A,
  payload: AiRequest<A>,
  fetchImpl: typeof fetch = fetch,
): Promise<AiResponse<A>> {
  let response: Response;
  try {
    response = await fetchImpl(`/api/ki/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AiRequestError('Keine Verbindung zum KI-Assistenten. Bist du online?');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(body);
    throw new AiRequestError(parsed.success ? parsed.data.error : 'Das hat leider nicht geklappt.');
  }

  // Auch die eigene API wird geprüft: Die App verlässt sich nur auf gültige Daten
  const parsed = responseSchemas[action].safeParse(body);
  if (!parsed.success) throw new AiRequestError('Die Antwort hatte ein unerwartetes Format.');
  return parsed.data as AiResponse<A>;
}
