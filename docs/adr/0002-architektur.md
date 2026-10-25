# 0002 – Architektur & Ordnerstruktur

- **Status:** Angenommen
- **Datum:** 2026-10-25

## Kontext
Die App besteht aus vielen unabhängigen Panels (Watchlist, Chart, Order, Positionen, Paper-Konto, TradingView), die Kurse aus mehreren Quellen (Binance, Finnhub, Twelve Data) gleichzeitig anzeigen. Wir brauchen eine Struktur, in der Panels, Marktdaten-Anbindung und Trading-Logik klar getrennt sind, damit sie einzeln testbar und austauschbar bleiben. Außerdem muss feststehen, was im Rust-Backend und was im TypeScript-Frontend läuft.

## Entscheidung

### Aufteilung Frontend / Rust
- **Marktdaten laufen in TypeScript im Frontend.** REST-Abfragen und WebSocket-Verbindungen zu Binance, Finnhub und Twelve Data werden in den Provider-Adaptern unter `src/core/providers/` aufgebaut.
- **Rust nur für Betriebssystem-Aufgaben:**
  - API-Keys im OS-Schlüsselbund (Crate `keyring`: Windows Credential Manager / macOS Keychain)
  - SQLite (`tauri-plugin-sql`) für Watchlists, Paper-Konto, Einstellungen
  - Glas-Effekt (`window-vibrancy`)
  - Desktop-Benachrichtigungen (`tauri-plugin-notification`)
- Das Frontend ruft Rust nur über schmale Tauri-Commands bzw. Plugins auf. Diese Aufrufe sind in kleinen Wrappern unter `src/lib/` gekapselt, damit Panels und `src/core/` nicht direkt von Tauri abhängen.

### Ordnerstruktur
```
src/
  app/                 App-Shell: Einstiegskomponente, globale Provider (Theme, Query-Client), Layout
  panels/<name>/       ein Ordner pro Panel: watchlist, chart, order, positions, account, tradingview
  components/ui/       generische UI-Bausteine (shadcn/ui)
  core/                Fachlogik ohne React und ohne Tauri, vollständig mit Vitest testbar
    market/            Marktdaten-Typen und Provider-Interface, Provider-Registry
    providers/         ein Adapter pro Datenquelle: binance/, finnhub/, twelvedata/
    trading/           Paper-Trading-Engine und Trading-Typen
  stores/              Zustand-Stores (Watchlists, Layout, Theme, Paper-Konto ...)
  lib/                 Formatierung (Preise, Prozent, Datum), Utils, Tauri-Wrapper
```

### Abhängigkeitsregeln
- `panels/` → `stores/`, `core/`, `components/`, `lib/`
- `stores/` → `core/`, `lib/`
- `core/` → nur `core/` und `lib/` (keine React-, keine Tauri-Imports)
- `core/providers/*` implementieren das Interface aus `core/market/` und werden nie direkt von Panels importiert (siehe ADR 0003).
- Panels importieren sich nicht gegenseitig. Gemeinsamer Zustand läuft über `stores/`.

### Datenfluss
```
Datenquelle (REST / WebSocket)
  → Provider-Adapter (core/providers/…)
  → Provider-Registry (core/market)       wählt den Provider pro Instrument
  → Store (stores/, Zustand)              hält Kurse, Watchlists, Konto
  → Panel (panels/…)                      zeigt an, löst Aktionen aus
```
Einmalige Abfragen (Kerzen-Historie, Symbolsuche) laufen über TanStack Query, laufende Kurs-Streams über Abos in Zustand-Stores.

### Imports
Path-Alias `@/` zeigt auf `src/` (in `tsconfig.json` und `vite.config.ts`), z. B. `import { formatPrice } from "@/lib/format"`.

## Betrachtete Alternative
**Marktdaten im Rust-Backend** (Rust hält WebSockets, schickt Kurse per Tauri-Events ans Frontend):
- Vorteil: API-Keys verlassen nie den Rust-Prozess, WebSockets laufen unabhängig vom WebView weiter.
- Nachteil: zweite Sprache für die meiste Logik, jeder Provider braucht Rust- und TS-Typen, langsameres Iterieren, schwerer zu testen.

Für ein Hobbyprojekt mit vielen Datenquellen überwiegt die einfachere Variante in TypeScript.

## Konsequenzen
- Provider, Registry und Paper-Engine sind reines TypeScript und mit Vitest ohne Tauri testbar.
- Die Content-Security-Policy muss `connect-src` für die Domains der Datenquellen erlauben.
- API-Keys werden zur Laufzeit per Tauri-Command aus dem Schlüsselbund gelesen und liegen nur im Arbeitsspeicher des Frontends, nie in Dateien oder localStorage.
- WebView2 und WKWebView drosseln Timer, wenn das Fenster minimiert ist. Provider müssen nach dem Aufwachen Lücken in den Kursdaten tolerieren (Reconnect, Kerzen nachladen).
- Sollte das später nicht reichen (z. B. Alarme bei geschlossenem Fenster), kann ein einzelner Provider nach Rust umziehen, ohne dass sich das Interface für die Panels ändert.
