# 1. Lokale Daten mit SQLite und Drizzle

**Status:** angenommen (Phase 1)

## Kontext

Bewerbungsdaten sind persönlich: Gehälter, Ansprechpartner, Notizen aus Gesprächen. Die App soll ohne Konto und ohne Server funktionieren, auf iOS, Android und im Browser – und mit wachsendem Funktionsumfang ihr Datenmodell weiterentwickeln, ohne vorhandene Daten zu verlieren.

## Entscheidung

- **SQLite über `expo-sqlite`** als einzige Datenhaltung, im Browser als WebAssembly mit Speicherung im Origin Private File System.
- **Drizzle ORM** für typisierte Abfragen und **versionierte Migrationen** (`drizzle/`), die beim App-Start laufen.
- Datenzugriff ausschließlich über **Repositories** (`src/db/repositories/`), die gegen den gemeinsamen Typ aller synchronen Drizzle-Treiber geschrieben sind.
- Tests laufen mit **better-sqlite3** gegen dieselben Repositories und Migrationen – echtes SQL statt Mocks.

## Konsequenzen

- Keine Synchronisierung zwischen Geräten; Umzug und Sicherung über JSON-Export und -Import (versioniertes Backup-Format mit Umwandlung älterer Versionen).
- Schemaänderungen sind Migrationen; bereits ausgelieferte Migrationen werden nie geändert. Datenmigrationen (z. B. die Umbenennung eines Status in Phase 2) werden von Hand ergänzt und mit einem Test gegen Daten im alten Format abgesichert.
- Die Web-Variante von expo-sqlite ist neuer als die native – siehe [ADR 4](0004-patches-fuer-expo-sqlite.md).
