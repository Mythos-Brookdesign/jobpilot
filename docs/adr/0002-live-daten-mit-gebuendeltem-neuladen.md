# 2. Live-Daten mit gebündeltem Neuladen

**Status:** angenommen (Phase 1, erweitert in Phase 2)

## Kontext

Die Oberfläche soll sich nach jeder Änderung selbst aktualisieren – auch wenn die Änderung von woanders kommt (Import, Aktion in einer Benachrichtigung, Erinnerungsabgleich). Drizzles `useLiveQuery` liest bei jeder geänderten Zeile neu: Ein Import mit 50 Bewerbungen löst so über 100 Abfragen und Re-Renders aus.

## Entscheidung

Ein eigener Hook `useLiveData(read, tables, deps)` hört auf die Änderungsmeldungen von SQLite, **bündelt** sie und liest **einmal** neu, sobald die Welle vorbei ist. Er nimmt eine beliebige Lesefunktion (Liste, Einzelobjekt, zusammengesetzte Daten) und die Tabellen, die sie betrifft.

## Konsequenzen

- Screens lesen direkt über Repositories, ohne globalen State-Container.
- Die Liste der beobachteten Tabellen muss zur Lesefunktion passen – ein vergessener Tabellenname führt zu veralteten Anzeigen. Das ist bewusst explizit gehalten.
