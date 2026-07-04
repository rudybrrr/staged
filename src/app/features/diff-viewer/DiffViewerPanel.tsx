import { GitCompare } from "lucide-react";

import type { ChangedFile } from "../../lib/repo";
import { CodeBlock, EmptyState, Panel } from "../../ui";

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
    <Panel
      title="Diff viewer"
      icon={<GitCompare className="h-5 w-5" />}
      description="Local, read-only diff output."
    >
      {!selectedFile && (
        <EmptyState
          icon={<GitCompare className="h-5 w-5" />}
          title="No file selected"
          description="Select a changed file above to view its diff."
        />
      )}

      {selectedFile && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Selected file
          </p>
          <p className="mt-2 break-all rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
            {selectedFile.file_path}
          </p>
        </div>
      )}

      {selectedFile && isLoading && (
        <p className="text-sm text-zinc-400">Loading diff...</p>
      )}

      {selectedFile && error && (
        <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">Diff unavailable</p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
        </div>
      )}

      {selectedFile && !isLoading && !error && diffText === "" && (
        <EmptyState
          title="No diff available"
          description="Untracked files may not have Git diff output until staged."
        />
      )}

      {selectedFile &&
        !isLoading &&
        !error &&
        diffText !== null &&
        diffText !== "" && <CodeBlock>{diffText}</CodeBlock>}
    </Panel>
  );
}
