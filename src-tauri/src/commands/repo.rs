use serde::Serialize;

use crate::infra::git_cli;

#[derive(Debug, Serialize)]
pub struct RepoSummary {
    pub repo_path: String,
    pub repo_name: String,
    pub is_git_repo: bool,
    pub current_branch: Option<String>,
    pub has_uncommitted_changes: bool,
}

#[tauri::command]
pub fn inspect_repo(repo_path: String) -> Result<RepoSummary, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    let repo_root = git_cli::repo_root(&repo_path)?;
    let repo_name = repo_root
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Could not determine repository name".to_string())?
        .to_string();
    let current_branch = git_cli::current_branch(&repo_path)?;
    let has_uncommitted_changes = git_cli::has_uncommitted_changes(&repo_path)?;

    Ok(RepoSummary {
        repo_path: repo_root.to_string_lossy().to_string(),
        repo_name,
        is_git_repo: true,
        current_branch,
        has_uncommitted_changes,
    })
}
