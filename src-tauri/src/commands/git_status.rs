use serde::Serialize;

use crate::infra::git_cli;

#[derive(Debug, Serialize)]
pub struct ChangedFile {
    pub file_path: String,
    pub old_file_path: Option<String>,
    pub status: String,
    pub index_status: Option<String>,
    pub worktree_status: Option<String>,
    pub is_staged: bool,
    pub is_unstaged: bool,
    pub is_untracked: bool,
}

#[tauri::command]
pub fn list_changed_files(repo_path: String) -> Result<Vec<ChangedFile>, String> {
    if !git_cli::is_inside_work_tree(&repo_path)? {
        return Err(format!("Path is not a Git repository: {repo_path}"));
    }

    let status_output = git_cli::porcelain_status(&repo_path)?;

    Ok(status_output
        .lines()
        .filter_map(parse_porcelain_status_line)
        .collect())
}

fn parse_porcelain_status_line(line: &str) -> Option<ChangedFile> {
    if line.len() < 4 {
        return None;
    }

    let index = line.chars().next()?;
    let worktree = line.chars().nth(1)?;
    let path = line.get(3..)?.to_string();
    let is_untracked = index == '?' && worktree == '?';
    let status_code = if is_untracked {
        '?'
    } else if index != ' ' {
        index
    } else {
        worktree
    };
    let (old_file_path, file_path) = parse_changed_path(status_code, path);

    Some(ChangedFile {
        file_path,
        old_file_path,
        status: status_from_code(status_code).to_string(),
        index_status: status_column(index),
        worktree_status: status_column(worktree),
        is_staged: index != ' ' && index != '?',
        is_unstaged: worktree != ' ' && worktree != '?',
        is_untracked,
    })
}

fn parse_changed_path(status_code: char, path: String) -> (Option<String>, String) {
    if matches!(status_code, 'R' | 'C') {
        if let Some((old_path, new_path)) = path.split_once(" -> ") {
            return (Some(old_path.to_string()), new_path.to_string());
        }
    }

    (None, path)
}

fn status_column(status: char) -> Option<String> {
    if status == ' ' {
        None
    } else {
        Some(status.to_string())
    }
}

fn status_from_code(status: char) -> &'static str {
    match status {
        '?' => "untracked",
        'A' => "added",
        'M' => "modified",
        'D' => "deleted",
        'R' => "renamed",
        'C' => "copied",
        _ => "unknown",
    }
}
