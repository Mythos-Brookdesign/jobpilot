# 4. Patches für expo-sqlite (Web)

**Status:** angenommen (Phase 1 und 2) – entfällt, sobald die Fehler upstream behoben sind

## Kontext

Die Web-Variante von expo-sqlite 57.0.4 hatte zwei Fehler, die beim Testen im Browser auftraten:

1. **Abgeschnittene Ergebnisse:** Synchrone Ergebnisse werden über einen geteilten Puffer übertragen. Die Länge wurde mit `Uint8Array.set(new Uint32Array([length]))` geschrieben – dabei landet nur das unterste Byte im Puffer. Jedes Ergebnis über 255 Bytes kam abgeschnitten an („Unterminated string in JSON“).
2. **Kein zweiter Versuch möglich:** Scheiterte das Öffnen, weil die vorherige Seite die Datei noch hielt (Neuladen), blieb der Worker halb initialisiert; jeder weitere Versuch endete in „Invalid VFS state“.

## Entscheidung

Beide Fehler werden mit **patch-package** behoben (`patches/expo-sqlite+57.0.4.patch`), der Patch läuft bei jedem `npm install`. Die App öffnet die Datenbank asynchron und wiederholt das Öffnen bei belegter Datei; ist die App wirklich in einem zweiten Tab offen, erscheint eine verständliche Meldung.

## Konsequenzen

- Beim Update von expo-sqlite muss geprüft werden, ob der Patch noch passt bzw. noch nötig ist (patch-package meldet Abweichungen).
- Die Fehler sollten upstream gemeldet werden; danach kann der Patch entfallen.
