# Trading Dashboard

[![CI](https://github.com/dennisgpt/trading-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/dennisgpt/trading-dashboard/actions/workflows/ci.yml)

Ein modulares Trading-Dashboard für den Desktop (Windows & macOS). Charts, Watchlist und Paper-Trading in frei anordenbaren Fenstern, im cleanen Glas-Look mit Hell- und Dunkelmodus.

> **Status:** in Entwicklung (Phase 4 – MVP). Arbeitstitel, der finale Name folgt.

## Geplante Features

- Frei anordenbare Panels (andocken, verschieben, abdocken)
- Watchlist für Krypto, Aktien, ETFs und Forex mit Live- bzw. Verzögert-Kennzeichnung
- Candlestick-Charts und TradingView-Chart-Widget
- Paper-Trading mit simuliertem Konto
- Indikatoren, Preisalarme, News

## Tech-Stack

[Tauri 2](https://tauri.app) · React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Zustand · Vitest

## Entwicklung

Voraussetzungen: [Node.js](https://nodejs.org) (LTS), [Rust](https://rustup.rs) und unter Windows die Visual Studio C++ Build Tools ([Tauri-Voraussetzungen](https://tauri.app/start/prerequisites/)).

```bash
npm install
npm run tauri dev
```

Installer bauen:

```bash
npm run tauri build
```

## Daten & API-Keys

Kursdaten kommen ausschließlich aus kostenlosen Quellen. Für Aktien und Forex trägt jeder Nutzer seinen eigenen kostenlosen API-Key in den Einstellungen ein. Krypto funktioniert ohne Key.

## Mitmachen

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).
