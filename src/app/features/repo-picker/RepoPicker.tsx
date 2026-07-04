import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";

import { ActionButton, EmptyState, Panel } from "../../ui";

type RepoPickerProps = {
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
};

export function RepoPicker({ selectedPath, onSelectPath }: RepoPickerProps) {
  const [isPicking, setIsPicking] = useState(false);

  async function handleSelectFolder() {
    try {
      setIsPicking(true);

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select a Git repository",
      });

      if (typeof selected === "string") {
        onSelectPath(selected);
      }
    } catch (error) {
      console.error("Failed to open folder picker", error);
    } finally {
      setIsPicking(false);
    }
  }

  return (
    <Panel
      title="Choose a repository folder"
      description="Select a local Git repository for Staged to inspect. Repository details and changed files will load after selection."
      icon={<FolderOpen className="h-5 w-5" />}
      actions={
        <ActionButton
          variant="secondary"
          onClick={handleSelectFolder}
          disabled={isPicking}
        >
          <FolderOpen className="h-4 w-4" />
          {isPicking ? "Selecting..." : "Select folder"}
        </ActionButton>
      }
    >
      {selectedPath ? (
        <div>
          <p className="text-sm font-medium text-zinc-300">Selected path</p>
          <code className="mt-2 block overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
            {selectedPath}
          </code>
        </div>
      ) : (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="No folder selected yet"
          description="Choose a folder above to begin."
        />
      )}
    </Panel>
  );
}
