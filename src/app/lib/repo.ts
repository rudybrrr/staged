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

export type CommandId = "npm_test" | "npm_lint" | "npm_typecheck";

export type AvailableCommand = {
  command_id: CommandId;
  label: string;
  command: string;
  available: boolean;
  unavailable_reason: string | null;
};

export type CommandResult = {
  command_id: string;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  duration_ms: number;
  success: boolean;
};

export function inspectRepo(repoPath: string) {
  return invoke<RepoSummary>("inspect_repo", { repoPath });
}

export function listChangedFiles(repoPath: string): Promise<ChangedFile[]> {
  return invoke<ChangedFile[]>("list_changed_files", { repoPath });
}

export function getFileDiff(repoPath: string, filePath: string): Promise<string> {
  return invoke<string>("get_file_diff", { repoPath, filePath });
}

export function getAvailableRepoCommands(
  repoPath: string,
): Promise<AvailableCommand[]> {
  return invoke<AvailableCommand[]>("get_available_repo_commands", { repoPath });
}

export function runRepoCommand(
  repoPath: string,
  commandId: CommandId,
): Promise<CommandResult> {
  return invoke<CommandResult>("run_repo_command", { repoPath, commandId });
}
