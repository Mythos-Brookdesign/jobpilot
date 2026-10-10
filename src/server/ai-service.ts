import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod';

import { responseSchemas, type AiAction, type AiResponse, type requestSchemas } from '@/domain/ai';
import { PROMPTS } from '@/server/prompts';

export const AI_MODEL = 'claude-opus-5-5';

/**
 * Aufwand je Aufgabe: Das Übernehmen einer Anzeige ist Extraktion (low), Abgleich,
 * Vorbereitung und Texte brauchen mehr Urteilsvermögen (medium).
 */
const EFFORT: Record<AiAction, 'low' | 'medium'> = {
  stellenanzeige: 'low',
  passung: 'medium',
  vorbereitung: 'medium',
  entwurf: 'medium',
};

/** Das Modell hat die Anfrage aus Sicherheitsgründen abgelehnt */
export class AiRefusalError extends Error {}
/** Antwort kam nicht vollständig oder nicht im erwarteten Format an */
export class AiIncompleteError extends Error {}

type MessagesClient = Pick<Anthropic, 'beta'>;

export function createAiService(client: MessagesClient) {
  return {
    async run<A extends AiAction>(
      action: A,
      input: z.infer<(typeof requestSchemas)[A]>,
    ): Promise<AiResponse<A>> {
      const { system, user } = PROMPTS[action](input);
      // Gestreamt: Längere Antworten (z. B. die Gesprächsvorbereitung) brauchen über eine
      // Minute – ohne laufenden Datenfluss brechen Server-Laufzeiten solche Anfragen ab
      const stream = client.beta.messages.stream({
        model: AI_MODEL,
        max_tokens: 16000,
        // Lehnt das Modell ab, springt serverseitig ein passendes Ersatzmodell ein
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: EFFORT[action],
          format: betaZodOutputFormat(responseSchemas[action]),
        },
        system,
        messages: [{ role: 'user', content: user }],
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === 'refusal') throw new AiRefusalError();
      if (message.stop_reason === 'max_tokens' || !message.parsed_output) {
        throw new AiIncompleteError();
      }
      return message.parsed_output as AiResponse<A>;
    },
  };
}

export type AiService = ReturnType<typeof createAiService>;
