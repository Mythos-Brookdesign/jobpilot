# jobpilot

Bewerbungen im Blick behalten: eine App für iOS, Android und Web, mit der man die eigene Jobsuche als Pipeline verwaltet, von der Bewerbung bis zum Angebot.

> Das Projekt befindet sich im Aufbau. Was geplant ist, steht in der [Roadmap](ROADMAP.md).

## Funktionen

- Übersicht mit Kennzahlen (aktive Bewerbungen, Gespräche, Angebote) und dem nächsten Schritt
- Bewerbungsliste mit Suche und Filter nach Status
- Bewerbungen anlegen, Status aktualisieren, löschen mit „Rückgängig“
- Lokale Speicherung in SQLite, jede Statusänderung wird protokolliert
- Backup als JSON exportieren und importieren, Export als CSV für Excel
- Hell- und Dunkelmodus, native Tabs auf iOS und Android, eigene Navigation im Web

## Tech-Stack

- [Expo](https://expo.dev) SDK 57, React Native 0.86, React 19 mit React Compiler
- Expo Router (dateibasiertes Routing, typisierte Routen, native Tabs)
- SQLite über `expo-sqlite` und [Drizzle ORM](https://orm.drizzle.team), im Browser per WebAssembly
- TypeScript (strict), zod für die Prüfung importierter Daten
- Jest mit `jest-expo` und React Native Testing Library, better-sqlite3 für Datenbanktests
- ESLint und Prettier, CI über GitHub Actions

## Projektstruktur

```
src/
  app/          Routen (Expo Router) – jede Datei ist ein Screen
  domain/       reine Logik ohne React: Typen, Status, Filter, Kennzahlen, Backup, CSV
  db/           Schema, Repository, Datenbankanbindung, Live-Abfragen
  features/     Feature-Module mit Komponenten und State (applications/, data-transfer/)
  ui/           wiederverwendbare Bausteine (Sheet, Formularfeld, Suche, Tabs, Dialoge)
  theme/        Farben für Hell und Dunkel, Hooks für das Farbschema
drizzle/        generierte SQL-Migrationen
patches/        Korrekturen an Abhängigkeiten (patch-package)
```

## Architektur

- **Geschäftslogik in `domain/`:** unabhängig von React und Datenbank, deshalb einfach zu testen.
- **Datenzugriff nur über das Repository** (`src/db/applications-repository.ts`). Es arbeitet mit jedem synchronen SQLite-Treiber von Drizzle. In der App ist das expo-sqlite, in den Tests better-sqlite3 im Arbeitsspeicher mit denselben Migrationen. Die Tests prüfen also echtes SQL, keine Mocks.
- **Start:** Die Datenbank wird asynchron geöffnet und migriert, erst danach wird die App angezeigt (`DatabaseProvider`).
- **Live-Aktualisierung:** `useLiveRows` hört auf Änderungen an Tabellen und liest gebündelt einmal neu, auch wenn ein Import hunderte Zeilen schreibt.
- **Web:** SQLite läuft als WebAssembly in einem Worker und speichert im Origin Private File System. Dafür braucht der Server die Header `Cross-Origin-Opener-Policy` und `Cross-Origin-Embedder-Policy` (im Dev-Server über `metro.config.js`, für EAS Hosting in `app.json`).

### Patch für expo-sqlite

`patches/expo-sqlite+57.0.4.patch` behebt einen Fehler in der Web-Variante von expo-sqlite: Die Länge synchroner Ergebnisse wurde mit `Uint8Array.set()` geschrieben. Dabei landete nur das unterste Byte im Puffer, und Ergebnisse über 255 Bytes wurden abgeschnitten. Der Patch wird bei `npm install` automatisch angewendet.

## Starten

Voraussetzung: Node.js 22

```bash
npm install
npm start          # Dev-Server, dann i (iOS), a (Android) oder w (Web)
```

## Datenbank

```bash
# nach Änderungen an src/db/schema.ts die nächste Migration erzeugen
npm run db:generate -- --name kurze-beschreibung
```

Migrationen werden beim App-Start automatisch angewendet.

## Qualität

```bash
npm run lint       # ESLint und Prettier
npm run typecheck  # TypeScript
npm test           # Jest
npm run check      # alles zusammen, wie in der CI
```
