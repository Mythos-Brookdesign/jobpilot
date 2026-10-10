/**
 * Einfaches gleitendes Fenster je Schlüssel (z. B. IP-Adresse). Gilt pro Server-Instanz –
 * als Schutz gegen versehentliche Schleifen und grobe Missbräuche. Die harte Grenze ist das
 * Ausgabenlimit in der Anthropic Console.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** true, wenn die Anfrage erlaubt ist (und zählt sie) */
    allow(key: string, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
