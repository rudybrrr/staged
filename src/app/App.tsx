import { useState } from "react";

import { RepoPicker } from "./features/repo-picker/RepoPicker";
import { inspectRepo, type RepoSummary } from "./lib/repo";

const milestoneItems = [
  "Open Windows desktop app",
  "Pick a local folder",
  "Validate Git repository",
  "Read current branch",
  "Detect uncommitted changes",
];

export default function App() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [repoSummary, setRepoSummary] = useState<RepoSummary | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  async function handleSelectPath(path: string) {
    setSelectedPath(path);
    setRepoSummary(null);
    setInspectionError(null);
    setIsInspecting(true);

    try {
      const summary = await inspectRepo(path);
      setRepoSummary(summary);
    } catch (error) {
      setInspectionError(
        error instanceof Error
          ? error.message
          : "Unable to inspect the selected repository.",
      );
    } finally {
      setIsInspecting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-8 py-10 text-zinc-100">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">
          Staged
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Local-first verification before commit.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          Milestone 1 focuses on the local verification spine: selecting a Git
          repository, reading its branch, and detecting uncommitted changes. No
          AI, no RAG, no cloud, no auto-fixing.
        </p>

        <RepoPicker selectedPath={selectedPath} onSelectPath={handleSelectPath} />

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-medium">Repository inspection</h2>

          {!selectedPath && (
            <p className="mt-3 text-sm text-zinc-500">No folder selected yet.</p>
          )}

          {selectedPath && isInspecting && (
            <p className="mt-3 text-sm text-zinc-400">
              Inspecting repository...
            </p>
          )}

          {inspectionError && (
            <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/30 p-4">
              <p className="text-sm font-medium text-red-200">
                Repository inspection failed
              </p>
              <p className="mt-2 text-sm leading-6 text-red-100/80">
                {inspectionError}
              </p>
            </div>
          )}

          {repoSummary && (
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-zinc-500">Repo name</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {repoSummary.repo_name}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Current branch</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {repoSummary.current_branch ?? "Detached HEAD / unknown"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Git repository status</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {repoSummary.is_git_repo
                    ? "Valid Git repository"
                    : "Not a Git repository"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Working tree state</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {repoSummary.has_uncommitted_changes ? "Dirty" : "Clean"}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm text-zinc-500">Repo path</dt>
                <dd className="mt-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
                  {repoSummary.repo_path}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-medium">Milestone 1 target</h2>

          <ul className="mt-4 space-y-3">
            {milestoneItems.map((item) => (
              <li key={item} className="flex items-center gap-3 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}