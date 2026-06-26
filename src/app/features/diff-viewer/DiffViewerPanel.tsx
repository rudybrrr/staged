import type { ChangedFile } from "../../lib/repo";

type DiffViewerPanelProps = {
  selectedFile: ChangedFile | null;
  diffText: string | null;
  error: string | null;
  isLoading: boolean;
};

export function DiffViewerPanel({
  selectedFile,
  diffText,
  error,
  isLoading,
}: DiffViewerPanelProps) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-lg font-medium">Diff viewer</h2>

      {!selectedFile && (
        <p className="mt-3 text-sm text-zinc-500">
          Select a changed file to view its diff.
        </p>
      )}

      {selectedFile && (
        <div className="mt-4">
          <p className="text-sm text-zinc-500">Selected file</p>
          <p className="mt-1 break-all rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
            {selectedFile.file_path}
          </p>
        </div>
      )}

      {selectedFile && isLoading && (
        <p className="mt-4 text-sm text-zinc-400">Loading diff...</p>
      )}

      {selectedFile && error && (
        <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">Diff unavailable</p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
        </div>
      )}

      {selectedFile && !isLoading && !error && diffText === "" && (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          No diff available for this file yet. Untracked files may not have Git
          diff output until staged.
        </p>
      )}

      {selectedFile &&
        !isLoading &&
        !error &&
        diffText !== null &&
        diffText !== "" && (
          <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-200">{diffText}</pre>
        )}
    </div>
  );
}

