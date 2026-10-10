import { useRouter, type Href } from 'expo-router';

/**
 * Schließt ein Modal bzw. geht zurück. Wurde die Seite direkt aufgerufen (z. B. per Link im
 * Browser), gibt es kein „Zurück“ – dann geht es zur angegebenen Seite.
 */
export function useGoBack(fallback: Href) {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(fallback));
}
