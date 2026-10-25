# Projektstatus

Lebendes Dokument: was fertig ist, woran gerade gearbeitet wird, was als Nächstes kommt.
Nach jeder abgeschlossenen Aufgabe aktualisieren.

**Aktuelle Phase:** 4 – MVP v0.1.0
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

## In Arbeit
- nichts

## Als Nächstes (Phase 4 – MVP v0.1.0)
- [x] #7 Panel-Layout mit dockview (verschieben, Tabs, abdocken, schließen/öffnen über „Panels“, Layout gespeichert, zurücksetzbar)
- [ ] #8 Watchlist mit Live/Verzögert-Badge
- [x] #9 Binance-Provider (REST + WebSocket, Reconnect, Verbindungsstatus in der Statusleiste, CSP)
- [ ] #10 Finnhub-Provider (US-Aktien)
- [ ] #11 Candlestick-Chart (lightweight-charts)
- [ ] #12 TradingView-Widget-Panel
- [ ] #13 Hell/Dunkel-Umschalter (Grundlage steht seit #5; offen: Option „System“ in den Einstellungen, Charts/Widget)
- [ ] #14 Einstellungen + Onboarding für API-Keys (OS-Keychain)

## Offene Entscheidungen
- App-Name (später)
- Windows 10: solider Hintergrund statt Acrylic (Acrylic ruckelt beim Verschieben) – so umgesetzt, bei Bedarf änderbar

## Bekannte Probleme
- macOS ist nur über den Rust-Build unter Windows abgedeckt (der macOS-Zweig wird mitkompiliert), aber nicht auf einem Mac getestet (Vibrancy, Ampel-Buttons und deren Position).
