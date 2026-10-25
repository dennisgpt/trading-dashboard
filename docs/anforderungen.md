# Anforderungen & Entscheidungen

Stand: 25.10.2026 · Arbeitstitel „Trading Dashboard“ (Name folgt)

## Vision
Desktop-Anwendung (keine Website) als modulares Trading-Dashboard aus frei anordenbaren Fenstern/Panels. Anzeigen, analysieren und (zunächst simuliert) handeln. Hobbyprojekt, professionell aufgezogen (GitHub, CI, Releases). Tester: ein paar Kollegen, die traden.

## Rahmen
- Hobbyprojekt, keine Deadline
- Plattform: Windows primär, macOS-kompatibel (Builds für beide über GitHub Actions)
- Kosten: nur Free Tiers

## Konventionen
- Commits und PRs: nie Claude als Co-Autor nennen
- Conventional Commits, Feature-Branches + Pull Requests, Branch-Protection auf `main`
- Code/Commits auf Englisch, Oberfläche auf Deutsch

## Tech-Stack
Siehe [ADR 0001](adr/0001-tech-stack.md).
- Tauri 2, React + TypeScript + Vite
- Tailwind + shadcn/ui, dockview (Panel-Layout), window-vibrancy (Glas-Effekt)
- lightweight-charts + TradingView Advanced Chart Widget
- TanStack Query, Zustand, SQLite (tauri-plugin-sql)

## TradingView
- MVP: offizielles, kostenloses Advanced Chart Widget als Panel (ohne Login)
- Experimentell (später): TradingView in eigenem Browserfenster mit eigenem Login. Kein Datenaustausch mit der App, Google-/Apple-Login evtl. blockiert, kann bei Änderungen von TradingView brechen.

## Märkte & Daten (nur Free Tiers)
| Markt | Quelle | Modus |
|---|---|---|
| Krypto | Binance / Kraken Public WebSocket | live, ohne API-Key |
| US-Aktien/ETFs | Finnhub (Free), Alpaca (Paper) | live |
| Forex | Twelve Data (Free) | nahezu live (Intervall) |
| EU-/DE-Aktien | Twelve Data / Yahoo | verzögert |

- Live und verzögert gemischt, jedes Instrument zeigt ein Badge „Live“ bzw. „Verzögert“. Paper-Orders auf verzögerten Kursen werden markiert.
- Jeder Nutzer trägt eigene kostenlose API-Keys in den Einstellungen ein (Speicherung im OS-Schlüsselbund). Krypto ohne Key. Onboarding-Screen mit Anleitung.

## Trading
- Zuerst eigene Paper-Trading-Engine (simuliertes Konto, Market-/Limit-Orders)
- Kontowährung des Paper-Kontos: **USD** (Standard). Instrumente in EUR (z. B. Xetra-Aktien) werden beim Buchen zum aktuellen EUR/USD-Kurs umgerechnet. Eine Einstellung für ein EUR-Konto kommt später.
- Später optional Broker-Adapter (Alpaca Paper, Binance Testnet)

## Design
- Fensterbuttons: Windows eigene Buttons rechts, macOS native Ampel-Buttons links ([ADR 0004](adr/0004-fenster-titelleiste.md))
- Clean, Glas-Look im Apple-Stil, Dark als Standard, Umschalter Hell/Dunkel
- Mockups vor dem Coden

## MVP (v0.1)
- [ ] Panel-Layout (dockview), Layout wird gespeichert
- [ ] Watchlist (Krypto + US-Aktien) mit Live/Verzögert-Badge
- [ ] Candlestick-Chart mit Live-Kursen
- [ ] TradingView-Widget-Panel
- [ ] Hell/Dunkel-Umschalter
- [ ] Einstellungen + Onboarding für API-Keys

## Später (v0.2+)
- Paper-Trading (Orderpanel, Positionen, P&L)
- EU-/DE-Aktien, Forex
- Indikatoren (RSI, MACD, Bollinger, EMA)
- Preisalarme mit Desktop-Benachrichtigung
- News-Panel, Marktübersicht/Heatmap
- TradingView-Login-Fenster (experimentell)
- Auto-Update, Broker-Adapter, Backtesting

## Phasen
1. Vision & Anforderungen ✅
2. Setup: Repo, Struktur, CLAUDE.md, CI, Board
3. Architektur & Design-Mockups
4. MVP → v0.1.0
5. Features
6. Qualität (Tests, Fehlerbehandlung, Performance)
7. Release v1.0 (Installer Win/macOS, README mit Screenshots)
