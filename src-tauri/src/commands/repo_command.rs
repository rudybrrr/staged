use serde::Serialize;
use serde_json::Value;
use std::fs;

use crate::infra::{git_cli, process_runner};

#[derive(Debug, Serialize)]
pub struct AvailableCommand {
    pub command_id: String,
    pub label: String,
    pub command: String,
    pub available: bool,
    pub unavailable_reason: Option<String>,
}

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

struct SupportedNpmCommand {
    command_id: &'static str,
    label: &'static str,
    command: &'static str,
    required_script: &'static str,
}

const SUPPORTED_NPM_COMMANDS: &[SupportedNpmCommand] = &[
    SupportedNpmCommand {
        command_id: "npm_test",
        label: "npm test",
        command: "npm test",
        required_script: "test",
    },
    SupportedNpmCommand {
        command_id: "npm_lint",
        label: "npm run lint",
        command: "npm run lint",
        required_script: "lint",
    },
    SupportedNpmCommand {
        command_id: "npm_typecheck",
        label: "npm run typecheck",
        command: "npm run typecheck",
        required_script: "typecheck",
    },
];

#[tauri::command]
pub fn get_available_repo_commands(repo_path: String) -> Result<Vec<AvailableCommand>, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    let repo_root = git_cli::repo_root(&repo_path)?;
    let package_json_path = repo_root.join("package.json");

    if !package_json_path.exists() {
        return Ok(commands_with_reason("package.json not found"));
    }

    let package_json = fs::read_to_string(&package_json_path)
        .map_err(|error| format!("Failed to read package.json: {error}"))?;
    let package_json: Value = serde_json::from_str(&package_json)
        .map_err(|error| format!("Failed to parse package.json: {error}"))?;
    let scripts = package_json.get("scripts").and_then(Value::as_object);

    Ok(SUPPORTED_NPM_COMMANDS
        .iter()
        .map(|command| {
            let available = scripts
                .and_then(|scripts| scripts.get(command.required_script))
                .and_then(Value::as_str)
                .is_some();

            available_command(
                command,
                available,
                (!available).then(|| "script not found in package.json".to_string()),
            )
        })
        .collect())
}

#[tauri::command]
pub fn run_repo_command(repo_path: String, command_id: String) -> Result<CommandResult, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    process_runner::run_repo_command(&repo_path, &command_id)
}

fn commands_with_reason(reason: &str) -> Vec<AvailableCommand> {
    SUPPORTED_NPM_COMMANDS
        .iter()
        .map(|command| available_command(command, false, Some(reason.to_string())))
        .collect()
}

fn available_command(
    command: &SupportedNpmCommand,
    available: bool,
    unavailable_reason: Option<String>,
) -> AvailableCommand {
    AvailableCommand {
        command_id: command.command_id.to_string(),
        label: command.label.to_string(),
        command: command.command.to_string(),
        available,
        unavailable_reason,
    }
}
