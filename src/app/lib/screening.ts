import type {
  AvailableCommand,
  ChangedFile,
  CommandResult,
  RepoSummary,
} from "./repo";

export type ScreeningFinding = {
  id: string;
  level: "pass" | "info" | "warning" | "fail";
  title: string;
  detail: string;
  source: "repo" | "changed_files" | "command_runner";
};

export type ChangedFileStatusCounts = Record<ChangedFile["status"], number>;

export type BuildPreStageFindingsInput = {
  repoSummary: RepoSummary | null;
  changedFiles: ChangedFile[];
  availableCommands: AvailableCommand[];
  latestCommandResult: CommandResult | null;
  commandError: string | null;
  commandAvailabilityError: string | null;
  isCommandRunning: boolean;
  isLoadingCommands: boolean;
};

export const changedFileStatuses = [
  "added",
  "modified",
  "deleted",
  "renamed",
  "copied",
  "untracked",
  "unknown",
] as const satisfies readonly ChangedFile["status"][];

export function buildChangedFileStatusCounts(
  changedFiles: ChangedFile[],
): ChangedFileStatusCounts {
  const counts = Object.fromEntries(
    changedFileStatuses.map((status) => [status, 0]),
  ) as ChangedFileStatusCounts;

  for (const file of changedFiles) {
    counts[file.status] += 1;
  }

  return counts;
}

export function buildPreStageFindings({
  repoSummary,
  changedFiles,
  availableCommands,
  latestCommandResult,
  commandError,
  commandAvailabilityError,
  isCommandRunning,
  isLoadingCommands,
}: BuildPreStageFindingsInput): ScreeningFinding[] {
  const findings: ScreeningFinding[] = [];

  if (!repoSummary?.is_git_repo) {
    return findings;
  }

  findings.push({
    id: "repo-valid",
    level: "pass",
    title: "Valid Git repository selected",
    detail: `${repoSummary.repo_name} is available on ${
      repoSummary.current_branch ?? "a detached HEAD or unknown branch"
    }.`,
    source: "repo",
  });

  const statusCounts = buildChangedFileStatusCounts(changedFiles);

  if (changedFiles.length === 0) {
    findings.push({
      id: "changed-files-none",
      level: "info",
      title: "No changed files detected",
      detail: "The current working tree has no changed files in the latest refresh.",
      source: "changed_files",
    });
  }

  if (statusCounts.untracked > 0) {
    findings.push({
      id: "changed-files-untracked",
      level: "warning",
      title: "Untracked files are present",
      detail: `${statusCounts.untracked} untracked ${
        statusCounts.untracked === 1 ? "file is" : "files are"
      } visible in the changed-file list.`,
      source: "changed_files",
    });
  }

  if (statusCounts.deleted > 0) {
    findings.push({
      id: "changed-files-deleted",
      level: "warning",
      title: "Deleted files are present",
      detail: `${statusCounts.deleted} deleted ${
        statusCounts.deleted === 1 ? "file is" : "files are"
      } visible in the changed-file list.`,
      source: "changed_files",
    });
  }

  const movedFileCount = statusCounts.renamed + statusCounts.copied;

  if (movedFileCount > 0) {
    findings.push({
      id: "changed-files-renamed-copied",
      level: "info",
      title: "Renamed or copied files are present",
      detail: `${movedFileCount} ${
        movedFileCount === 1 ? "file has" : "files have"
      } renamed or copied status metadata.`,
      source: "changed_files",
    });
  }

  if (commandAvailabilityError) {
    findings.push({
      id: "command-availability-error",
      level: "fail",
      title: "Command availability check failed",
      detail: commandAvailabilityError,
      source: "command_runner",
    });
  }

  if (!isLoadingCommands) {
    const availableCommandCount = availableCommands.filter(
      (command) => command.available,
    ).length;

    if (availableCommandCount === 0) {
      findings.push({
        id: "command-no-supported-scripts",
        level: "info",
        title: "No supported npm scripts are available",
        detail:
          "The command runner did not find a supported test, lint, or typecheck script for this repository.",
        source: "command_runner",
      });
    }
  }

  if (commandError) {
    findings.push({
      id: "command-error",
      level: "fail",
      title: "Command execution produced an app-level error",
      detail: commandError,
      source: "command_runner",
    });
  } else if (latestCommandResult) {
    findings.push({
      id: "command-result",
      level: latestCommandResult.success ? "pass" : "fail",
      title: latestCommandResult.success
        ? "Latest command succeeded"
        : "Latest command failed",
      detail: `${latestCommandResult.command} completed with exit code ${
        latestCommandResult.exit_code ?? "null"
      } in ${latestCommandResult.duration_ms} ms.`,
      source: "command_runner",
    });
  } else if (isCommandRunning) {
    findings.push({
      id: "command-running",
      level: "info",
      title: "Command check is running",
      detail: "The latest command runner check has not completed yet.",
      source: "command_runner",
    });
  } else if (!isLoadingCommands) {
    findings.push({
      id: "command-not-run",
      level: "warning",
      title: "Command checks have not been run",
      detail:
        "Run an available local command check to include its latest result in this screening summary.",
      source: "command_runner",
    });
  }

  return findings;
}
