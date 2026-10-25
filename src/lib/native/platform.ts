import { isTauri } from "@tauri-apps/api/core";

/**
 * True in the macOS desktop app. There the window keeps the native traffic lights
 * (titleBarStyle "Overlay", see src-tauri/tauri.macos.conf.json) instead of our own buttons.
 */
export const isMacDesktop: boolean = isTauri() && /Macintosh|Mac OS X/.test(navigator.userAgent);
