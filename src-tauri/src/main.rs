// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands {
    pub mod diff;
    pub mod git_status;
    pub mod repo;
    pub mod repo_command;
}

mod infra {
    pub mod git_cli;
    pub mod process_runner;
    #[allow(dead_code)]
    pub mod stage_history;
}

use serde::Serialize;

#[derive(Debug, Serialize)]
struct ProviderReadiness {
    configured: bool,
    provider: Option<String>,
    source: Option<String>,
    message: String,
}

fn non_empty_env_var(name: &str) -> bool {
    std::env::var(name)
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false)
}

#[tauri::command]
fn get_provider_readiness() -> Result<ProviderReadiness, String> {
    if non_empty_env_var("STAGED_OPENAI_API_KEY") {
        return Ok(ProviderReadiness {
            configured: true,
            provider: Some("openai".to_string()),
            source: Some("STAGED_OPENAI_API_KEY".to_string()),
            message: "Provider configuration detected from local environment.".to_string(),
        });
    }

    if non_empty_env_var("OPENAI_API_KEY") {
        return Ok(ProviderReadiness {
            configured: true,
            provider: Some("openai".to_string()),
            source: Some("OPENAI_API_KEY".to_string()),
            message: "Provider configuration detected from local environment.".to_string(),
        });
    }

    Ok(ProviderReadiness {
        configured: false,
        provider: None,
        source: None,
        message: "No provider environment variable was detected.".to_string(),
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(infra::stage_history::initialize_stage_history)
        .invoke_handler(tauri::generate_handler![
            get_provider_readiness,
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
