pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_barcode_scanner::init())
        .setup(|_app| {
            // Mobile-specific initialization handled by platform plugins
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Nexus HEMS Dashboard");
}
