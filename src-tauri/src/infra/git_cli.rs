use std::path::PathBuf;
use std::process::Command;

pub fn is_inside_work_tree(repo_path: &str) -> Result<bool, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(["rev-parse", "--is-inside-work-tree"])
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Ok(stdout == "true");
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if is_not_git_repository_error(&stderr) {
        Ok(false)
    } else if stderr.is_empty() {
        Err(format!("Git command failed with status {}", output.status))
    } else {
        Err(stderr)
    }
}

pub fn repo_root(repo_path: &str) -> Result<PathBuf, String> {
    run_git(repo_path, &["rev-parse", "--show-toplevel"]).map(PathBuf::from)
}

pub fn current_branch(repo_path: &str) -> Result<Option<String>, String> {
    let branch = run_git(repo_path, &["branch", "--show-current"])?;

    if branch.is_empty() {
        Ok(None)
    } else {
        Ok(Some(branch))
    }
}

pub fn has_uncommitted_changes(repo_path: &str) -> Result<bool, String> {
    let status = run_git(repo_path, &["status", "--porcelain"])?;
    Ok(!status.is_empty())
}

pub fn porcelain_status(repo_path: &str) -> Result<String, String> {
    run_git(repo_path, &["status", "--porcelain=v1"])
}

fn run_git(repo_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(args)
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

        if stderr.is_empty() {
            Err(format!("Git command failed with status {}", output.status))
        } else {
            Err(stderr)
        }
    }
}

fn is_not_git_repository_error(stderr: &str) -> bool {
    stderr.contains("not a git repository") || stderr.contains("not in a git directory")
}
