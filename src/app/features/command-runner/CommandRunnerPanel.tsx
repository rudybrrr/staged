import { useEffect, useRef, useState } from "react";

import {
  getAvailableRepoCommands,
  runRepoCommand,
  type AvailableCommand,
  type CommandId,
  type CommandResult,
} from "../../lib/repo";

type CommandRunnerPanelProps = {
  repoPath: string;
  onStateChange?: (state: CommandRunnerState) => void;
};

export type CommandRunnerState = {
  availableCommands: AvailableCommand[];
  isLoadingCommands: boolean;
  availabilityError: string | null;
  latestCommandResult: CommandResult | null;
  error: string | null;
  isRunning: boolean;
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

function resultStatusClassName(success: boolean) {
  return success
    ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-200"
    : "border-red-900/70 bg-red-950/40 text-red-200";
}

export function CommandRunnerPanel({
  repoPath,
  onStateChange,
}: CommandRunnerPanelProps) {
  const [availableCommands, setAvailableCommands] = useState<
    AvailableCommand[]
  >([]);
  const [isLoadingCommands, setIsLoadingCommands] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningCommandId, setRunningCommandId] = useState<CommandId | null>(
    null,
  );
  const availabilityRequestId = useRef(0);
  const commandRequestId = useRef(0);
  const isRunning = runningCommandId !== null;

  useEffect(() => {
    onStateChange?.({
      availableCommands,
      isLoadingCommands,
      availabilityError,
      latestCommandResult: result,
      error,
      isRunning,
    });
  }, [
    availableCommands,
    availabilityError,
    error,
    isLoadingCommands,
    isRunning,
    onStateChange,
    result,
  ]);

  useEffect(() => {
    const currentRequestId = availabilityRequestId.current + 1;
    availabilityRequestId.current = currentRequestId;
    commandRequestId.current += 1;

    setAvailableCommands([]);
    setIsLoadingCommands(false);
    setAvailabilityError(null);
    setResult(null);
    setError(null);
    setRunningCommandId(null);
    setIsLoadingCommands(true);

    getAvailableRepoCommands(repoPath)
      .then((commands) => {
        if (availabilityRequestId.current !== currentRequestId) {
          return;
        }

        setAvailableCommands(commands);
      })
      .catch((availabilityLoadError) => {
        if (availabilityRequestId.current !== currentRequestId) {
          return;
        }

        setAvailabilityError(
          errorMessage(
            availabilityLoadError,
            "Unable to check available commands for this repository.",
          ),
        );
      })
      .finally(() => {
        if (availabilityRequestId.current === currentRequestId) {
          setIsLoadingCommands(false);
        }
      });

    return () => {
      availabilityRequestId.current += 1;
      commandRequestId.current += 1;
    };
  }, [repoPath]);

  async function handleRunCommand(command: AvailableCommand) {
    if (!command.available || runningCommandId !== null) {
      return;
    }

    const currentRequestId = commandRequestId.current + 1;
    commandRequestId.current = currentRequestId;
    setResult(null);
    setError(null);
    setRunningCommandId(command.command_id);

    try {
      const commandResult = await runRepoCommand(repoPath, command.command_id);

      if (commandRequestId.current !== currentRequestId) {
        return;
      }

      setResult(commandResult);
    } catch (commandError) {
      if (commandRequestId.current !== currentRequestId) {
        return;
      }

      setError(
        errorMessage(commandError, "Unable to run the selected command."),
      );
    } finally {
      if (commandRequestId.current === currentRequestId) {
        setRunningCommandId(null);
      }
    }
  }

  const hasCommands = availableCommands.length > 0;
  const hasAvailableCommands = availableCommands.some(
    (command) => command.available,
  );

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Command runner</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Commands run locally inside the selected repository.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:justify-end">
          {availableCommands.map((command) => {
            const disabled =
              isRunning || isLoadingCommands || !command.available;

            return (
              <div key={command.command_id} className="max-w-44">
                <button
                  type="button"
                  onClick={() => handleRunCommand(command)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-500"
                >
                  {runningCommandId === command.command_id
                    ? "Running..."
                    : command.label}
                </button>

                {!command.available && command.unavailable_reason && (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {command.unavailable_reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isLoadingCommands && (
        <p className="mt-4 text-sm text-zinc-400">
          Checking supported commands...
        </p>
      )}

      {!isLoadingCommands &&
        !availabilityError &&
        hasCommands &&
        !hasAvailableCommands && (
        <p className="mt-4 text-sm text-zinc-400">
          No supported npm scripts found in this repository.
        </p>
      )}

      {!isLoadingCommands && !availabilityError && !hasCommands && (
        <p className="mt-4 text-sm text-zinc-400">
          No supported commands found for this repository.
        </p>
      )}

      {availabilityError && (
        <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">
            Command availability check failed
          </p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">
            {availabilityError}
          </p>
        </div>
      )}

      {isRunning && (
        <p className="mt-4 text-sm text-zinc-400">Running command...</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">Command failed</p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${resultStatusClassName(
                result.success,
              )}`}
            >
              {result.success ? "Success" : "Failure"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-300">
              Exit code: {result.exit_code ?? "null"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-300">
              Duration: {result.duration_ms} ms
            </span>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Command</p>
            <p className="mt-1 break-all rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
              {result.command}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">stdout</p>
            <pre className="mt-1 max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-200">{result.stdout}</pre>
          </div>

          <div>
            <p className="text-sm text-zinc-500">stderr</p>
            <pre className="mt-1 max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-200">{result.stderr}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
