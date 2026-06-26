use crate::infra::git_cli;

#[tauri::command]
pub fn get_repo_diff(repo_path: String) -> Result<String, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    git_cli::repo_diff(&repo_path)
}

#[tauri::command]
pub fn get_file_diff(repo_path: String, file_path: String) -> Result<String, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    let unstaged_diff = git_cli::file_diff(&repo_path, &file_path)?;

    if !unstaged_diff.is_empty() {
        return Ok(unstaged_diff);
    }

    git_cli::cached_file_diff(&repo_path, &file_path)
}
