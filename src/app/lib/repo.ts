import { invoke } from "@tauri-apps/api/core";

export type RepoSummary = {
  repo_path: string;
  repo_name: string;
  is_git_repo: boolean;
  current_branch: string | null;
  has_uncommitted_changes: boolean;
};

export type ChangedFile = {
  file_path: string;
  old_file_path: string | null;
  status:
    | "added"
    | "modified"
    | "deleted"
    | "renamed"
    | "copied"
    | "untracked"
    | "unknown";
  index_status: string | null;
  worktree_status: string | null;
  is_staged: boolean;
  is_unstaged: boolean;
  is_untracked: boolean;
};

export function inspectRepo(repoPath: string) {
  return invoke<RepoSummary>("inspect_repo", { repoPath });
}

export function listChangedFiles(repoPath: string): Promise<ChangedFile[]> {
  return invoke<ChangedFile[]>("list_changed_files", { repoPath });
}