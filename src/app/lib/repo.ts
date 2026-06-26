import { invoke } from "@tauri-apps/api/core";

export type RepoSummary = {
  repo_path: string;
  repo_name: string;
  is_git_repo: boolean;
  current_branch: string | null;
  has_uncommitted_changes: boolean;
};

export function inspectRepo(repoPath: string) {
  return invoke<RepoSummary>("inspect_repo", { repoPath });
}
