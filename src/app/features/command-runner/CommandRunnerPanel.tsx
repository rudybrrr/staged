import { useEffect, useRef, useState } from "react";

import {
  runRepoCommand,
  type CommandResult,
} from "../../lib/repo";

type CommandId = "npm_test" | "npm_lint" | "npm_typecheck";

type CommandOption = {
  id: CommandId;
  label: string;
};

type CommandRunnerPanelProps = {
  repoPath: string;
};

const commandOptions: CommandOption[] = [
  { id: "npm_test", label: "npm test" },
  { id: "npm_lint", label: "npm run lint" },
  { id: "npm_typecheck", label: "npm run typecheck" },
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

function resultStatusClassName(success: boolean) {
  return success
    ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-200"
    : "border-red-900/70 bg-red-950/40 text-red-200";
}

export function CommandRunnerPanel({ repoPath }: CommandRunnerPanelProps) {
  const [result, setResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningCommandId, setRunningCommandId] = useState<CommandId | null>(
    null,
  );
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setResult(null);
    setError(null);
    setRunningCommandId(null);
  }, [repoPath]);

  async function handleRunCommand(commandId: CommandId) {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setResult(null);
    setError(null);
    setRunningCommandId(commandId);

    try {
      const commandResult = await runRepoCommand(repoPath, commandId);

      if (requestId.current !== currentRequestId) {
        return;
      }

      setResult(commandResult);
    } catch (commandError) {
      if (requestId.current !== currentRequestId) {
        return;
      }

      setError(
        errorMessage(commandError, "Unable to run the selected command."),
      );
    } finally {
      if (requestId.current === currentRequestId) {
        setRunningCommandId(null);
      }
    }
  }

  const isRunning = runningCommandId !== null;

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Command runner</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Commands run locally inside the selected repository.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {commandOptions.map((command) => (
            <button
              key={command.id}
              type="button"
              onClick={() => handleRunCommand(command.id)}
              disabled={isRunning}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-500"
            >
              {runningCommandId === command.id ? "Running..." : command.label}
            </button>
          ))}
        </div>
      </div>

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