use serde::Serialize;

use crate::infra::{git_cli, process_runner};

#[derive(Debug, Serialize)]
pub struct CommandResult {
    pub command_id: String,
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub duration_ms: u128,
    pub success: bool,
}

#[tauri::command]
pub fn run_repo_command(repo_path: String, command_id: String) -> Result<CommandResult, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    process_runner::run_repo_command(&repo_path, &command_id)
}
