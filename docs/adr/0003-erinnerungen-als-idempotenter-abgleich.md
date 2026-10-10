# 3. Erinnerungen als idempotenter Abgleich

**Status:** angenommen (Phase 3)

## Kontext

Erinnerungen hängen von vielen Dingen ab: Status, letzte Statusänderung, Termine, Einstellungen, Zeit. Termine werden verschoben, Bewerbungen abgesagt, Erinnerungen erledigt oder verschoben. Systembenachrichtigungen müssen dazu passen – ohne Duplikate und ohne verwaiste Benachrichtigungen.

## Entscheidung

- **Regeln als reine Funktion** (`planReminders`) berechnen, welche Erinnerungen gerade gelten.
- Jede Erinnerung hat einen **Schlüssel, der ihre Grundlage enthält** (z. B. Termin-ID und Startzeit). Ändert sich die Grundlage, entsteht ein neuer Schlüssel; die alte Erinnerung entfällt automatisch.
- Ein **Abgleich** (`diffReminders`) schreibt die Tabelle `reminders` – die Quelle der Wahrheit. Erledigt- und Später-Status bleiben bei gleichem Schlüssel erhalten, eigene Erinnerungen werden nie angefasst.
- Ein zweiter **Abgleich** (`planSchedule`) plant die lokalen Benachrichtigungen; ihre ID ist der Erinnerungsschlüssel.
- Beides läuft nach jeder relevanten Datenänderung, beim Start und beim Zurückkehren in die App.

## Konsequenzen

- Mehrfaches Ausführen ändert nichts – keine Duplikate, keine Endlosschleife (der Abgleich meldet, ob er etwas geschrieben hat).
- Keine Sonderfall-Logik beim Bearbeiten von Terminen oder Status; alles ergibt sich aus dem neuen Zustand.
- Lokale Benachrichtigungen statt Push: kein Server nötig, funktioniert auch in Expo Go. Im Browser erscheinen fällige Erinnerungen in der App.
