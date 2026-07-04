import { useEffect, useRef, useState } from "react";
import { TerminalSquare } from "lucide-react";

import {
  getAvailableRepoCommands,
  runRepoCommand,
  type AvailableCommand,
  type CommandId,
  type CommandResult,
} from "../../lib/repo";
import {
  ActionButton,
  CodeBlock,
  EmptyState,
  MetricPill,
  Panel,
  StatusBadge,
} from "../../ui";

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
    <Panel
      title="Command runner"
      icon={<TerminalSquare className="h-5 w-5" />}
      description="Commands run locally inside the selected repository."
    >
      {hasCommands && (
        <div className="flex flex-wrap gap-3">
          {availableCommands.map((command) => {
            const disabled =
              isRunning || isLoadingCommands || !command.available;

            return (
              <div key={command.command_id} className="max-w-44">
                <ActionButton
                  variant="secondary"
                  onClick={() => handleRunCommand(command)}
                  disabled={disabled}
                  className="w-full"
                >
                  {runningCommandId === command.command_id
                    ? "Running..."
                    : command.label}
                </ActionButton>

                {!command.available && command.unavailable_reason && (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {command.unavailable_reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isLoadingCommands && (
        <p className="text-sm text-zinc-400">Checking supported commands...</p>
      )}

      {!isLoadingCommands &&
        !availabilityError &&
        hasCommands &&
        !hasAvailableCommands && (
          <EmptyState
            title="No available commands"
            description="No supported npm scripts found in this repository."
          />
        )}

      {!isLoadingCommands && !availabilityError && !hasCommands && (
        <EmptyState
          icon={<TerminalSquare className="h-5 w-5" />}
          title="No supported commands"
          description="No supported commands found for this repository."
        />
      )}

      {availabilityError && (
        <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">
            Command availability check failed
          </p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">
            {availabilityError}
          </p>
        </div>
      )}

      {isRunning && (
        <p className="text-sm text-zinc-400">Running command...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-200">Command failed</p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
        </div>
      )}

      {hasAvailableCommands && !isRunning && !error && !result && (
        <EmptyState
          title="No command run yet"
          description="Run one of the commands above to see its output here."
        />
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={result.success ? "pass" : "fail"}>
              {result.success ? "Success" : "Failure"}
            </StatusBadge>
            <MetricPill label="Exit code" value={result.exit_code ?? "null"} />
            <MetricPill label="Duration" value={`${result.duration_ms} ms`} />
          </div>

          <div>
            <p className="text-sm text-zinc-500">Command</p>
            <p className="mt-1 break-all rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200">
              {result.command}
            </p>
          </div>

          <CodeBlock label="stdout">{result.stdout}</CodeBlock>
          <CodeBlock label="stderr">{result.stderr}</CodeBlock>
        </div>
      )}
    </Panel>
  );
}
