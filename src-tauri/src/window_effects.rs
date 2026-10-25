//! Native glass background for the main window (docs/design.md, "Fenster").

use serde::Serialize;
use tauri::WebviewWindow;
use window_vibrancy::{NSVisualEffectMaterial, NSVisualEffectState, apply_mica, apply_vibrancy};

/// Effect that is active behind the transparent webview.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum WindowEffect {
    Mica,
    Vibrancy,
    /// No glass available; the frontend paints a solid background.
    None,
}

/// Applies the best effect the OS supports:
/// - Windows 11: Mica. Light or dark follows the window theme, which the frontend
///   sets to match the app (`setTheme`).
/// - Windows 10: none. Mica is unavailable and Acrylic lags while moving or resizing
///   the window there (see window-vibrancy docs), so the frontend keeps a solid background.
/// - macOS: Vibrancy.
///
/// window-vibrancy compiles on every platform and returns an error where an effect is
/// unsupported, so both branches are type-checked on every build.
pub fn apply(window: &WebviewWindow) -> WindowEffect {
    if cfg!(target_os = "windows") && apply_mica(window, None).is_ok() {
        return WindowEffect::Mica;
    }
    if cfg!(target_os = "macos")
        && apply_vibrancy(
            window,
            NSVisualEffectMaterial::UnderWindowBackground,
            Some(NSVisualEffectState::FollowsWindowActiveState),
            None,
        )
        .is_ok()
    {
        return WindowEffect::Vibrancy;
    }
    WindowEffect::None
}
