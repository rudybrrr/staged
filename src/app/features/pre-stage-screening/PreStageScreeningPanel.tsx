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

function levelClassName(level: ScreeningFinding["level"]) {
  switch (level) {
    case "pass":
      return "border-emerald-900/70 bg-emerald-950/40 text-emerald-200";
    case "info":
      return "border-sky-900/70 bg-sky-950/40 text-sky-200";
    case "warning":
      return "border-amber-900/70 bg-amber-950/40 text-amber-200";
    case "fail":
      return "border-red-900/70 bg-red-950/40 text-red-200";
  }
}

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
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Pre-Stage Screening</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Deterministic local checks only. No AI review yet.
          </p>
        </div>

        {isValidRepo && (
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
            Read-only
          </span>
        )}
      </div>

      {!isValidRepo && (
        <p className="mt-4 text-sm text-zinc-500">
          Select a valid Git repository to see the local pre-stage screening
          summary.
        </p>
      )}

      {isValidRepo && repoSummary && (
        <div className="mt-6 space-y-6">
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
              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
                {changedFiles.length}{" "}
                {changedFiles.length === 1 ? "file" : "files"}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {changedFileStatuses.map((status) => (
                <div
                  key={status}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <dt className="text-xs text-zinc-500">
                    {statusLabels[status]}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-100">
                    {statusCounts[status]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="text-sm font-medium text-zinc-200">
              Command runner summary
            </h3>

            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">Supported commands</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {isLoadingCommands
                    ? "Checking..."
                    : `${availableCommandCount} of ${availableCommands.length}`}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-zinc-500">Latest run</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {isCommandRunning
                    ? "Running"
                    : latestCommandResult
                      ? latestCommandResult.success
                        ? "Succeeded"
                        : "Failed"
                      : "Not run"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-zinc-500">App-level error</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {commandError ?? commandAvailabilityError ?? "None"}
                </dd>
              </div>
            </dl>
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
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${levelClassName(
                          level,
                        )}`}
                      >
                        {levelLabels[level]}
                      </span>
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
                            <div>
                              <p className="text-sm font-medium text-zinc-100">
                                {finding.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-zinc-500">
                                {finding.detail}
                              </p>
                            </div>

                            <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
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
        </div>
      )}
    </div>
  );
}
