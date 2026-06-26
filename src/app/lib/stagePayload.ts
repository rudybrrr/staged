import type {
  AvailableCommand,
  ChangedFile,
  CommandResult,
  RepoSummary,
} from "./repo";
import {
  buildChangedFileStatusCounts,
  type ScreeningFinding,
} from "./screening";

export type StagePayload = {
  schema_version: string;
  created_at: string;
  repo: {
    repo_path: string;
    repo_name: string;
    current_branch: string | null;
    is_git_repo: boolean;
    has_uncommitted_changes: boolean;
  };
  changes: {
    changed_file_count: number;
    status_counts: Record<string, number>;
    files: Array<{
      file_path: string;
      old_file_path: string | null;
      status: string;
      is_staged: boolean;
      is_unstaged: boolean;
      is_untracked: boolean;
    }>;
    selected_file: {
      file_path: string;
      old_file_path: string | null;
      status: string;
      is_staged: boolean;
      is_unstaged: boolean;
      is_untracked: boolean;
    } | null;
    selected_file_diff: {
      file_path: string;
      diff: string;
    } | null;
  };
  command_availability: Array<{
    command_id: string;
    label: string;
    command: string;
    available: boolean;
    unavailable_reason: string | null;
  }>;
  command_result: {
    command_id: string;
    command: string;
    exit_code: number | null;
    duration_ms: number;
    success: boolean;
    stdout: string;
    stderr: string;
  } | null;
  command_error: string | null;
  screening_findings: Array<{
    id: string;
    level: "pass" | "info" | "warning" | "fail";
    title: string;
    detail: string;
    source: "repo" | "changed_files" | "command_runner";
  }>;
  payload_completeness: {
    includes_selected_file_diff: boolean;
    selected_file_path: string | null;
    changed_files_without_diff_count: number;
    untracked_files_without_content_count: number;
    command_result_included: boolean;
    supported_commands_detected: number;
    limitations: string[];
  };
};

export type BuildStagePayloadInput = {
  repoSummary: RepoSummary;
  changedFiles: ChangedFile[];
  selectedFile: ChangedFile | null;
  selectedFileDiff: string | null;
  latestCommandResult: CommandResult | null;
  commandError: string | null;
  availableCommands: AvailableCommand[];
  screeningFindings: ScreeningFinding[];
};

export function buildStagePayload({
  repoSummary,
  changedFiles,
  selectedFile,
  selectedFileDiff,
  latestCommandResult,
  commandError,
  availableCommands,
  screeningFindings,
}: BuildStagePayloadInput): StagePayload {
  const includesSelectedFileDiff =
    selectedFile !== null && selectedFileDiff !== null && selectedFileDiff !== "";
  const changedFilesWithoutDiffCount = includesSelectedFileDiff
    ? Math.max(changedFiles.length - 1, 0)
    : changedFiles.length;
  const untrackedFilesWithoutContentCount = changedFiles.filter(
    (file) => file.is_untracked,
  ).length;
  const supportedCommandsDetected = availableCommands.filter(
    (command) => command.available,
  ).length;
  const limitations: string[] = [];

  if (!includesSelectedFileDiff) {
    limitations.push("No selected file diff is loaded.");
  }

  if (changedFiles.length > 1) {
    limitations.push(
      "Only the currently selected file diff can be included in this payload.",
    );
  }

  if (changedFilesWithoutDiffCount > 0) {
    limitations.push("Some changed files are listed without diff content.");
  }

  if (untrackedFilesWithoutContentCount > 0) {
    limitations.push("Untracked file contents are not included.");
  }

  if (!latestCommandResult) {
    limitations.push("No command result is included.");
  }

  if (supportedCommandsDetected === 0) {
    limitations.push("No supported npm scripts were detected.");
  }

  limitations.push("Payload has not been redacted yet.");
  limitations.push("Payload has not been reviewed by AI.");

  return {
    schema_version: "stage-payload.v1",
    created_at: new Date().toISOString(),
    repo: {
      repo_path: repoSummary.repo_path,
      repo_name: repoSummary.repo_name,
      current_branch: repoSummary.current_branch,
      is_git_repo: repoSummary.is_git_repo,
      has_uncommitted_changes: repoSummary.has_uncommitted_changes,
    },
    changes: {
      changed_file_count: changedFiles.length,
      status_counts: buildChangedFileStatusCounts(changedFiles),
      files: changedFiles.map((file) => ({
        file_path: file.file_path,
        old_file_path: file.old_file_path,
        status: file.status,
        is_staged: file.is_staged,
        is_unstaged: file.is_unstaged,
        is_untracked: file.is_untracked,
      })),
      selected_file: selectedFile
        ? {
            file_path: selectedFile.file_path,
            old_file_path: selectedFile.old_file_path,
            status: selectedFile.status,
            is_staged: selectedFile.is_staged,
            is_unstaged: selectedFile.is_unstaged,
            is_untracked: selectedFile.is_untracked,
          }
        : null,
      selected_file_diff:
        selectedFile && selectedFileDiff !== null
          ? {
              file_path: selectedFile.file_path,
              diff: selectedFileDiff,
            }
          : null,
    },
    command_availability: availableCommands.map((command) => ({
      command_id: command.command_id,
      label: command.label,
      command: command.command,
      available: command.available,
      unavailable_reason: command.unavailable_reason,
    })),
    command_result: latestCommandResult
      ? {
          command_id: latestCommandResult.command_id,
          command: latestCommandResult.command,
          exit_code: latestCommandResult.exit_code,
          duration_ms: latestCommandResult.duration_ms,
          success: latestCommandResult.success,
          stdout: latestCommandResult.stdout,
          stderr: latestCommandResult.stderr,
        }
      : null,
    command_error: commandError,
    screening_findings: screeningFindings.map((finding) => ({
      id: finding.id,
      level: finding.level,
      title: finding.title,
      detail: finding.detail,
      source: finding.source,
    })),
    payload_completeness: {
      includes_selected_file_diff: includesSelectedFileDiff,
      selected_file_path: selectedFile?.file_path ?? null,
      changed_files_without_diff_count: changedFilesWithoutDiffCount,
      untracked_files_without_content_count: untrackedFilesWithoutContentCount,
      command_result_included: latestCommandResult !== null,
      supported_commands_detected: supportedCommandsDetected,
      limitations,
    },
  };
}
