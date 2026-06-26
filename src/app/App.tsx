import { useRef, useState } from "react";

import { ChangedFilesPanel } from "./features/changed-files/ChangedFilesPanel";
import { CommandRunnerPanel } from "./features/command-runner/CommandRunnerPanel";
import { DiffViewerPanel } from "./features/diff-viewer/DiffViewerPanel";
import { RepoPicker } from "./features/repo-picker/RepoPicker";
import {
  getFileDiff,
  inspectRepo,
  listChangedFiles,
  type ChangedFile,
  type RepoSummary,
} from "./lib/repo";

const milestoneItems = [
  "Inspect local Git repositories",
  "Read current branch and working tree state",
  "List changed files with status metadata",
  "Display selected file diffs read-only",
];

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

export default function App() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [repoSummary, setRepoSummary] = useState<RepoSummary | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
  const [changedFilesError, setChangedFilesError] = useState<string | null>(
    null,
  );
  const [isLoadingChangedFiles, setIsLoadingChangedFiles] = useState(false);
  const [selectedChangedFile, setSelectedChangedFile] =
    useState<ChangedFile | null>(null);
  const [diffText, setDiffText] = useState<string | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const diffRequestId = useRef(0);

  function clearSelectedDiff() {
    diffRequestId.current += 1;
    setSelectedChangedFile(null);
    setDiffText(null);
    setDiffError(null);
    setIsLoadingDiff(false);
  }

  async function loadChangedFiles(repoPath: string) {
    setIsLoadingChangedFiles(true);
    setChangedFilesError(null);

    try {
      const files = await listChangedFiles(repoPath);
      setChangedFiles(files);
    } catch (error) {
      setChangedFilesError(
        errorMessage(
          error,
          "Unable to list changed files for the selected repository.",
        ),
      );
    } finally {
      setIsLoadingChangedFiles(false);
    }
  }

  async function handleSelectPath(path: string) {
    setSelectedPath(path);
    setRepoSummary(null);
    setInspectionError(null);
    setChangedFiles([]);
    setChangedFilesError(null);
    clearSelectedDiff();
    setIsInspecting(true);
    setIsLoadingChangedFiles(false);

    try {
      const summary = await inspectRepo(path);
      setRepoSummary(summary);
      setIsInspecting(false);
      await loadChangedFiles(path);
    } catch (error) {
      setInspectionError(
        errorMessage(error, "Unable to inspect the selected repository."),
      );
    } finally {
      setIsInspecting(false);
    }
  }

  async function handleRefreshChangedFiles() {
    if (!repoSummary) {
      return;
    }

    clearSelectedDiff();
    await loadChangedFiles(repoSummary.repo_path);
  }

  async function handleSelectChangedFile(file: ChangedFile) {
    if (!repoSummary) {
      return;
    }

    const requestId = diffRequestId.current + 1;
    diffRequestId.current = requestId;
    setSelectedChangedFile(file);
    setDiffText(null);
    setDiffError(null);
    setIsLoadingDiff(true);

    try {
      const diff = await getFileDiff(repoSummary.repo_path, file.file_path);

      if (diffRequestId.current !== requestId) {
        return;
      }

      setDiffText(diff);
    } catch (error) {
      if (diffRequestId.current !== requestId) {
        return;
      }

      setDiffError(
        errorMessage(error, "Unable to load the diff for the selected file."),
      );
    } finally {
      if (diffRequestId.current === requestId) {
        setIsLoadingDiff(false);
      }
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
          Milestone 3 focuses on read-only diff review: selecting a repository,
          reading its current changed files, and opening a unified diff for one
          file at a time. No staging actions, editing, AI, or cloud.
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

        {repoSummary && (
          <>
            <ChangedFilesPanel
              files={changedFiles}
              error={changedFilesError}
              isLoading={isLoadingChangedFiles}
              selectedFilePath={selectedChangedFile?.file_path ?? null}
              onSelectFile={handleSelectChangedFile}
              onRefresh={handleRefreshChangedFiles}
            />

            <DiffViewerPanel
              selectedFile={selectedChangedFile}
              diffText={diffText}
              error={diffError}
              isLoading={isLoadingDiff}
            />

            {repoSummary.is_git_repo && (
              <CommandRunnerPanel repoPath={repoSummary.repo_path} />
            )}
          </>
        )}

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-medium">Current milestone target</h2>

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
