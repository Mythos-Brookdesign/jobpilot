# jobpilot – Roadmap

Ziel: Aus dem Klick-Prototyp wird eine App, die zeigt, wie ein Senior-Entwickler arbeitet. Dazu gehören Daten, die erhalten bleiben, durchdachte Architektur, echte native Funktionen, ein KI-Feature mit Nutzen, Tests und CI sowie eine Demo, die Recruiter ohne Installation ausprobieren können.

Stand heute: Phase 0 ist abgeschlossen. Übersicht und Bewerbungsliste mit Suche und Filter, Anlegen, Status ändern. Die Daten liegen noch nur im Speicher (`useState`) und sind nach einem Neustart weg, das ändert Phase 1.

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

## Phase 1 – Datenmodell und Speicherung

**Technik:** `expo-sqlite` mit **Drizzle ORM** und `drizzle-kit` für typisierte Abfragen und versionierte Migrationen. Kleine Einstellungen (Erinnerungsabstände, Onboarding gesehen usw.) kommen in `expo-sqlite/kv-store`.

### Schema (erster Entwurf)

| Tabelle         | Wichtige Felder                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `applications`  | id, company, role, location, workMode (remote / hybrid / onsite), status, priority, source (LinkedIn, StepStone, Empfehlung …), jobUrl, salaryMin/Max, jobDescription, appliedAt, createdAt, updatedAt, archivedAt |
| `status_events` | id, applicationId, from, to, at. Wird bei jeder Statusänderung automatisch geschrieben und ergibt die Timeline und die Statistiken.                                                                                |
| `contacts`      | id, applicationId, name, role (Recruiter, Hiring Manager …), email, phone, linkedinUrl                                                                                                                             |
| `notes`         | id, applicationId, body, createdAt                                                                                                                                                                                 |
| `appointments`  | id, applicationId, type (Telefon, Video, vor Ort, Techn. Interview), startsAt, location/link, notes                                                                                                                |
| `reminders`     | id, applicationId, kind, dueAt, notificationId, doneAt                                                                                                                                                             |

### Architektur

- Repository-Schicht (`db/repositories/*`) kapselt alle Datenbankzugriffe. Screens kennen kein SQL.
- Reaktive Abfragen mit Drizzles `useLiveQuery`, damit die Oberfläche nach Änderungen automatisch neu lädt
- Migrationen mit `drizzle-kit` erzeugen und beim Start im `SQLiteProvider` (`onInit`) ausführen
- Statusübergänge als reine Funktion in `domain/` (z. B. bei „Angebot“ wird eine offene Nachfass-Erinnerung erledigt). Diese Funktion ist voll getestet.
- **Web:** expo-sqlite läuft im Web nur als Alpha. Es braucht wasm in Metro und die Header COOP/COEP. Zuerst ausprobieren. Ist es nicht stabil genug, eine Repository-Implementierung für Web (`*.web.ts`) mit In-Memory-Speicher und Demo-Daten bauen. Die Repository-Schicht ist genau dafür da.

### Weitere Funktionen in dieser Phase

- [ ] Export und Import als JSON (Backup) sowie CSV-Export, geteilt über `expo-sharing`
- [ ] Löschen mit „Rückgängig“ (Soft Delete über `archivedAt`)

**Fertig, wenn:** Die Daten überstehen einen Neustart, die Migrationen sind versioniert, und Repositories und Domain-Logik haben Unit-Tests.

---

## Phase 2 – Funktionsumfang

### Bewerbungen

- [ ] **Eigene Detailseite** als Route `/bewerbung/[id]` statt eines Modals. Dadurch kann eine Benachrichtigung per Deep Link genau diesen Eintrag öffnen.
- [ ] Bearbeiten aller Felder, Löschen, Archivieren
- [ ] Erweiterte Pipeline: _Gemerkt → Beworben → Screening → Fachgespräch → Finale Runde → Angebot_ sowie _Abgesagt / Zurückgezogen_
- [ ] **Timeline** auf der Detailseite aus Statusänderungen, Notizen und Terminen
- [ ] Ansprechpartner und Notizen pro Bewerbung
- [ ] Termine anlegen (Typ, Zeit, Link). Der nächste Termin erscheint auf der Übersicht.
- [ ] Link zur Stellenanzeige, Gehaltsrahmen, Arbeitsmodell, Priorität, Quelle
- [ ] Sortierung (neueste, Priorität, nächster Termin); die zuletzt gewählte Sortierung und der Filter bleiben gespeichert
- [ ] Liste mit `FlatList` statt `map` in `ScrollView` (Performance bei vielen Einträgen)

### Übersicht (Dashboard)

- [ ] „Heute fällig“: Erinnerungen und Termine der nächsten 7 Tage
- [ ] Die Kennzahlen öffnen beim Antippen die gefilterte Liste

### Auswertung (neuer Tab „Insights“)

- [ ] Funnel: wie viele Bewerbungen welche Stufe erreichen
- [ ] Antwortquote, durchschnittliche Zeit bis zur ersten Rückmeldung, Erfolgsquote je Quelle
- [ ] Aktivität pro Woche
- Berechnung als reine, getestete Funktionen in `domain/insights.ts`

### Tablet und Web

- [ ] Ab etwa 900 px Breite eine **Kanban-Ansicht** (Spalten je Status) sowie Liste und Detail nebeneinander

**Fertig, wenn:** Eine Bewerbung lässt sich vom Merken bis zum Angebot vollständig abbilden und auswerten.

---

## Phase 3 – Erinnerungen

**Technik:** `expo-notifications` mit lokalen, zeitgesteuerten Benachrichtigungen. Die funktionieren auch in Expo Go, Push vom Server ist nicht nötig.

### Regeln (in `domain/reminder-rules.ts`, einstellbar)

| Auslöser                                                        | Erinnerung                                                |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| Status „Beworben“ und X Tage ohne Statusänderung (Standard: 10) | „Seit 10 Tagen keine Rückmeldung von {Firma}. Nachhaken?“ |
| Termin angelegt                                                 | Am Vortag um 18 Uhr und 1 Stunde vorher                   |
| Nach einem Gespräch                                             | Am nächsten Tag: „Dankes-Mail an {Kontakt} senden?“       |
| Angebot mit Frist                                               | 2 Tage vor Fristende                                      |
| Eigene Erinnerung                                               | frei wählbares Datum und Text                             |

### Umsetzung

- [ ] Tabelle `reminders` ist die Quelle der Wahrheit. Die gespeicherte `notificationId` dient zum Abbrechen und Neuplanen.
- [ ] Ändern sich Status oder Termin, werden die Erinnerungen dieser Bewerbung neu berechnet. Das ist eine reine Funktion, die ein Soll und ein Ist vergleicht und deshalb gut testbar ist.
- [ ] **Aktionen direkt in der Benachrichtigung** über Kategorien (`setNotificationCategoryAsync`): „Erledigt“, „In 3 Tagen erneut“
- [ ] Antippen öffnet `/bewerbung/[id]` per Deep Link
- [ ] Berechtigung erst anfragen, wenn sie gebraucht wird (beim ersten Termin oder der ersten Erinnerung), mit kurzer Erklärung vorher
- [ ] Einstellungsseite: Abstände, Ruhezeiten, Erinnerungen ein oder aus
- [ ] Web: keine Systembenachrichtigungen, stattdessen die Liste „Heute fällig“ in der App

**Fertig, wenn:** Erinnerungen werden korrekt geplant, verschoben und gelöscht, und die Regeln haben Unit-Tests.

---

## Phase 4 – KI-Assistent (das Alleinstellungsmerkmal)

Damit hebt sich jobpilot von üblichen Tutorial-Trackern ab, und es passt zu „Frag meinen Lebenslauf“ im Portfolio.

### Funktionen

1. **Stellenanzeige übernehmen:** Text einfügen (oder URL). Claude extrahiert Firma, Position, Ort, Arbeitsmodell, Gehalt, geforderte Skills und Ansprechpartner als strukturiertes JSON. Daraus wird ein vorausgefülltes Formular, das man vor dem Speichern prüft.
2. **Passung zum eigenen Profil:** Den Lebenslauf einmal hinterlegen. Die App zeigt passende Skills, Lücken und Punkte, die man im Gespräch betonen sollte.
3. **Gesprächsvorbereitung:** wahrscheinliche Fragen zur Stelle und zum Tech-Stack, dazu Fragen, die man selbst stellen kann
4. **Entwürfe:** Anschreiben, Nachfass-Mail, Dankes-Mail, jeweils mit Bezug auf die gespeicherte Bewerbung

### Architektur

- **Der API-Key gehört nie in die App.** Die Aufrufe laufen über **Expo Router API Routes** (`src/app/api/*+api.ts`) auf **EAS Hosting**. Dafür muss `web.output` auf `"server"` umgestellt werden.
- Eingaben mit `zod` prüfen, Ausgaben über Structured Outputs bzw. Tool Use als typisiertes JSON
- Rate-Limit und Größenbegrenzung der Eingaben, Ausgabenlimit in der Anthropic Console
- Für die Extraktion reicht ein kleines, schnelles Modell. Die Modellwahl bei der Umsetzung mit den aktuellen Claude-API-Dokumenten treffen.
- Datenschutz: Vor der ersten Nutzung erklären, was an die API geht. Der Lebenslauf bleibt lokal und wird nur pro Anfrage mitgeschickt.

### Optional

- [ ] **Teilen in die App:** eine Stellenanzeige aus LinkedIn oder dem Browser per „Teilen“ an jobpilot senden. Das braucht ein Config-Plugin (z. B. `expo-share-intent`) und einen Development Build.

**Fertig, wenn:** Eine eingefügte Stellenanzeige ergibt in weniger als 10 Sekunden eine vorausgefüllte, korrigierbare Bewerbung.

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
