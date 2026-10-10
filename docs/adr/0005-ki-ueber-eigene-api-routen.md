# 5. KI über eigene API-Routen

**Status:** angenommen (Phase 4, Demo-Modus in Phase 5)

## Kontext

Der KI-Assistent braucht einen Anthropic-API-Key. Ein Key in der App wäre für jeden auslesbar. Die Antworten sollen direkt Formulare füllen – sie müssen also verlässlich strukturiert sein. Anzeigentexte stammen aus fremden Quellen und können Anweisungen enthalten.

## Entscheidung

- **Expo Router API Routes** (`src/app/api/ki/*+api.ts`, `web.output: "server"`): Der Key existiert nur auf dem Server.
- **Gemeinsame zod-Schemas** (`src/domain/ai.ts`) für Anfragen und Antworten; Claude liefert über **Structured Outputs** genau dieses Format. Der Server prüft die Eingaben, die App die Antworten.
- **Claude Opus 5.5** mit Aufwand je Aufgabe (`low` für Extraktion, `medium` sonst), **serverseitige Fallbacks** bei Ablehnungen, **Streaming**, damit längere Antworten nicht an Zeitlimits der Server-Laufzeit scheitern.
- Nutzerinhalte stehen in eigenen Tags und gelten im System-Prompt ausdrücklich als **Daten, nicht als Anweisungen**.
- Größenlimits, Rate-Limit, Einwilligung vor der ersten Nutzung.
- **Öffentliche Demo:** Mit `JOBPILOT_DEMO=1` nimmt der Server nur Anfragen an, die aus den Demo-Inhalten bestehen, und beantwortet gleiche Anfragen aus einem Zwischenspeicher. So lässt sich der Assistent ausprobieren, ohne dass beliebige Texte auf fremde Kosten verarbeitet werden.

## Konsequenzen

- Die native App braucht für den Assistenten eine erreichbare Server-Adresse (`origin` im expo-router-Plugin).
- Ohne Key läuft die App normal; nur der Assistent meldet, dass er nicht eingerichtet ist.
- Die harte Kostengrenze ist das Ausgabenlimit in der Anthropic Console; das Rate-Limit gilt je Server-Instanz.
