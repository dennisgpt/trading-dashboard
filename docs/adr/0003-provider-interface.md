# 0003 – Provider-Interface für Marktdaten

- **Status:** Angenommen
- **Datum:** 2026-10-25

## Kontext
Kurse kommen aus mehreren kostenlosen Quellen mit unterschiedlichen APIs (Binance-WebSocket, Finnhub REST + WebSocket, Twelve Data per Abfrage-Intervall). Die Oberfläche soll davon nichts wissen: Ein Panel fragt „Kerzen für AAPL, 1H“ oder „Kurse für meine Watchlist“ und bekommt einheitliche Daten, inklusive der Angabe, ob sie live oder verzögert sind (CLAUDE.md: jeder angezeigte Preis trägt seinen Datenmodus).

## Entscheidung
Ein gemeinsames Interface `MarketDataProvider` in `src/core/market/provider.ts`, ein Adapter pro Quelle unter `src/core/providers/<quelle>/` und eine `ProviderRegistry` (`src/core/market/registry.ts`), die pro Instrument den passenden Adapter wählt.

### Interface
| Mitglied | Zweck |
|---|---|
| `id`, `name` | stabile Kennung (wird mit Instrumenten gespeichert) und Anzeigename |
| `markets` | unterstützte Märkte: `crypto`, `us_stock`, `etf`, `de_stock`, `forex` |
| `dataMode` | `"live"` oder `"delayed"`, gilt für jeden Kurs dieses Providers |
| `searchInstruments(query, signal?)` | Symbolsuche |
| `getCandles(symbol, timeframe, limit, signal?)` | Kerzen-Historie, älteste zuerst, letzte Kerze darf noch offen sein |
| `subscribeQuotes(symbols, onQuote, onError?)` | Kurs-Stream, liefert eine Funktion zum Abbestellen |

- Zeitangaben sind Unix-Millisekunden, Timeframes `1m 5m 15m 1H 4H 1D 1W`.
- Jeder `Quote` trägt `dataMode`, damit die UI das Badge „Live“ / „Verzögert“ ohne Rückfrage beim Provider zeigen kann.
- Asynchrone Abfragen akzeptieren ein `AbortSignal`, damit Panels beim Symbolwechsel alte Anfragen abbrechen können (passt zu TanStack Query).

### Auswahl des Providers (Registry)
1. Hat das Instrument eine `providerId` und dieser Provider ist registriert und bedient den Markt, wird er genommen.
2. Sonst der erste registrierte Provider für den Markt, Live-Provider vor verzögerten.
3. Gibt es keinen, wirft die Registry `NoProviderError` (die UI zeigt dann „Keine Datenquelle“, z. B. wenn kein API-Key hinterlegt ist).

`registry.subscribeQuotes(instruments, ...)` bündelt die Symbole pro Provider zu je einem Abo und liefert eine gemeinsame Abbestell-Funktion.

### Fehler, Reconnect, Rate-Limits
- Netzwerkfehler beenden ein Abo nicht. Der Adapter verbindet sich selbst neu (exponentielles Backoff, max. 30 s) und meldet Fehler über `onError`, damit die Statusleiste den Zustand der Datenquelle zeigen kann.
- Jeder Adapter hält die Limits seines Free Tiers selbst ein (Drosselung bzw. Warteschlange im Adapter), nicht der Aufrufer.
- Abfragen ohne gültigen API-Key schlagen mit einer verständlichen Fehlermeldung fehl. Keys werden nie geloggt.

### MockProvider
`src/core/providers/mock/` erzeugt deterministische Testdaten ohne Netzwerk (feste Zufallsfolge pro Symbol, injizierbare Uhr). Er dient der Entwicklung der Panels, solange es keine echten Adapter gibt, und als Grundlage für Tests.

## Konsequenzen
- Panels und Stores importieren nur `core/market`, nie einen konkreten Adapter. Neue Quellen kommen ohne Änderungen an der UI dazu.
- Ein Instrument kann von mehreren Providern bedient werden; die Registry entscheidet zentral, welcher gewinnt.
- Weil `dataMode` am Provider hängt, kann ein Provider nicht für einzelne Symbole live und für andere verzögert liefern. Braucht eine Quelle das später, wird sie in zwei Provider aufgeteilt oder `dataMode` je Quote ausgewertet (das Feld ist schon vorhanden).
- Tests laufen mit Vitest (`npm run test`) und sind Teil der CI.
