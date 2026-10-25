mod window_effects;

use tauri::Manager;
use window_effects::WindowEffect;

/// Effect applied to the main window at startup, read by the frontend.
struct ActiveWindowEffect(WindowEffect);

#[tauri::command]
fn window_effect(state: tauri::State<'_, ActiveWindowEffect>) -> WindowEffect {
    state.0
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let effect = match app.get_webview_window("main") {
                Some(window) => window_effects::apply(&window),
                None => WindowEffect::None,
            };
            app.manage(ActiveWindowEffect(effect));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![window_effect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
