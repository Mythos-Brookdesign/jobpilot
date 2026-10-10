import { AiRequestError, callAi } from '@/features/ai/client';

const draft = { subject: 'Danke für das Gespräch', body: 'Hallo …' };
const payload = { kind: 'dankeschoen' as const, company: 'Nordlicht', role: 'Dev' };

function fakeFetch(status: number, body: unknown) {
  return jest.fn(
    async () => new Response(JSON.stringify(body), { status }),
  ) as unknown as typeof fetch;
}

describe('callAi', () => {
  it('schickt die Anfrage an die passende Route und liefert die geprüfte Antwort', async () => {
    const fetchImpl = fakeFetch(200, draft);

    await expect(callAi('entwurf', payload, fetchImpl)).resolves.toEqual(draft);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/ki/entwurf',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    );
  });

  it('reicht die Fehlermeldung des Servers durch', async () => {
    await expect(
      callAi('entwurf', payload, fakeFetch(429, { error: 'Zu viele Anfragen.' })),
    ).rejects.toThrow(new AiRequestError('Zu viele Anfragen.'));
  });

  it('lehnt Antworten im falschen Format ab', async () => {
    await expect(callAi('entwurf', payload, fakeFetch(200, { text: 'x' }))).rejects.toThrow(
      'unerwartetes Format',
    );
  });

  it('meldet fehlende Verbindung verständlich', async () => {
    const offline = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(callAi('entwurf', payload, offline)).rejects.toThrow('Bist du online?');
  });
});
