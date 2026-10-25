# Datenmodell

Stand: 2026-10-25. Die Typen liegen in `src/core/market/types.ts` (Marktdaten) und `src/core/trading/types.ts` (Paper-Trading).

## Grundregeln
- **Zeit:** alle Zeitstempel als Unix-Millisekunden (`number`), immer UTC. Formatiert wird erst in der UI.
- **Preise und Mengen:** `number`. Sie kommen als Dezimalzahlen von den Quellen, Mengen dürfen Bruchteile haben (0,015 BTC).
- **Geldbeträge des Paper-Kontos** (Startkapital, Cash, Gebühren, realisierter P&L): ganze Zahlen in der kleinsten Einheit der Kontowährung (Cent), Typ `MinorUnits` aus `src/lib/money.ts`. Umgerechnet wird nur beim Buchen (`tradeValue(price, quantity)`), so summieren sich keine Rundungsfehler.
- **Datenmodus:** jeder Kurs, jede Order und jeder Trade trägt `dataMode` (`live` | `delayed`).

## Marktdaten (`core/market/types.ts`)

| Typ | Felder | Hinweise |
|---|---|---|
| `Market` | `crypto`, `us_stock`, `etf`, `de_stock`, `forex` | |
| `Timeframe` | `1m`, `5m`, `15m`, `1H`, `4H`, `1D`, `1W` | Dauer in ms: `TIMEFRAME_MS` |
| `Instrument` | `symbol`, `displaySymbol?`, `name`, `market`, `currency`, `decimals`, `providerId?` | `symbol` so wie die Quelle es erwartet (`BTCUSDT`, `AAPL`, `SAP.DE`, `EUR/USD`); `decimals` für die Preisanzeige |
| `Quote` | `symbol`, `price`, `changePercent`, `high?`, `low?`, `timestamp`, `dataMode` | Änderung gegenüber Vortagesschluss bzw. 24 h bei Krypto |
| `Candle` | `time`, `open`, `high`, `low`, `close`, `volume` | `time` = Startzeit der Kerze |
| `Watchlist` | `id`, `name`, `instruments` | Reihenfolge der Liste = Anzeigereihenfolge |

Ein Instrument wird über `instrumentKey()` eindeutig identifiziert: `<providerId oder market>:<symbol>`.

## Paper-Trading (`core/trading/types.ts`)

| Typ | Felder | Hinweise |
|---|---|---|
| `PaperAccount` | `id`, `name`, `currency`, `startingCapital`, `cash`, `createdAt` | Beträge in Cent |
| `Order` | `id`, `accountId`, `instrument`, `side` (`buy` \| `sell`), `type` (`market` \| `limit`), `quantity`, `status`, `createdAt`, `dataMode`, `filledAt?`, `fillPrice?`, `rejectReason?` | `LimitOrder` hat zusätzlich `limitPrice` |
| `OrderStatus` | `open`, `filled`, `cancelled`, `rejected` | Market-Orders sind sofort `filled` oder `rejected` |
| `Position` | `accountId`, `instrument`, `side` (`long` \| `short`), `quantity`, `averagePrice`, `openedAt` | höchstens eine Position pro Konto und Instrument; `quantity` immer positiv |
| `Trade` | `id`, `orderId`, `accountId`, `instrument`, `side`, `quantity`, `price`, `fee`, `realizedPnl?`, `timestamp`, `dataMode` | eine Ausführung pro gefüllter Order |

Zusammenhang: Ein Konto hat viele Orders. Jede gefüllte Order erzeugt genau einen Trade. Trades eröffnen, vergrößern, verkleinern oder schließen die Position des Instruments. Der unrealisierte P&L einer Position wird nicht gespeichert, sondern aus `averagePrice` und dem aktuellen `Quote` berechnet.

## Speicherung (SQLite über tauri-plugin-sql)
- Datenbank `trading-dashboard.db` im App-Datenverzeichnis, Migrationen in `src-tauri/src/db.rs` (laufen beim Laden), Zugriff aus dem Frontend über `src/lib/native/database.ts`.
- **Umgesetzt (Migration 1):** `watchlists (id, name, position)` und `watchlist_items (watchlist_id, instrument_key, instrument, position)`. Vorerst gibt es eine Watchlist `default`, die Gruppen (Krypto, US-Aktien & ETFs, Deutschland, Forex) ergeben sich aus `Instrument.market`.
- **Geplant:** `paper_accounts`, `orders`, `trades`, `positions` (Phase 5).
- Instrumente werden als JSON in den Zeilen gespeichert (keine eigene Stammdaten-Tabelle), Schlüssel ist `instrumentKey()`.
- Beträge als `INTEGER` (Cent), Preise und Mengen als `REAL`, Zeitstempel als `INTEGER` (ms).
- Im reinen Browser (`npm run dev` ohne Tauri) liegt die Watchlist ersatzweise im localStorage.
- UI-Zustand (Panel-Layout, Theme, Auswahl) liegt im localStorage, weil er nicht zu den Fachdaten gehört.

## Kontowährung
- Ein Konto hat genau eine Währung, Standard **USD** (`PaperAccount.currency`).
- Trades in Instrumenten mit anderer Währung (EUR-Aktien) werden beim Buchen zum aktuellen EUR/USD-Kurs in die Kontowährung umgerechnet. Der verwendete Kurs wird am Trade gespeichert (kommt mit der Paper-Trading-Engine in Phase 5).
- Ein EUR-Konto als Einstellung kommt später.
