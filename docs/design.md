# Design: „Graphite Glass“

Stand: 2026-10-25 · Mockups abgestimmt. Grundlage für Theme (Tailwind/shadcn, #5) und Fenster (window-vibrancy, #6).

## Leitidee
Ruhiges, dunkles Graphit mit Milchglas-Panels über einem nativen Fenster-Hintergrund (Mica/Vibrancy). Farbe nur für Bedeutung: Akzentblau für Auswahl und Aktionen, Grün/Rot für Kursbewegung, Bernstein für Hinweise wie „Verzögert“. Dunkel ist Standard, Hell gleichwertig.

## Typografie
- Schrift **Inter** (variable), lokal eingebunden (kein Google-Fonts-Abruf zur Laufzeit).
- Alle Zahlen (Kurse, Mengen, P&L, Uhrzeiten) mit `font-variant-numeric: tabular-nums`, damit Spalten beim Ticken nicht springen.
- Größen: 13 px Standard in Tabellen und Panels, 12 px für Beschriftungen und Statusleiste, 11 px für Badges.

## Layout
```
┌──────────────────────────────────────────────────────────────┐
│ Titelleiste: App-Name · [Paper]           Theme  ─  ▢  ✕    │
├──┬───────────────────────────────────────────────────────────┤
│  │ ┌ Watchlist ┐ ┌ Chart ───────────────┐ ┌ Order ─────────┐ │
│S │ │           │ │                      │ │                │ │
│e │ │           │ │                      │ ├ Paper-Konto ───┤ │
│i │ │           │ ├ Positionen ──────────┤ │                │ │
│t │ │           │ │                      │ │                │ │
│e │ └───────────┘ └──────────────────────┘ └────────────────┘ │
├──┴───────────────────────────────────────────────────────────┤
│ Statusleiste: ● Binance live · ● Finnhub verzögert · Uhrzeit │
└──────────────────────────────────────────────────────────────┘
```
- **Titelleiste:** eigene Leiste (keine Systemdekoration), ziehbar, mit dauerhaftem Badge **„Paper“** (Paper-Trading ist immer sichtbar) und eigenen Buttons Minimieren / Maximieren / Schließen.
- **Seitenleiste links:** schmal, nur Icons (Panels, Einstellungen).
- **Arbeitsbereich:** dockview mit 8 px Abstand zwischen den Gruppen. Panels lassen sich über ihren Tab verschieben, als Tabs gruppieren, abdocken (schwebend) und schließen; das Menü „Panels“ in der Titelleiste öffnet sie wieder und setzt das Layout zurück. Styling in `src/app/layout/dockview-theme.css`.
- **Statusleiste unten:** Status jeder Datenquelle (verbunden / verzögert / getrennt), Uhrzeit.

## Panels
- Radius **14 px**, Rand **1 px** in `border`
- Milchglas: Hintergrund `panel`, `backdrop-filter: blur(28px) saturate(170%)`
- Feine Lichtkante oben: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)` (hell: `rgba(255,255,255,0.7)`)
- Kopfzeile mit Titel, **Griff zum Verschieben** (links) und **Abdocken-Button** (rechts)

## Badges
| Badge | Aussehen |
|---|---|
| **Live** | grüner Punkt + Text in `up`, Fläche `up` mit ca. 12 % Deckkraft |
| **Verzögert** | Text in `amber`, Fläche `amber` mit ca. 12 % Deckkraft |
| **Paper** | Text `accentFg`, Fläche `sel`, in der Titelleiste immer sichtbar |

## Farb-Tokens

| Token | Dunkel (Standard) | Hell | Verwendung |
|---|---|---|---|
| `bg` | `#1A1B1F` | `#E8EAEE` | Fenster-Hintergrund (Fallback ohne Glas) |
| `panel` | `rgba(48,50,56,0.52)` | `rgba(248,249,251,0.6)` | Panel-Fläche (Glas) |
| `chrome` | `rgba(34,35,40,0.6)` | `rgba(244,245,248,0.55)` | Titel-, Seiten-, Statusleiste |
| `border` | `rgba(255,255,255,0.08)` | `rgba(20,25,35,0.09)` | Ränder, Trennlinien |
| `text` | `#F1F2F4` | `#15171C` | Haupttext |
| `muted` | `rgba(232,234,238,0.66)` | `rgba(25,28,36,0.66)` | Nebentext, Beschriftungen |
| `hover` | `rgba(255,255,255,0.065)` | `rgba(20,25,35,0.05)` | Hover-Fläche |
| `sel` | `rgba(168,207,255,0.15)` | `rgba(168,207,255,0.38)` | Auswahl, aktive Zeile |
| `accent` | `#A8CFFF` | `#A8CFFF` (nur Flächen) | Primär-Buttons, Fokus |
| `accentFg` | `#B9D8FF` | `#2A619C` | Akzent als Text/Linie |
| `onAccent` | `#0F2236` | `#0F2236` | Text auf `accent` |
| `input` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.65)` | Eingabefelder |
| `up` | `#30D158` | `#13853A` | Kurs steigt, Kauf, Gewinn |
| `down` | `#FF6961` | `#D0312D` | Kurs fällt, Verkauf, Verlust |
| `onUp` | `#04210E` | `#FFFFFF` | Text auf `up` |
| `onDown` | `#2B0705` | `#FFFFFF` | Text auf `down` |
| `amber` | `#FFB340` | `#A15C00` | Hinweise, „Verzögert“ |
| `grid` | `rgba(255,255,255,0.05)` | `rgba(20,25,35,0.07)` | Chart-Gitter |

**Regel:** Das helle Akzentblau `#A8CFFF` wird im Light-Mode nie als Text oder Linie auf hellem Grund verwendet (zu wenig Kontrast), dafür immer `accentFg`.

## Hell/Dunkel
- Dunkel ist Standard. Hell über Klasse `.light` bzw. `data-theme="light"` am `<html>`-Element.
- Auswahl „Dunkel / Hell / System“ wird gespeichert.
- Charts und TradingView-Widget übernehmen das aktive Theme. Der Candlestick-Chart liest die Farben (`--gg-up`, `--gg-down`, `--gg-grid`, `--gg-muted`, `--gg-border`, `--gg-accent-fg`) zur Laufzeit aus den CSS-Variablen.

## Fenster
- Transparentes Fenster ohne Systemdekoration (`decorations: false`, `transparent: true`), nativer Glas-Hintergrund über window-vibrancy (`src-tauri/src/window_effects.rs`):
  - Windows 11: Mica, hell/dunkel folgt dem App-Theme (`setTheme` am Fenster)
  - Windows 10: solider `bg`. Acrylic wäre möglich, ruckelt dort aber beim Verschieben und Vergrößern des Fensters.
  - macOS: Vibrancy (`UnderWindowBackground`)
- Fensterbuttons ([ADR 0004](adr/0004-fenster-titelleiste.md)): Windows eigene Buttons rechts, macOS native Ampel-Buttons links in einer Overlay-Titelleiste, Inhalt dort links eingerückt.
- Das Frontend fragt beim Start per Command `window_effect` ab, ob ein Effekt aktiv ist. Nur dann wird die Seite transparent (`data-glass` am `<html>`), sonst bleibt der solide `bg`.
- Eigene Fensterbuttons Minimieren / Maximieren (Wiederherstellen) / Schließen rechts in der Titelleiste, Ziehen und Doppelklick über `data-tauri-drag-region`. Startgröße 1280 × 800, Minimum 1024 × 640.
