import type { ChangedFile } from "../../lib/repo";

type ChangedFilesPanelProps = {
  files: ChangedFile[];
  error: string | null;
  isLoading: boolean;
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
  onRefresh,
}: ChangedFilesPanelProps) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Changed files</h2>
          <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-400">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-fit rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-500"
        >
          {isLoading ? "Refreshing..." : "Refresh changed files"}
        </button>
      </div>

      {isLoading && (
        <p className="mt-3 text-sm text-zinc-400">Loading changed files...</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">
            Changed files unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
        </div>
      )}

      {!isLoading && !error && files.length === 0 && (
        <p className="mt-3 text-sm text-zinc-500">
          No changed files in this repository.
        </p>
      )}

      {!isLoading && !error && files.length > 0 && (
        <ul className="mt-5 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950">
          {files.map((file) => {
            const indicators = fileIndicators(file);
            const showOldPath =
              file.old_file_path &&
              (file.status === "renamed" || file.status === "copied");

            return (
              <li key={`${file.status}:${file.file_path}`} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-sm text-zinc-100">
                      {file.file_path}
                    </p>

                    {showOldPath && (
                      <p className="mt-2 break-all font-mono text-xs text-zinc-500">
                        from {file.old_file_path}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName(
                        file.status,
                      )}`}
                    >
                      {statusLabels[file.status]}
                    </span>

                    {indicators.map((indicator) => (
                      <span
                        key={indicator}
                        className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
