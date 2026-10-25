# Projektstatus

Lebendes Dokument: was fertig ist, woran gerade gearbeitet wird, was als Nächstes kommt.
Nach jeder abgeschlossenen Aufgabe aktualisieren.

**Aktuelle Phase:** 4 – MVP v0.1.0 (Teil A fertig, Teil B als Nächstes)
**Letzte Aktualisierung:** 2026-10-25

Board: [Trading Dashboard](https://github.com/users/dennisgpt/projects/1)

## Fertig
- [x] Anforderungen festgelegt (`docs/anforderungen.md`)
- [x] Tech-Stack entschieden (ADR 0001)
- [x] Tauri-2-Grundgerüst (React + TypeScript), App startet lokal unter Windows
- [x] CLAUDE.md, README, CONTRIBUTING, GitHub-Vorlagen, CI-Workflow, Dependabot
- [x] Phase 2 – Setup abgeschlossen:
  - Erster Commit + Push nach `dennisgpt/trading-dashboard`
  - Labels, Milestones (eine pro Phase), Issues für Phase 3–5 und 7
  - GitHub Project „Trading Dashboard“ mit allen Issues
  - CI-Lauf auf `main` geprüft
  - Ruleset für `main`: Pull Request Pflicht, Status-Check „Typecheck, build & lint“, kein Force-Push
- [x] Push-Guardrails für Claude: Push nur über `scripts/push-branch.mjs` (Feature-Branches), Projekt-Hook blockiert rohes `git push` in Bash und PowerShell

- [x] Phase 3 – Architektur & Design abgeschlossen:
  - #1 Ordnerstruktur & Architektur (ADR 0002), Path-Alias `@/`
  - #2 Provider-Interface, Registry, MockProvider (ADR 0003), Vitest in der CI
  - #3 Datenmodell (`docs/datenmodell.md`), Geldbeträge in Cent
  - #4 Design „Graphite Glass“ (`docs/design.md`)
  - #5 Tailwind v4 + shadcn/ui, Theme-Tokens, Hell/Dunkel-Umschalter, App-Shell mit Platzhalter-Panels
  - #6 Glas-Effekt (Mica / Vibrancy), eigene Titelleiste mit Fensterbuttons

- [x] Offene Punkte aus Phase 3 entschieden: macOS mit nativen Ampel-Buttons (ADR 0004), Paper-Konto in USD mit EUR/USD-Umrechnung (`docs/anforderungen.md`), Milestones Phase 2 und 3 geschlossen

- [x] Phase 4 Teil A – Krypto-Dashboard ohne API-Key:
  - #7 Panel-Layout mit dockview (verschieben, Tabs, abdocken, schließen/öffnen über „Panels“, Layout gespeichert, zurücksetzbar)
  - #9 Binance-Provider (REST + WebSocket, Reconnect mit Backoff und Watchdog, Verbindungsstatus in der Statusleiste, CSP)
  - #8 Watchlist (Gruppen, Sparkline, Live-Kurse, Suche, SQLite, gemeinsame Auswahl für Chart/Order)
  - #11 Candlestick-Chart (Kerzen + Volumen, 7 Zeiträume, Kopfzeile, letzte Kerze live, Theme-Farben)
  - #13 Hell/Dunkel-Umschalter geprüft (färbt dockview und Chart mit um)
  - Gesamttest im Tauri-Fenster: Live-Kurse, Symbolwechsel, Layout/Auswahl/Watchlist nach Neustart, CSP im Release-Build

## In Arbeit
- nichts

## Als Nächstes (Phase 4 Teil B – MVP v0.1.0)
- [ ] #14 Einstellungen + Onboarding für API-Keys (OS-Keychain via `keyring`), Theme-Option „System“
- [ ] #10 Finnhub-Provider (US-Aktien): Kurse per WebSocket, Suche; Kerzen siehe offene Entscheidung
- [ ] #12 TradingView-Widget-Panel (CSP um die TradingView-Domains erweitern)

## Offene Entscheidungen
- App-Name (später)
- Windows 10: solider Hintergrund statt Acrylic (Acrylic ruckelt beim Verschieben) – so umgesetzt, bei Bedarf änderbar
- **Kerzen für US-Aktien:** Finnhub liefert `/stock/candle` im Free-Tier nicht (vom Finnhub-Team bestätigt). Vorschlag: Finnhub für Live-Kurse (WebSocket, bis 50 Symbole) und Suche, Twelve Data (Free: 8 Credits/Minute, 800/Tag) für Kerzen-Historie. Der laufende Kurs aktualisiert die letzte Kerze.
- **EU-/DE-Aktien (#19):** Laut Twelve-Data-Preisseite enthält der kostenlose Basic-Plan nur US-Aktien/ETFs, Forex und Krypto; europäische Börsen erst in bezahlten Plänen. Quelle für Xetra-Werte muss neu bewertet werden.
- **Lizenz der Free-Tiers:** Twelve Data Basic nennt „internal non-display usage“, Finnhub schränkt die kommerzielle Nutzung ein. Für ein privates Hobbyprojekt vermutlich unkritisch, vor einer Weitergabe an Kollegen aber prüfen.

## Bekannte Probleme
- macOS ist nur über den Rust-Build unter Windows abgedeckt (der macOS-Zweig wird mitkompiliert), aber nicht auf einem Mac getestet (Vibrancy, Ampel-Buttons und deren Position).
- Verbindungsabbruch per WLAN aus ist noch nicht manuell getestet (Reconnect, Backoff und Watchdog sind per Unit-Tests abgedeckt).
