import { ClipboardCheck } from "lucide-react";

import type {
  AvailableCommand,
  ChangedFile,
  CommandResult,
  RepoSummary,
} from "../../lib/repo";
import {
  buildChangedFileStatusCounts,
  buildPreStageFindings,
  changedFileStatuses,
  type ScreeningFinding,
} from "../../lib/screening";
import { EmptyState, Metric, MetricPill, Panel, StatusBadge, type StatusTone } from "../../ui";

type PreStageScreeningPanelProps = {
  repoSummary: RepoSummary | null;
  changedFiles: ChangedFile[];
  availableCommands: AvailableCommand[];
  latestCommandResult: CommandResult | null;
  commandError: string | null;
  commandAvailabilityError: string | null;
  isCommandRunning: boolean;
  isLoadingCommands: boolean;
};

const statusLabels: Record<ChangedFile["status"], string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
  copied: "Copied",
  untracked: "Untracked",
  unknown: "Unknown",
};

const levelLabels: Record<ScreeningFinding["level"], string> = {
  pass: "Pass",
  info: "Info",
  warning: "Warning",
  fail: "Fail",
};

const sourceLabels: Record<ScreeningFinding["source"], string> = {
  repo: "Repo",
  changed_files: "Changed files",
  command_runner: "Command runner",
};

const findingLevels = ["fail", "warning", "info", "pass"] as const satisfies
  readonly ScreeningFinding["level"][];

const levelTone: Record<ScreeningFinding["level"], StatusTone> = {
  pass: "pass",
  info: "info",
  warning: "warning",
  fail: "fail",
};

export function PreStageScreeningPanel({
  repoSummary,
  changedFiles,
  availableCommands,
  latestCommandResult,
  commandError,
  commandAvailabilityError,
  isCommandRunning,
  isLoadingCommands,
}: PreStageScreeningPanelProps) {
  const isValidRepo = repoSummary?.is_git_repo === true;
  const statusCounts = buildChangedFileStatusCounts(changedFiles);
  const findings = buildPreStageFindings({
    repoSummary,
    changedFiles,
    availableCommands,
    latestCommandResult,
    commandError,
    commandAvailabilityError,
    isCommandRunning,
    isLoadingCommands,
  });
  const availableCommandCount = availableCommands.filter(
    (command) => command.available,
  ).length;

  return (
    <Panel
      title="Pre-Stage Screening"
      icon={<ClipboardCheck className="h-5 w-5" />}
      description="Deterministic local checks only. No AI review yet."
      status={isValidRepo ? { tone: "preview", label: "Read-only" } : undefined}
      actions={
        isValidRepo ? (
          <Metric label="Findings" value={findings.length} />
        ) : undefined
      }
    >
      {!isValidRepo && (
        <EmptyState
          icon={<ClipboardCheck className="h-5 w-5" />}
          title="No valid repository selected"
          description="Select a valid Git repository to see the local pre-stage screening summary."
        />
      )}

      {isValidRepo && repoSummary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-500">Repo</p>
              <p className="mt-1 break-all text-sm font-medium text-zinc-100">
                {repoSummary.repo_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Branch</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {repoSummary.current_branch ?? "Detached HEAD / unknown"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Working tree</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {repoSummary.has_uncommitted_changes ? "Dirty" : "Clean"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-medium text-zinc-200">
                Changed-file count
              </h3>
              <span className="text-xs text-zinc-500">
                {changedFiles.length}{" "}
                {changedFiles.length === 1 ? "file" : "files"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {changedFileStatuses.map((status) => (
                <MetricPill
                  key={status}
                  label={statusLabels[status]}
                  value={statusCounts[status]}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="text-sm font-medium text-zinc-200">
              Command runner summary
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              <MetricPill
                label="Supported commands"
                value={
                  isLoadingCommands
                    ? "Checking..."
                    : `${availableCommandCount} of ${availableCommands.length}`
                }
              />

              <MetricPill
                label="Latest run"
                value={
                  isCommandRunning
                    ? "Running"
                    : latestCommandResult
                      ? latestCommandResult.success
                        ? "Succeeded"
                        : "Failed"
                      : "Not run"
                }
                tone={
                  latestCommandResult
                    ? latestCommandResult.success
                      ? "pass"
                      : "fail"
                    : "idle"
                }
              />
            </div>

            {(commandError ?? commandAvailabilityError) && (
              <p className="mt-3 text-sm leading-6 text-red-200">
                {commandError ?? commandAvailabilityError}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Findings</h3>

            <div className="mt-3 space-y-4">
              {findingLevels.map((level) => {
                const levelFindings = findings.filter(
                  (finding) => finding.level === level,
                );

                if (levelFindings.length === 0) {
                  return null;
                }

                return (
                  <section key={level}>
                    <div className="mb-2 flex items-center gap-2">
                      <StatusBadge tone={levelTone[level]}>
                        {levelLabels[level]}
                      </StatusBadge>
                      <span className="text-xs text-zinc-500">
                        {levelFindings.length}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {levelFindings.map((finding) => (
                        <li
                          key={finding.id}
                          className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-100">
                                {finding.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-zinc-500">
                                {finding.detail}
                              </p>
                            </div>

                            <span className="w-fit rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-300">
                              {sourceLabels[finding.source]}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
