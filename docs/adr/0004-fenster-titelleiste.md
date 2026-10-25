# 0004 – Fenster und Titelleiste pro Plattform

- **Status:** Angenommen
- **Datum:** 2026-10-25

## Kontext
Das Hauptfenster hat einen nativen Glas-Hintergrund (Mica / Vibrancy, siehe `docs/design.md`) und eine eigene Titelleiste mit App-Name, „Paper“-Badge und Bedienelementen. Windows und macOS haben unterschiedliche Konventionen für die Fensterbuttons: rechts (Minimieren, Maximieren, Schließen) bzw. links (Ampel-Buttons).

## Entscheidung
- **Windows:** Fenster ohne Systemdekoration (`decorations: false`), eigene Buttons Minimieren / Maximieren ↔ Wiederherstellen / Schließen rechts in der Titelleiste (`src/app/window-controls.tsx`).
- **macOS:** native Ampel-Buttons links. Die Titelleiste liegt als Overlay über dem Inhalt (`titleBarStyle: "Overlay"`, `hiddenTitle: true`, `trafficLightPosition` passend zur 40 px hohen Leiste). Der Inhalt der Titelleiste wird links eingerückt (`pl-20`), eigene Fensterbuttons werden nicht angezeigt.
- Umgesetzt über die plattformspezifische Konfiguration `src-tauri/tauri.macos.conf.json`, die Tauri beim macOS-Build automatisch über `tauri.conf.json` legt. Im Frontend entscheidet `isMacDesktop` (`src/lib/native/platform.ts`).
- Ziehen des Fensters auf beiden Plattformen über `data-tauri-drag-region`.

## Konsequenzen
- Jede Plattform verhält sich wie gewohnt: macOS behält Vollbild-Button, Fenster-Anordnen und Doppelklick-Verhalten der Titelleiste.
- Fenstergröße und -grenzen stehen in zwei Dateien (`tauri.conf.json` und `tauri.macos.conf.json`, weil Tauri Arrays beim Zusammenführen ersetzt) und müssen gemeinsam geändert werden.
- Die Position der Ampel-Buttons ist ohne Mac noch nicht geprüft und muss beim ersten Test auf macOS ggf. angepasst werden.
