import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import type { AiService } from '@/server/ai-contract';
import { createAnthropicService } from '@/server/anthropic-service';
import { OPENAI_MODEL, createOpenAiService } from '@/server/openai-service';

/** Die gelesenen Variablen; Tests reichen ein eigenes Objekt statt `process.env` */
type AiEnv = Record<string, string | undefined>;

/**
 * Baut aus der Server-Konfiguration den passenden KI-Service.
 * null bedeutet: kein Provider eingerichtet – der Assistent antwortet mit 503,
 * die App und der Server starten trotzdem normal.
 */
export function createProviderFromEnv(env: AiEnv = process.env): AiService | null {
  // Großschreibung und Leerzeichen ignorieren: ein Kopierfehler soll nicht zur 503 führen
  const provider = (env.AI_PROVIDER?.trim() || 'anthropic').toLowerCase();

  if (provider === 'anthropic') {
    const apiKey = env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) return null;
    return createAnthropicService(new Anthropic({ apiKey }));
  }

  if (provider === 'openai') {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    // baseURL zeigt auf OpenAI-kompatible Dienste; ohne Angabe gilt der OpenAI-Standard
    const baseURL = env.OPENAI_BASE_URL?.trim() || undefined;
    const model = env.OPENAI_MODEL?.trim() || OPENAI_MODEL;
    return createOpenAiService(new OpenAI({ apiKey, baseURL }), model);
  }

  console.error(
    `KI-Konfiguration: Unbekannter AI_PROVIDER "${provider}". Erlaubt sind "anthropic" (Standard) und "openai".`,
  );
  return null;
}
