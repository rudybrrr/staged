import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FolderGit2,
  GitBranch,
  GitCompare,
  XCircle,
} from "lucide-react";

import { ChangedFilesPanel } from "./features/changed-files/ChangedFilesPanel";
import {
  CommandRunnerPanel,
  type CommandRunnerState,
} from "./features/command-runner/CommandRunnerPanel";
import { DiffViewerPanel } from "./features/diff-viewer/DiffViewerPanel";
import { PreStageScreeningPanel } from "./features/pre-stage-screening/PreStageScreeningPanel";
import { RepoPicker } from "./features/repo-picker/RepoPicker";
import { SafetyGatePanel } from "./features/safety-gate/SafetyGatePanel";
import { StageReportPanel } from "./features/stage-report/StageReportPanel";
import { StagePayloadPreviewPanel } from "./features/stage-payload/StagePayloadPreviewPanel";
import { StagingGroundPanel } from "./features/staging-ground/StagingGroundPanel";
import { TokenBudgetPanel } from "./features/token-budget/TokenBudgetPanel";
import {
  getFileDiff,
  inspectRepo,
  listChangedFiles,
  type ChangedFile,
  type RepoSummary,
} from "./lib/repo";
import { buildPreStageFindings } from "./lib/screening";
import { buildSafetyGateResult } from "./lib/safetyGate";
import { buildLocalStageReportPreview } from "./lib/stageReport";
import { buildStagePayload } from "./lib/stagePayload";
import { buildStagingGroundReadiness } from "./lib/stagingGround";
import { buildTokenBudget } from "./lib/tokenBudget";
import {
  AppShell,
  EmptyState,
  MetricPill,
  Panel,
  SectionHeader,
  StatusBadge,
  type StatusTone,
} from "./ui";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

function createInitialCommandRunnerState(): CommandRunnerState {
  return {
    availableCommands: [],
    isLoadingCommands: false,
    availabilityError: null,
    latestCommandResult: null,
    error: null,
    isRunning: false,
  };
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
  const [commandRunnerState, setCommandRunnerState] =
    useState<CommandRunnerState>(() => createInitialCommandRunnerState());
  const handleCommandRunnerStateChange = useCallback(
    (state: CommandRunnerState) => {
      setCommandRunnerState(state);
    },
    [],
  );
  const diffRequestId = useRef(0);
  const repoRequestId = useRef(0);
  const screeningFindings = useMemo(
    () =>
      buildPreStageFindings({
        repoSummary,
        changedFiles,
        availableCommands: commandRunnerState.availableCommands,
        latestCommandResult: commandRunnerState.latestCommandResult,
        commandError: commandRunnerState.error,
        commandAvailabilityError: commandRunnerState.availabilityError,
        isCommandRunning: commandRunnerState.isRunning,
        isLoadingCommands: commandRunnerState.isLoadingCommands,
      }),
    [
      changedFiles,
      commandRunnerState.availabilityError,
      commandRunnerState.availableCommands,
      commandRunnerState.error,
      commandRunnerState.isLoadingCommands,
      commandRunnerState.isRunning,
      commandRunnerState.latestCommandResult,
      repoSummary,
    ],
  );
  const stagePayload = useMemo(() => {
    if (!repoSummary?.is_git_repo) {
      return null;
    }

    return buildStagePayload({
      repoSummary,
      changedFiles,
      selectedFile: selectedChangedFile,
      selectedFileDiff: diffText,
      latestCommandResult: commandRunnerState.latestCommandResult,
      commandError: commandRunnerState.error ?? commandRunnerState.availabilityError,
      availableCommands: commandRunnerState.availableCommands,
      screeningFindings,
    });
  }, [
    changedFiles,
    commandRunnerState.availabilityError,
    commandRunnerState.availableCommands,
    commandRunnerState.error,
    commandRunnerState.latestCommandResult,
    diffText,
    repoSummary,
    screeningFindings,
    selectedChangedFile,
  ]);
  const tokenBudget = useMemo(() => {
    if (!stagePayload) {
      return null;
    }

    return buildTokenBudget(stagePayload);
  }, [stagePayload]);
  const safetyGateResult = useMemo(() => {
    if (!stagePayload) {
      return null;
    }

    return buildSafetyGateResult(stagePayload);
  }, [stagePayload]);
  const stagingGroundReadiness = useMemo(
    () =>
      buildStagingGroundReadiness(stagePayload, tokenBudget, safetyGateResult),
    [stagePayload, safetyGateResult, tokenBudget],
  );
  const stageReport = useMemo(
    () =>
      buildLocalStageReportPreview({
        stagePayload,
        tokenBudget,
        safetyGateResult,
        stagingGroundReadiness,
      }),
    [safetyGateResult, stagePayload, stagingGroundReadiness, tokenBudget],
  );

  function clearSelectedDiff() {
    diffRequestId.current += 1;
    setSelectedChangedFile(null);
    setDiffText(null);
    setDiffError(null);
    setIsLoadingDiff(false);
  }

  async function loadChangedFiles(
    repoPath: string,
    requestId = repoRequestId.current,
  ) {
    setIsLoadingChangedFiles(true);
    setChangedFilesError(null);

    try {
      const files = await listChangedFiles(repoPath);

      if (repoRequestId.current !== requestId) {
        return;
      }

      setChangedFiles(files);
    } catch (error) {
      if (repoRequestId.current !== requestId) {
        return;
      }

      setChangedFilesError(
        errorMessage(
          error,
          "Unable to list changed files for the selected repository.",
        ),
      );
    } finally {
      if (repoRequestId.current === requestId) {
        setIsLoadingChangedFiles(false);
      }
    }
  }

  async function handleSelectPath(path: string) {
    const requestId = repoRequestId.current + 1;
    repoRequestId.current = requestId;

    setSelectedPath(path);
    setRepoSummary(null);
    setInspectionError(null);
    setChangedFiles([]);
    setChangedFilesError(null);
    clearSelectedDiff();
    setCommandRunnerState(createInitialCommandRunnerState());
    setIsInspecting(true);
    setIsLoadingChangedFiles(false);

    try {
      const summary = await inspectRepo(path);

      if (repoRequestId.current !== requestId) {
        return;
      }

      setRepoSummary(summary);
      setIsInspecting(false);
      await loadChangedFiles(path, requestId);
    } catch (error) {
      if (repoRequestId.current !== requestId) {
        return;
      }

      setInspectionError(
        errorMessage(error, "Unable to inspect the selected repository."),
      );
    } finally {
      if (repoRequestId.current === requestId) {
        setIsInspecting(false);
      }
    }
  }

  async function handleRefreshChangedFiles() {
    if (!repoSummary) {
      return;
    }

    clearSelectedDiff();
    await loadChangedFiles(repoSummary.repo_path, repoRequestId.current);
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

  let repoStatus: { tone: StatusTone; label: string } = {
    tone: "idle",
    label: "No repo selected",
  };

  if (inspectionError) {
    repoStatus = { tone: "fail", label: "Invalid repo" };
  } else if (selectedPath && isInspecting) {
    repoStatus = { tone: "idle", label: "Inspecting…" };
  } else if (repoSummary) {
    if (!repoSummary.is_git_repo) {
      repoStatus = { tone: "fail", label: "Not a Git repository" };
    } else if (repoSummary.has_uncommitted_changes) {
      repoStatus = { tone: "info", label: "Dirty" };
    } else {
      repoStatus = { tone: "pass", label: "Clean" };
    }
  }

  const safetyGateStatus =
    safetyGateResult &&
    (
      {
        pass: { tone: "pass", label: "Safety Gate: Pass" },
        warning: { tone: "warning", label: "Safety Gate: Warning" },
        blocked: { tone: "blocked", label: "Safety Gate: Blocked" },
      } satisfies Record<string, { tone: StatusTone; label: string }>
    )[safetyGateResult.status];

  const header = (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
      <div className="flex items-baseline gap-3">
        <span className="text-base font-semibold tracking-tight text-zinc-100">
          Staged
        </span>
        <span className="hidden text-xs text-zinc-500 sm:inline">
          Local-first verification before commit
        </span>
        <StatusBadge tone="preview">Local preview</StatusBadge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {repoSummary && (
          <>
            <span className="text-xs font-medium text-zinc-300">
              {repoSummary.repo_name}
            </span>
            <span
              className="max-w-[220px] truncate font-mono text-xs text-zinc-500"
              title={repoSummary.repo_path}
            >
              {repoSummary.repo_path}
            </span>
            {repoSummary.current_branch && (
              <MetricPill label="Branch" value={repoSummary.current_branch} />
            )}
          </>
        )}

        <StatusBadge tone={repoStatus.tone}>{repoStatus.label}</StatusBadge>

        {repoSummary && (
          <MetricPill
            label="Changed"
            value={changedFiles.length}
            tone={changedFiles.length > 0 ? "info" : "idle"}
          />
        )}

        {safetyGateStatus && (
          <StatusBadge tone={safetyGateStatus.tone}>
            {safetyGateStatus.label}
          </StatusBadge>
        )}

        {tokenBudget && (
          <MetricPill
            label="Tokens"
            value={tokenBudget.estimated_tokens.toLocaleString()}
            tone={
              tokenBudget.warnings.some((warning) => warning.level === "warning")
                ? "warning"
                : "idle"
            }
          />
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      header={header}
      rail={
        <>
          <StagePayloadPreviewPanel payload={stagePayload} />

          <TokenBudgetPanel budget={tokenBudget} />

          <StagingGroundPanel
            hasValidRepo={repoSummary?.is_git_repo ?? false}
            readiness={stagingGroundReadiness}
          />

          <SafetyGatePanel result={safetyGateResult} />

          <StageReportPanel report={stageReport} />
        </>
      }
    >
      <SectionHeader
        title="Repository and changes"
        icon={<FolderGit2 className="h-4 w-4" />}
      />

      <RepoPicker selectedPath={selectedPath} onSelectPath={handleSelectPath} />

      <Panel
        title="Repository inspection"
        icon={<GitBranch className="h-5 w-5" />}
        status={
          selectedPath
            ? { tone: repoStatus.tone, label: repoStatus.label }
            : undefined
        }
      >
        {!selectedPath && (
          <EmptyState
            icon={<GitBranch className="h-5 w-5" />}
            title="No repository selected"
            description="Select a local Git repository above to begin inspection."
          />
        )}

        {selectedPath && isInspecting && (
          <p className="text-sm text-zinc-400">Inspecting repository...</p>
        )}

        {inspectionError && (
          <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-200" />
              <p className="text-sm font-medium text-red-200">
                Repository inspection failed
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-red-100/80">
              {inspectionError}
            </p>
          </div>
        )}

        {repoSummary && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-zinc-500">Repo name</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {repoSummary.repo_name}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Current branch</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
                {repoSummary.current_branch ?? "Detached HEAD / unknown"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Git repository status</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                {repoSummary.is_git_repo ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
                {repoSummary.is_git_repo
                  ? "Valid Git repository"
                  : "Not a Git repository"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Working tree state</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                {repoSummary.has_uncommitted_changes ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
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
      </Panel>

      {repoSummary && (
        <ChangedFilesPanel
          files={changedFiles}
          error={changedFilesError}
          isLoading={isLoadingChangedFiles}
          selectedFilePath={selectedChangedFile?.file_path ?? null}
          onSelectFile={handleSelectChangedFile}
          onRefresh={handleRefreshChangedFiles}
        />
      )}

      {repoSummary && (
        <>
          <SectionHeader
            title="Diff and local checks"
            icon={<GitCompare className="h-4 w-4" />}
          />

          <DiffViewerPanel
            selectedFile={selectedChangedFile}
            diffText={diffText}
            error={diffError}
            isLoading={isLoadingDiff}
          />

          {repoSummary.is_git_repo && (
            <CommandRunnerPanel
              repoPath={repoSummary.repo_path}
              onStateChange={handleCommandRunnerStateChange}
            />
          )}
        </>
      )}

      <SectionHeader
        title="Deterministic screening"
        icon={<ClipboardCheck className="h-4 w-4" />}
      />

      <PreStageScreeningPanel
        repoSummary={repoSummary}
        changedFiles={changedFiles}
        availableCommands={commandRunnerState.availableCommands}
        latestCommandResult={commandRunnerState.latestCommandResult}
        commandError={commandRunnerState.error}
        commandAvailabilityError={commandRunnerState.availabilityError}
        isCommandRunning={commandRunnerState.isRunning}
        isLoadingCommands={commandRunnerState.isLoadingCommands}
      />
    </AppShell>
  );
}
