# jobpilot – Roadmap

Ziel: Aus dem Klick-Prototyp wird eine App, die zeigt, wie ein Senior-Entwickler arbeitet. Dazu gehören Daten, die erhalten bleiben, durchdachte Architektur, echte native Funktionen, ein KI-Feature mit Nutzen, Tests und CI sowie eine Demo, die Recruiter ohne Installation ausprobieren können.

Stand heute: Phase 0 bis 4 sind abgeschlossen. Bewerbungen werden in SQLite gespeichert (iOS, Android und Browser) – mit erweiterter Pipeline, Detailseite, Kontakten, Notizen, Terminen, Auswertung, Board-Ansicht, Erinnerungen mit Benachrichtigungen, KI-Assistent (Claude) sowie Export und Import.

---

## Phase 0 – Aufräumen und Fundament

Bevor neue Funktionen dazukommen, soll das Repo nicht mehr nach Template aussehen.

- [x] Bisherigen Stand committen
- [x] Template-Reste entfernen: `hint-row`, `web-badge`, `ui/collapsible`, `scripts/reset-project.js`, ungenutzte Assets
- [x] Route `explore.tsx` in `bewerbungen.tsx` umbenennen
- [x] Eigenes Branding: App-Icon, Splash-Farbe (aktuell Expo-Blau `#208AEF`), Android-Icon-Hintergrund
- [x] Ordnerstruktur nach Features statt nach Dateityp:
  ```
  src/
    app/                 # nur Routen (Expo Router)
    features/
      applications/      # Komponenten, Hooks, Logik der Bewerbungen
      reminders/
      insights/
      ai/
    db/                  # Schema, Migrationen, Repositories
    domain/              # reine Logik ohne React (Status-Übergänge, Regeln, Statistiken)
    ui/                  # wiederverwendbare Bausteine (Badge, Sheet, Button, FormField)
    theme/
  ```
- [x] Interne Schlüssel auf Englisch, Anzeigetexte über eine Zuordnung, z. B. `status: 'interview'` → „Gespräch“. Das ist die Voraussetzung für Mehrsprachigkeit und stabile Daten.
- [x] Farben vollständig über das Theme: Das Panel „Dein nächster Schritt“ und die Trennlinien haben aktuell feste helle Farben und passen nicht zum Dark Mode
- [x] Tooling: TypeScript `strict`, ESLint, Prettier, `jest-expo` und React Native Testing Library
- [x] GitHub Actions: `lint`, `tsc --noEmit` und `test` bei jedem Push und Pull Request

**Fertig, wenn:** Die CI ist grün, im Repo ist kein Template-Code mehr, und Dark Mode funktioniert durchgängig.

---

## Phase 1 – Datenmodell und Speicherung ✅

**Technik:** `expo-sqlite` mit **Drizzle ORM** (stabile 0.45) und `drizzle-kit` für typisierte Abfragen und versionierte Migrationen.

### Umgesetzt

- [x] Tabellen `applications` und `status_events` mit Indizes und Fremdschlüssel (Migration `drizzle/0000_init.sql`)
- [x] Jede Statusänderung wird protokolliert, auch das Anlegen. Das ist die Grundlage für Timeline und Auswertungen.
- [x] Repository-Schicht (`src/db/applications-repository.ts`) kapselt alle Datenbankzugriffe. Screens kennen kein SQL.
- [x] Dasselbe Repository läuft in der App (expo-sqlite) und in den Tests (better-sqlite3 im Arbeitsspeicher, mit denselben Migrationen)
- [x] Datenbank wird beim Start asynchron geöffnet und migriert (`DatabaseProvider`), der Splash bleibt so lange stehen
- [x] Live-Aktualisierung mit eigenem Hook `useLiveRows`: bündelt Änderungsmeldungen und liest einmal neu, statt pro geänderter Zeile
- [x] Löschen mit „Rückgängig“ (Soft Delete über `archivedAt`)
- [x] Backup als JSON exportieren und importieren (mit zod geprüft, verständliche Fehlermeldungen), CSV-Export für Excel
- [x] Leerer Zustand beim ersten Start mit „Beispieldaten laden“, neuer Tab „Einstellungen“
- [x] **Web:** SQLite läuft auch im Browser (WebAssembly, Daten in OPFS). Dafür nötig waren:
  - Metro-Konfiguration für `.wasm` und die Header COOP/COEP (Dev-Server und `app.json` für EAS Hosting)
  - asynchrones Öffnen, weil ein synchrones Öffnen beim Laden des Moduls den Worker blockiert
  - ein Patch für einen Fehler in expo-sqlite 57.0.4 (`patches/`): synchrone Ergebnisse über 255 Bytes wurden abgeschnitten (ein zweiter folgte in Phase 2)

### Bewusst verschoben

- Tabellen `contacts`, `notes`, `appointments`, `reminders` kommen mit den Phasen, die sie brauchen (2 und 3), jeweils als eigene Migration
- Zusätzliche Felder für `applications` (Arbeitsmodell, Quelle, Gehalt, Link …) kommen mit dem Bearbeiten-Formular in Phase 2
- `expo-sqlite/kv-store` für Einstellungen kommt mit der Einstellungsseite für Erinnerungen in Phase 3
- Die beiden expo-sqlite-Fehler sollten als Issue bzw. Pull Request an Expo gemeldet werden. Danach kann der Patch entfallen.

---

## Phase 2 – Funktionsumfang ✅

### Bewerbungen

- [x] **Eigene Detailseite** als Route `/bewerbung/[id]` – Grundlage für Deep Links aus Benachrichtigungen (Phase 3)
- [x] Bearbeiten aller Felder in einem gemeinsamen Formular für „Neu“ und „Bearbeiten“, Validierung mit zod und Meldung pro Feld
- [x] Löschen mit „Rückgängig“ als Hinweis über allen Screens
- [x] Erweiterte Pipeline: _Gemerkt → Beworben → Screening → Fachgespräch → Finale Runde → Angebot_ sowie _Abgesagt / Zurückgezogen_; Status direkt auf der Detailseite wählbar
- [x] **Timeline** aus Statusänderungen, Notizen und Terminen
- [x] Kontakte (mit E-Mail, Anruf, LinkedIn) und Notizen pro Bewerbung
- [x] Termine (Art, Zeitpunkt, Ort/Link, Notizen) mit nativem Datums-Picker auf iOS, Android und im Browser
- [x] Link zur Stellenanzeige, Gehaltsrahmen, Arbeitsmodell, Priorität, Quelle (mit Vorschlägen)
- [x] Filter nach Gruppen mit Anzahl, Sortierung (neueste, Priorität, nächster Termin); beides bleibt gespeichert
- [x] Liste mit `FlatList`

### Übersicht (Dashboard)

- [x] Nächster Termin im Fokus, darunter die Termine der nächsten 7 Tage
- [x] Die Kennzahlen öffnen die passend gefilterte Liste

### Auswertung (neuer Tab)

- [x] Funnel nach höchster erreichter Stufe (eine Absage nach dem Fachgespräch zählt beim Fachgespräch mit)
- [x] Antwortquote, durchschnittliche Zeit bis zur ersten Rückmeldung, Erfolg je Quelle
- [x] Abgeschickte Bewerbungen pro Kalenderwoche
- Berechnung als reine, getestete Funktionen in `domain/insights.ts`; Diagramme ohne Bibliothek, Farben auf Kontrast geprüft

### Tablet und Web

- [x] Ab 900 px Breite eine **Board-Ansicht** (Spalte je Status)
- [x] Responsive Web-Navigation

### Datenbank

- [x] Migration `0001` mit neuen Feldern und Tabellen; bestehende Daten werden übernommen (inkl. Umbenennung „sent“ → „applied“), per Test gegen echte Daten aus Phase 1 abgesichert
- [x] Backup-Format Version 2 mit Kontakten, Notizen und Terminen; Backups der Version 1 werden beim Import umgewandelt
- [x] Zweiter Patch für expo-sqlite: Nach einem fehlgeschlagenen Öffnen (Datei noch von der vorherigen Seite belegt) war die Datenbank bis zum Neuladen unbrauchbar. Jetzt wird das Öffnen wiederholt; ist die App in einem zweiten Tab offen, gibt es eine verständliche Meldung.

### Bewusst verschoben

- Liste und Detail nebeneinander auf breiten Bildschirmen (Master-Detail) – das Board deckt den Überblick ab; kommt bei Bedarf in Phase 5 mit der Web-Demo
- Status per Drag & Drop auf dem Board ändern – der Status lässt sich auf der Detailseite mit einem Tippen setzen

---

## Phase 3 – Erinnerungen ✅

**Technik:** `expo-notifications` mit lokalen, zeitgesteuerten Benachrichtigungen (funktionieren auch in Expo Go, kein Server nötig).

### Regeln (`src/domain/reminders.ts`, voll getestet)

| Auslöser                                                                                                    | Erinnerung                                   |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Laufende Bewerbung, X Tage ohne Statusänderung, kein Termin in Sicht (Standard 10, wählbar: aus, 7, 10, 14) | „Nachhaken bei {Firma}?“ um 9 Uhr            |
| Termin                                                                                                      | Am Vortag um 18 Uhr und 1 Stunde vorher      |
| Nach einem Termin                                                                                           | Am nächsten Morgen: „Dankeschön an {Firma}?“ |
| Eigene Erinnerung                                                                                           | frei wählbarer Zeitpunkt und Text            |

### Umgesetzt

- [x] Tabelle `reminders` als Quelle der Wahrheit (Migration `0002`). Der Schlüssel enthält die Grundlage, z. B. Termin-ID und Startzeit. Verschiebt sich ein Termin, entsteht automatisch eine neue Erinnerung, und die alte entfällt.
- [x] Abgleich als reine Funktion (`diffReminders`): Erledigt und Später bleiben erhalten, eigene Erinnerungen werden nie angefasst. Zweimal ausführen ändert nichts – keine Endlosschleife.
- [x] Systembenachrichtigungen werden abgeglichen statt neu angelegt: Die ID der Benachrichtigung ist der Erinnerungsschlüssel. Fremde Benachrichtigungen bleiben unberührt (`planSchedule`, getestet).
- [x] Abgleich beim Start, nach Datenänderungen (gebündelt) und wenn die App wieder in den Vordergrund kommt
- [x] **Aktionen in der Benachrichtigung:** „Erledigt“ und „In 3 Tagen erneut“; Antippen öffnet die Bewerbung – auch wenn die App vorher geschlossen war
- [x] Erlaubnis erst nach einer Erklärung in der App (Hinweiskarte, sobald es Erinnerungen gibt, oder in den Einstellungen); bei abgelehnter Erlaubnis Weg in die Systemeinstellungen
- [x] Einstellungen: Benachrichtigungen ein/aus, Nachhaken-Abstand, Termin- und Dankeschön-Erinnerungen
- [x] In der App: „Heute fällig“ in der Übersicht, Erinnerungen je Bewerbung auf der Detailseite
- [x] Browser: keine Systembenachrichtigungen, fällige Erinnerungen erscheinen in der Übersicht
- [x] Android: eigener Benachrichtigungskanal, Icon und Farbe

### Bewusst verschoben

- Ruhezeiten: Die Regeln nutzen feste, ruhige Uhrzeiten (9 Uhr, 18 Uhr); nur „eine Stunde vorher“ richtet sich nach dem Termin
- Frist für ein Angebot als eigenes Feld – bis dahin über eine eigene Erinnerung
- Eigene Erinnerungen sind noch nicht im Backup enthalten (Regel-Erinnerungen entstehen nach einem Import automatisch neu); kommt mit der nächsten Backup-Version

---

## Phase 4 – KI-Assistent ✅

### Funktionen

- [x] **Stellenanzeige übernehmen:** Text einfügen → Claude füllt Firma, Position, Ort, Arbeitsmodell, Gehalt und Ansprechperson als Formular vor; Zusammenfassung und geforderte Skills zum Prüfen; gespeichert wird erst nach Bestätigung (als „Gemerkt“, Ansprechperson als Kontakt)
- [x] **Passung zum Profil:** Profil (z. B. Lebenslauf als Text) einmal in den Einstellungen hinterlegen → Einschätzung, was passt, Lücken, was im Gespräch zu betonen ist
- [x] **Gesprächsvorbereitung:** 6–8 wahrscheinliche Fragen mit Begründung und Stichpunkten, dazu gute Rückfragen
- [x] **Entwürfe:** Anschreiben, Nachfass-Mail, Dankes-Mail – mit Ansprechperson, Anzeige, Profil und optionalem Kontext
- [x] Ergebnisse kopieren oder als Notiz speichern; Anzeigentext als eigenes Feld der Bewerbung (Migration `0003`)

### Architektur

- [x] API-Key nur auf dem Server: **Expo Router API Routes** (`src/app/api/ki/*+api.ts`), `web.output: "server"`
- [x] Gemeinsame zod-Schemas für Anfragen und Antworten (`src/domain/ai.ts`): Der Server prüft die Eingaben, die App prüft die Antworten; Claude liefert über **Structured Outputs** genau dieses Format
- [x] Modell Claude Opus 5.5; Aufwand `low` für die Extraktion, `medium` für Abgleich, Vorbereitung und Texte; serverseitige Fallbacks bei Ablehnungen (`fallbacks: "default"`)
- [x] Gestreamte Anfragen – sonst brechen längere Antworten (Vorbereitung > 30 s) in der Server-Laufzeit ab
- [x] Nutzerinhalte in eigenen Tags und ausdrücklich als Daten markiert (Schutz vor Prompt-Injection über Anzeigentexte)
- [x] Größenlimits, Rate-Limit je IP, verständliche Fehlermeldungen; ohne API-Key meldet der Server das klar
- [x] Einwilligung vor der ersten Nutzung, jederzeit in den Einstellungen widerrufbar; Profil bleibt auf dem Gerät
- [x] Tests mit nachgebautem Anthropic-Client (Modell, Fallback, Datenkennzeichnung, Fehlerfälle) und für den App-Client; einmal echt gegen Claude getestet

### Bewusst verschoben

- **Teilen in die App** (Anzeige aus LinkedIn/Browser per „Teilen“ an jobpilot) – braucht ein Config-Plugin und einen Development Build
- **Native App gegen den Server in Produktion:** In der Entwicklung gehen die Aufrufe an den Dev-Server; für die veröffentlichte App wird in Phase 5 die Hosting-Adresse als `origin` im expo-router-Plugin gesetzt
- **Bekannte Einschränkung:** `npm run web` (Dev-Server) scheitert in Expo SDK 57 mit „Worker chunk not found“ für den SQLite-Worker – ein Fehler in Expos Dev-Serializer, nicht im Projekt. Die Web-Version wird mit `npm run web:preview` (Export + `expo serve`) getestet, genau wie sie später ausgeliefert wird.

---

## Phase 5 – Die Hürde für Recruiter senken

Recruiter installieren keine App. Sie klicken einen Link an und schauen 60 Sekunden.

- [ ] **Web-Demo auf EAS Hosting** (eigene Domain, z. B. `jobpilot.marco.dev`), responsiv mit Kanban-Ansicht auf dem Desktop
- [ ] **Demo-Modus:** realistische Beispieldaten (Entwickler-Stellen statt Designer-Stellen), Banner „Demo: Deine Daten bleiben lokal im Browser“, Button „Demo zurücksetzen“
- [ ] Die KI-Übernahme in der Demo mit einer Beispiel-Stellenanzeige zum Ausprobieren, eng begrenzt durch das Rate-Limit
- [ ] Seite **„Über dieses Projekt“** in der App: Problem, Architektur, Stack, Links zu GitHub und zum Portfolio
- [ ] **README** als Schaufenster:
  - Ein Satz zum Problem, GIF und Screenshots (iOS, Android, Web)
  - Link zur Live-Demo und QR-Code für Expo Go bzw. EAS Update
  - Architekturdiagramm (Datenfluss App → Repository → SQLite, App → API Route → Claude)
  - Wichtige Entscheidungen kurz begründet (warum SQLite und Drizzle, warum lokale Benachrichtigungen, warum API Routes)
  - So startest du das Projekt, so laufen die Tests
- [ ] Entscheidungen zusätzlich als kurze ADRs in `docs/adr/`
- [ ] **Im Portfolio** den Platzhalter „[Projektname App]“ in `portfolio/src/data/profile.ts` durch jobpilot ersetzen, mit Screenshot, Live-Link und GitHub-Link
- [ ] Optional: TestFlight-Beta oder interne Android-Testversion über EAS Submit

**Fertig, wenn:** Ein Recruiter kann vom Portfolio aus mit einem Klick die laufende App im Browser ausprobieren.

---

## Phase 6 – Qualität, die man sieht

Diese Punkte laufen begleitend mit. Sie zeigen vor allem erfahrenen Reviewern, dass hier ein Senior arbeitet.

- [ ] **Tests**
  - Unit-Tests: Statusübergänge, Erinnerungsregeln, Statistiken, Parser für die KI-Ausgabe
  - Komponententests: Formular, Filter, Detailseite
  - E2E-Tests mit **Maestro** für den Hauptablauf (anlegen → Status ändern → Erinnerung erscheint)
- [ ] **CI/CD mit GitHub Actions bzw. EAS Workflows:** bei Pull Requests Lint, Typecheck, Tests und eine Preview-Version (EAS Update), auf `main` das Deployment der Web-Demo
- [ ] Error Boundary und verständliche Fehlerzustände (z. B. die KI ist nicht erreichbar)
- [ ] Barrierefreiheit: mit VoiceOver und TalkBack prüfen, Kontraste, dynamische Schriftgröße
- [ ] Optional: App-Sperre mit Face ID oder Fingerabdruck (`expo-local-authentication`), da Gehälter und Kontakte sensibel sind
- [ ] Optional: Sprachumschaltung DE/EN (vorbereitet durch die englischen Schlüssel aus Phase 0)
- [ ] Saubere Git-Historie: ein Feature pro Branch und Pull Request, aussagekräftige Commits, CHANGELOG

---

## Empfohlene Reihenfolge

1. **Phase 0 und 1:** Fundament und Speicherung. Ohne sie wirkt alles andere unfertig.
2. **Phase 2:** Detailseite, Bearbeiten, Timeline, Termine
3. **Phase 5 (Teil 1):** Web-Demo und README. So gibt es früh einen Link fürs Portfolio.
4. **Phase 3:** Erinnerungen
5. **Phase 4:** KI-Assistent, danach Demo und README ergänzen
6. **Phase 6:** läuft von Anfang an mit (CI ab Phase 0, Tests mit jeder Funktion)

Hinweis: Expo ändert sich mit jedem SDK. Vor der Umsetzung jeder Phase die Dokumentation für SDK 57 lesen (siehe `AGENTS.md`) und Pakete mit `npx expo install` hinzufügen.
