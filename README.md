# jobpilot

Bewerbungen im Blick behalten: eine App für iOS, Android und Web, mit der man die eigene Jobsuche als Pipeline verwaltet, von der Bewerbung bis zum Angebot.

> Das Projekt befindet sich im Aufbau. Was geplant ist, steht in der [Roadmap](ROADMAP.md).

## Funktionen

- Übersicht mit Kennzahlen (aktive Bewerbungen, Gespräche, Angebote) und dem nächsten Schritt
- Bewerbungsliste mit Suche und Filter nach Status
- Bewerbungen anlegen und den Status aktualisieren
- Hell- und Dunkelmodus, native Tabs auf iOS und Android, eigene Navigation im Web

## Tech-Stack

- [Expo](https://expo.dev) SDK 57, React Native 0.86, React 19 mit React Compiler
- Expo Router (dateibasiertes Routing, typisierte Routen, native Tabs)
- TypeScript (strict)
- Jest mit `jest-expo` und React Native Testing Library
- ESLint und Prettier, CI über GitHub Actions

## Projektstruktur

```
src/
  app/          Routen (Expo Router) – jede Datei ist ein Screen
  domain/       reine Logik ohne React: Typen, Status, Filter, Kennzahlen
  features/     Feature-Module mit Komponenten und State (z. B. applications/)
  ui/           wiederverwendbare Bausteine (Sheet, Formularfeld, Suche, Tabs)
  theme/        Farben für Hell und Dunkel, Hooks für das Farbschema
```

Die Geschäftslogik liegt bewusst in `domain/`. Sie ist unabhängig von React und der Oberfläche und deshalb einfach zu testen.

## Starten

Voraussetzung: Node.js 22

```bash
npm install
npm start          # Dev-Server, dann i (iOS), a (Android) oder w (Web)
```

## Qualität

```bash
npm run lint       # ESLint und Prettier
npm run typecheck  # TypeScript
npm test           # Jest
npm run check      # alles zusammen, wie in der CI
```
