import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

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
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="text-lg font-medium">Choose a repository folder</h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
        Select a local Git repository for Staged to inspect. Repository details
        and changed files will load after selection.
      </p>

      <button
        type="button"
        onClick={handleSelectFolder}
        disabled={isPicking}
        className="mt-5 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-500"
      >
        Select folder
      </button>

      {selectedPath ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-zinc-300">Selected path</p>
          <code className="mt-2 block overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
            {selectedPath}
          </code>
        </div>
      ) : (
        <p className="mt-5 text-sm text-zinc-500">No folder selected yet.</p>
      )}
    </div>
  );
}
