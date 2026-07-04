import { FileDiff } from "lucide-react";

import type { ChangedFile } from "../../lib/repo";
import { ActionButton, EmptyState, Metric, Panel } from "../../ui";

type ChangedFilesPanelProps = {
  files: ChangedFile[];
  error: string | null;
  isLoading: boolean;
  selectedFilePath: string | null;
  onSelectFile: (file: ChangedFile) => void;
  onRefresh: () => void;
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

function statusClassName(status: ChangedFile["status"]) {
  switch (status) {
    case "added":
      return "border-emerald-900/70 bg-emerald-950/40 text-emerald-200";
    case "modified":
      return "border-amber-900/70 bg-amber-950/40 text-amber-200";
    case "deleted":
      return "border-red-900/70 bg-red-950/40 text-red-200";
    case "renamed":
    case "copied":
      return "border-sky-900/70 bg-sky-950/40 text-sky-200";
    case "untracked":
      return "border-violet-900/70 bg-violet-950/40 text-violet-200";
    default:
      return "border-zinc-700 bg-zinc-950 text-zinc-300";
  }
}

const badgeClassName =
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium";

function fileIndicators(file: ChangedFile) {
  if (file.is_untracked) {
    return [];
  }

  const indicators = [];

  if (file.is_staged) {
    indicators.push("Staged");
  }

  if (file.is_unstaged) {
    indicators.push("Unstaged");
  }

  return indicators;
}

export function ChangedFilesPanel({
  files,
  error,
  isLoading,
  selectedFilePath,
  onSelectFile,
  onRefresh,
}: ChangedFilesPanelProps) {
  return (
    <Panel
      title="Changed files"
      icon={<FileDiff className="h-5 w-5" />}
      actions={
        <div className="flex items-center gap-4">
          <Metric label={files.length === 1 ? "File" : "Files"} value={files.length} />
          <ActionButton variant="secondary" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </ActionButton>
        </div>
      }
    >
      {isLoading && (
        <p className="text-sm text-zinc-400">Loading changed files...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">
            Changed files unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
        </div>
      )}

      {!isLoading && !error && files.length === 0 && (
        <EmptyState
          icon={<FileDiff className="h-5 w-5" />}
          title="No changed files"
          description="This repository has no changed files to review."
        />
      )}

      {!isLoading && !error && files.length > 0 && (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {files.map((file) => {
            const indicators = fileIndicators(file);
            const showOldPath =
              file.old_file_path &&
              (file.status === "renamed" || file.status === "copied");
            const isSelected = selectedFilePath === file.file_path;

            return (
              <li key={`${file.status}:${file.file_path}`}>
                <button
                  type="button"
                  onClick={() => onSelectFile(file)}
                  className={`w-full border-l-2 p-4 text-left transition hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                    isSelected
                      ? "border-zinc-100 bg-zinc-800/70"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p
                        className="truncate font-mono text-sm text-zinc-100"
                        title={file.file_path}
                      >
                        {file.file_path}
                      </p>

                      {showOldPath && (
                        <p
                          className="mt-2 truncate font-mono text-xs text-zinc-500"
                          title={file.old_file_path ?? undefined}
                        >
                          from {file.old_file_path}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span
                        className={`${badgeClassName} ${statusClassName(file.status)}`}
                      >
                        {statusLabels[file.status]}
                      </span>

                      {indicators.map((indicator) => (
                        <span
                          key={indicator}
                          className={`${badgeClassName} border-zinc-700 bg-zinc-900 text-zinc-300`}
                        >
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
