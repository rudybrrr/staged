mod commands {
    pub mod diff;
    pub mod git_status;
    pub mod repo;
    pub mod repo_command;
}

mod infra {
    pub mod git_cli;
    pub mod process_runner;
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::diff::get_file_diff,
            commands::diff::get_repo_diff,
            commands::git_status::list_changed_files,
            commands::repo::inspect_repo,
            commands::repo_command::get_available_repo_commands,
            commands::repo_command::run_repo_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
