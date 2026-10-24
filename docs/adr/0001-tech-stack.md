# 0001 – Tech-Stack: Tauri 2 + React + TypeScript

- **Status:** Angenommen
- **Datum:** 2026-10-25

## Kontext
Gesucht ist eine Desktop-Anwendung (keine Website) für Windows und macOS mit modernem, professionellem Look, guten Finanz-Charts und kleinen Installern. Das Projekt ist ein Hobbyprojekt, läuft aber wie ein professionelles Projekt.

## Betrachtete Optionen
1. **Tauri 2 + React + TypeScript**: kleine Installer (~10 MB), nutzt die System-WebView, moderne Web-UI, Rust-Backend
2. **Electron + React + TypeScript**: alles in TypeScript, sehr verbreitet, aber große Installer (~150 MB) und hoher RAM-Verbrauch
3. **JavaFX**: vorhandene Java-Kenntnisse, aber veraltete Charts und Optik
4. **Python + PySide6**: gut für Analyse, aber umständliches Packaging und weniger moderner Look

## Entscheidung
Tauri 2 mit React, TypeScript und Vite.

## Konsequenzen
- Beste Auswahl an Chart- und UI-Libraries (lightweight-charts, dockview, shadcn/ui)
- Kleine, schnelle Installer für Windows und macOS, Builds über GitHub Actions
- Glas-Effekt nativ über window-vibrancy (Mica/Acrylic, macOS-Vibrancy)
- TypeScript und etwas Rust müssen neu gelernt werden
- Ohne kostenpflichtiges Code-Signing zeigen Windows und macOS beim ersten Start eine Warnung
