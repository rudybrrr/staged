use std::process::Command;
use std::time::Instant;

use crate::commands::repo_command::CommandResult;

struct AllowedCommand {
    command_id: &'static str,
    executable: &'static str,
    args: &'static [&'static str],
}

pub fn run_repo_command(repo_path: &str, command_id: &str) -> Result<CommandResult, String> {
    let allowed_command = allowed_command(command_id)?;
    let started_at = Instant::now();
    let output = Command::new(allowed_command.executable)
        .args(allowed_command.args)
        .current_dir(repo_path)
        .output()
        .map_err(|error| {
            format!(
                "Failed to run command '{}': {error}",
                display_command(&allowed_command)
            )
        })?;

    let duration_ms = started_at.elapsed().as_millis();
    let exit_code = output.status.code();
    let success = output.status.success();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok(CommandResult {
        command_id: allowed_command.command_id.to_string(),
        command: display_command(&allowed_command),
        stdout,
        stderr,
        exit_code,
        duration_ms,
        success,
    })
}

fn allowed_command(command_id: &str) -> Result<AllowedCommand, String> {
    let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };

    match command_id {
        "npm_test" => Ok(AllowedCommand {
            command_id: "npm_test",
            executable: npm,
            args: &["test"],
        }),
        "npm_lint" => Ok(AllowedCommand {
            command_id: "npm_lint",
            executable: npm,
            args: &["run", "lint"],
        }),
        "npm_typecheck" => Ok(AllowedCommand {
            command_id: "npm_typecheck",
            executable: npm,
            args: &["run", "typecheck"],
        }),
        _ => Err(format!("Unknown command ID: {command_id}")),
    }
}

fn display_command(command: &AllowedCommand) -> String {
    std::iter::once(command.executable)
        .chain(command.args.iter().copied())
        .collect::<Vec<_>>()
        .join(" ")
}
