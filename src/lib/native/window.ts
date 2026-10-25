// Thin wrappers around the Tauri window API. Outside Tauri (plain browser during
// `npm run dev`) every call is a no-op, so the UI also runs without the desktop shell.
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Native effect behind the window, set up by the Rust side at startup. */
export type WindowEffect = "mica" | "vibrancy" | "none";

export async function getWindowEffect(): Promise<WindowEffect> {
  if (!isTauri()) return "none";
  return invoke<WindowEffect>("window_effect");
}

/**
 * Native window theme; Mica and Vibrancy tint themselves after it. `null` follows the OS.
 * It also drives `prefers-color-scheme` inside the webview.
 */
export async function setWindowTheme(theme: "dark" | "light" | null): Promise<void> {
  if (isTauri()) await getCurrentWindow().setTheme(theme);
}

export async function minimizeWindow(): Promise<void> {
  if (isTauri()) await getCurrentWindow().minimize();
}

export async function toggleMaximizeWindow(): Promise<void> {
  if (isTauri()) await getCurrentWindow().toggleMaximize();
}

export async function closeWindow(): Promise<void> {
  if (isTauri()) await getCurrentWindow().close();
}

export async function isWindowMaximized(): Promise<boolean> {
  return isTauri() ? getCurrentWindow().isMaximized() : false;
}

/** Calls `onChange` whenever the window is resized; returns a function to stop listening. */
export function onWindowResized(onChange: () => void): () => void {
  if (!isTauri()) return () => {};
  const unlisten = getCurrentWindow().onResized(onChange);
  return () => void unlisten.then((stop) => stop());
}
