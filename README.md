# jobpilot

Bewerbungen im Blick behalten: eine App für iOS, Android und Web, mit der man die eigene Jobsuche als Pipeline verwaltet, von der Bewerbung bis zum Angebot.

> Das Projekt befindet sich im Aufbau. Was geplant ist, steht in der [Roadmap](ROADMAP.md).

## Funktionen

- **Pipeline:** Gemerkt → Beworben → Screening → Fachgespräch → Finale Runde → Angebot, dazu Abgesagt und Zurückgezogen; jeder Wechsel wird protokolliert
- **Detailseite** je Bewerbung mit Eckdaten (Gehalt, Arbeitsmodell, Quelle, Link), Terminen, Kontakten, Notizen und Verlauf
- **Übersicht** mit Kennzahlen, nächstem Termin und den Terminen der nächsten 7 Tage
- **Liste** mit Suche, Filtern, Sortierung (gespeichert) und auf breiten Bildschirmen einer Board-Ansicht
- **Auswertung:** Funnel, Antwortquote, Zeit bis zur Rückmeldung, Erfolg je Quelle, Aktivität pro Woche
- **Erinnerungen:** Nachhaken, wenn sich nichts tut, Termine am Vortag und eine Stunde vorher, Dankeschön danach, eigene Erinnerungen – als Benachrichtigung mit „Erledigt“ und „Später“, im Browser in der Übersicht
- **KI-Assistent (Claude):** Stellenanzeige einfügen und Felder vorausfüllen lassen, Passung zum eigenen Profil, Gesprächsvorbereitung, Entwürfe für Anschreiben, Nachfass- und Dankes-Mail
- Lokale Speicherung in SQLite, Backup als JSON (Import und Export), CSV-Export für Excel
- Hell- und Dunkelmodus, native Tabs und Datums-Picker auf iOS und Android, responsive Web-Version

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
  domain/       reine Logik ohne React: Status, Filter, Sortierung, Formulare, Auswertungen,
                Timeline, Backup, CSV
  db/           Schema, Repositories, Datenbankanbindung, Live-Abfragen
  features/     Feature-Module: applications/, insights/, reminders/, ai/, data-transfer/
  server/       nur für API-Routen: Claude-Anbindung, Prompts, Rate-Limit
  ui/           wiederverwendbare Bausteine (Sheet, Formularfeld, Suche, Tabs, Dialoge)
  theme/        Farben für Hell und Dunkel, Hooks für das Farbschema
drizzle/        generierte SQL-Migrationen
patches/        Korrekturen an Abhängigkeiten (patch-package)
```

## Architektur

- **Geschäftslogik in `domain/`:** unabhängig von React und Datenbank, deshalb einfach zu testen.
- **Datenzugriff nur über Repositories** (`src/db/repositories/`). Es arbeitet mit jedem synchronen SQLite-Treiber von Drizzle. In der App ist das expo-sqlite, in den Tests better-sqlite3 im Arbeitsspeicher mit denselben Migrationen. Die Tests prüfen also echtes SQL, keine Mocks.
- **Start:** Die Datenbank wird asynchron geöffnet und migriert, erst danach wird die App angezeigt (`DatabaseProvider`).
- **Live-Aktualisierung:** `useLiveRows` hört auf Änderungen an Tabellen und liest gebündelt einmal neu, auch wenn ein Import hunderte Zeilen schreibt.
- **Web:** SQLite läuft als WebAssembly in einem Worker und speichert im Origin Private File System. Dafür braucht der Server die Header `Cross-Origin-Opener-Policy` und `Cross-Origin-Embedder-Policy` (im Dev-Server über `metro.config.js`, für EAS Hosting in `app.json`).

- **Erinnerungen:** Regeln (`domain/reminders.ts`) erzeugen Erinnerungen mit Schlüsseln, die ihre Grundlage enthalten. Ein Abgleich schreibt sie in die Tabelle `reminders`; ein zweiter Abgleich plant die Systembenachrichtigungen mit diesen Schlüsseln als ID. Beides ist idempotent und läuft nach jeder relevanten Änderung.

- **KI-Assistent:** Die App ruft eigene API-Routen auf (`src/app/api/ki/*+api.ts`); nur dort liegt der API-Key. Anfragen und Antworten sind mit denselben zod-Schemas beschrieben (`src/domain/ai.ts`), Claude liefert per Structured Outputs genau dieses Format. Nutzerinhalte stehen in eigenen Tags und gelten als Daten, nicht als Anweisungen.

### Patch für expo-sqlite

`patches/expo-sqlite+57.0.4.patch` behebt zwei Fehler in der Web-Variante von expo-sqlite:

1. Die Länge synchroner Ergebnisse wurde mit `Uint8Array.set()` geschrieben. Dabei landete nur das unterste Byte im Puffer, und Ergebnisse über 255 Bytes wurden abgeschnitten.
2. Scheiterte das erste Öffnen, weil die Datei noch belegt war (z. B. beim Neuladen), blieb der Worker in einem halb initialisierten Zustand, und jeder weitere Versuch endete in „Invalid VFS state“.

Der Patch wird bei `npm install` automatisch angewendet.

## Starten

Voraussetzung: Node.js 22

```bash
npm install
npm start          # Dev-Server, dann i (iOS), a (Android) oder w (Web)
```

### KI-Assistent einrichten

```bash
cp .env.example .env.local   # ANTHROPIC_API_KEY eintragen
npm start                    # der Dev-Server stellt auch die API-Routen bereit
```

Ohne Key funktioniert die App normal, nur der Assistent meldet, dass er nicht eingerichtet ist.

### Web-Version

```bash
npm run web:preview          # Export und Auslieferung wie in Produktion (inkl. API-Routen)
```

`npm run web` (Dev-Server) scheitert in Expo SDK 57 am SQLite-Worker („Worker chunk not found“) – ein Fehler in Expos Dev-Serializer. Die Vorschau oben ist davon nicht betroffen.

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
