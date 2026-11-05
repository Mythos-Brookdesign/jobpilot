/**
 * @jest-environment node
 */
import {
  AiApiError,
  AiIncompleteError,
  AiRefusalError,
  type AiService,
} from '@/server/ai-contract';
import { DEMO_POSTING } from '@/domain/demo';
import { createProviderFromEnv } from '@/server/ai-provider';
import { handleAiRequest } from '@/server/handle-ai-request';
import { createRateLimiter } from '@/server/rate-limit';

// Die Provider-Auswahl wird ersetzt: Geprüft wird, wie oft der Handler sie baut.
jest.mock('@/server/ai-provider', () => ({
  createProviderFromEnv: jest.fn(() => mockBuiltService()),
}));

const POSTING =
  'Senior Fullstack Developer (m/w/d) bei Nordlicht Software in Berlin, hybrid. Wir suchen Erfahrung mit React, Node.js und TypeScript. Gehalt 75.000 bis 85.000 Euro. Kontakt: Jana Peters, jana@example.com';

const extraction = {
  company: 'Nordlicht Software',
  role: 'Senior Fullstack Developer',
  location: 'Berlin',
  workMode: 'hybrid',
  salaryMin: 75000,
  salaryMax: 85000,
  skills: ['React', 'Node.js', 'TypeScript'],
  contactName: 'Jana Peters',
  contactEmail: 'jana@example.com',
  summary: 'Fullstack-Stelle mit React und Node.js.',
};

const mockBuiltService = (): AiService => ({ run: async () => extraction as never });

describe('handleAiRequest', () => {
  const post = (body: unknown, ip = '1.2.3.4') =>
    new Request('http://localhost/api/ki/stellenanzeige', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
  const service = (run: AiService['run']): AiService => ({ run });
  const allowAll = () => true;

  it('liefert das Ergebnis als JSON', async () => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: service(async () => extraction as never),
      allow: allowAll,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(extraction);
  });

  it('lehnt zu kurze oder fehlende Eingaben mit verständlicher Meldung ab', async () => {
    const run = jest.fn();
    const response = await handleAiRequest('stellenanzeige', post({ posting: 'kurz' }), {
      service: service(run),
      allow: allowAll,
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Der Text ist zu kurz für eine Stellenanzeige.',
    });
    expect(run).not.toHaveBeenCalled();
  });

  it('verlangt für den Profilabgleich ein Profil', async () => {
    const response = await handleAiRequest('passung', post({ posting: POSTING, profile: ' ' }), {
      service: service(jest.fn()),
      allow: allowAll,
    });
    expect(await response.json()).toEqual({
      error: 'Bitte zuerst dein Profil in den Einstellungen hinterlegen.',
    });
  });

  it('meldet einen fehlenden API-Key, ohne das Modell aufzurufen', async () => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: null,
      allow: allowAll,
    });
    expect(response.status).toBe(503);
  });

  it('begrenzt die Zahl der Anfragen', async () => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: service(jest.fn()),
      allow: () => false,
    });
    expect(response.status).toBe(429);
  });

  it('übersetzt eine Ablehnung des Modells in eine freundliche Meldung', async () => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: service(async () => {
        throw new AiRefusalError();
      }),
      allow: allowAll,
    });
    expect(response.status).toBe(422);
  });
});

describe('handleAiRequest im Demo-Modus', () => {
  const demoPost = (body: unknown) =>
    new Request('http://localhost/api/ki/stellenanzeige', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('lehnt eigene Texte ab, ohne das Modell aufzurufen', async () => {
    const run = jest.fn();
    const response = await handleAiRequest('stellenanzeige', demoPost({ posting: POSTING }), {
      service: { run },
      allow: () => true,
      demoCache: new Map(),
    });
    expect(response.status).toBe(403);
    expect(run).not.toHaveBeenCalled();
  });

  it('beantwortet gleiche Demo-Anfragen aus dem Zwischenspeicher', async () => {
    const run = jest.fn(async () => extraction as never);
    const allow = jest.fn(() => true);
    const deps = { service: { run }, allow, demoCache: new Map<string, unknown>() };

    for (let i = 0; i < 3; i++) {
      const response = await handleAiRequest(
        'stellenanzeige',
        demoPost({ posting: DEMO_POSTING }),
        deps,
      );
      expect(await response.json()).toEqual(extraction);
    }
    expect(run).toHaveBeenCalledTimes(1);
    expect(allow).toHaveBeenCalledTimes(1);
  });
});

describe('handleAiRequest: Status-Mapping des KI-Dienstes', () => {
  const post = (body: unknown) =>
    new Request('http://localhost/api/ki/stellenanzeige', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify(body),
    });
  const failing = (error: Error): AiService => ({
    run: async () => {
      throw error;
    },
  });

  let logged: jest.SpyInstance;
  beforeEach(() => {
    logged = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    logged.mockRestore();
  });

  it.each([
    [429, 429],
    [401, 503],
    [403, 503],
    [500, 502],
    [undefined, 502],
  ])('übersetzt Dienst-Status %s in HTTP %s', async (upstream, expected) => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: failing(new AiApiError(upstream)),
      allow: () => true,
    });
    expect(response.status).toBe(expected);
  });

  it('meldet eine unvollständige Antwort als 502', async () => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: failing(new AiIncompleteError()),
      allow: () => true,
    });
    expect(response.status).toBe(502);
  });

  it('lässt unbekannte Fehler als 500 durch', async () => {
    const response = await handleAiRequest('stellenanzeige', post({ posting: POSTING }), {
      service: failing(new Error('kaputt')),
      allow: () => true,
    });
    expect(response.status).toBe(500);
  });
});

describe('handleAiRequest mit Standard-Abhängigkeiten', () => {
  const build = jest.mocked(createProviderFromEnv);
  const post = (ip: string) =>
    new Request('http://localhost/api/ki/stellenanzeige', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ posting: POSTING }),
    });

  afterEach(() => {
    build.mockImplementation(mockBuiltService);
  });

  it('baut den Provider über mehrere Anfragen nur einmal', async () => {
    const first = await handleAiRequest('stellenanzeige', post('10.0.0.1'));
    const second = await handleAiRequest('stellenanzeige', post('10.0.0.2'));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(extraction);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('merkt sich auch eine fehlende Konfiguration', async () => {
    build.mockReturnValue(null);
    build.mockClear();

    // Frischer Modulzustand: der Zwischenspeicher dieses Tests ist noch leer
    let fresh!: typeof import('@/server/handle-ai-request');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      fresh = require('@/server/handle-ai-request');
    });

    const first = await fresh.handleAiRequest('stellenanzeige', post('10.0.0.3'));
    const second = await fresh.handleAiRequest('stellenanzeige', post('10.0.0.4'));

    expect([first.status, second.status]).toEqual([503, 503]);
    expect(build).toHaveBeenCalledTimes(1);
  });
});

describe('createRateLimiter', () => {
  it('erlaubt bis zur Grenze je Schlüssel und gibt nach Ablauf des Fensters wieder frei', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });

    expect(limiter.allow('a', 0)).toBe(true);
    expect(limiter.allow('a', 100)).toBe(true);
    expect(limiter.allow('a', 200)).toBe(false);
    expect(limiter.allow('b', 200)).toBe(true);
    expect(limiter.allow('a', 1050)).toBe(true);
  });
});
