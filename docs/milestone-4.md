# Milestone 4: Configurable Command Runner

Status: Planned.

## Goal

Allow the user to run local verification commands, such as test, lint, and typecheck commands, against the selected repository and capture deterministic execution results before any AI review.

Milestone 4 builds on the repo inspection, changed-files list, and diff viewer by adding a narrow local command execution surface. The command runner collects evidence from configured verification commands and displays the result in the app.

This milestone is intentionally narrow. It does not include arbitrary command input, background jobs, streaming output, persistence, staging workflows, or AI features.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestone 0 is complete.

Milestone 1 is complete and supports:

- Opening as a Tauri desktop app.
- Selecting a local folder.
- Validating whether the selected folder is a Git repository.
- Showing repo path.
- Showing repo name.
- Showing current branch.
- Showing clean or dirty working tree state.

Milestone 2 is complete and supports:

- Listing changed files.
- Showing changed file status.
- Refreshing changed files manually.

Milestone 3 is complete and supports:

- Selecting a changed file.
- Displaying a read-only unified diff for the selected changed file.

Milestone 4 should make local verification commands runnable and inspectable before any later screening or AI review work.

## In Scope

Backend:

- Backend Tauri command conceptually named `run_repo_command`.
- Rust/Tauri backend command execution.
- Allowlisted local command execution inside the selected repository.
- Capture command text.
- Capture stdout.
- Capture stderr.
- Capture exit code.
- Capture duration in milliseconds.
- Return pass/fail status based on exit code.
- Clear error return if command execution fails.

Frontend:

- Frontend helper conceptually named `runRepoCommand(repoPath, commandId)`.
- Command runner panel.
- Buttons for configured MVP commands.
- Loading state while a command is running.
- Success state for exit code `0`.
- Failure state for non-zero exit code.
- Error state if command execution fails.
- Read-only command output.

Configured MVP commands:

- `npm test`
- `npm run lint`
- `npm run typecheck`

## Out of Scope

The following are outside Milestone 4 and should not be added:

- Arbitrary shell command input.
- Background jobs.
- Long-running process management.
- Streaming output.
- Killing running commands.
- Command history persistence.
- SQLite.
- Pre-Stage Screening.
- Risk classifier.
- Stage Payload.
- Token Budget.
- Staging Ground.
- Stage Report.
- AI features.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Security and Scope Notes

- Do not start with arbitrary user-entered shell commands.
- Do not run commands outside the selected repository.
- Prefer a small allowlist of commands for the MVP.
- Treat this milestone as deterministic local evidence collection, not AI reasoning.
- The frontend should select from known command IDs, not send raw shell input.
- The backend should map command IDs to configured command arguments.

## Technical Summary

Backend command:

```rust
run_repo_command(repo_path: String, command_id: String) -> Result<CommandResult, String>
```

Serializable result shape:

```ts
type CommandResult = {
  command_id: string;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  duration_ms: number;
  success: boolean;
};
```

Frontend helper:

```ts
runRepoCommand(repoPath, commandId)
```

The backend owns process execution details. The frontend invokes the configured command by ID and renders the returned result.

## Command Allowlist

Milestone 4 should support a small command allowlist:

```text
npm_test      -> npm test
npm_lint      -> npm run lint
npm_typecheck -> npm run typecheck
```

Expected behavior:

- Unknown command IDs return an error.
- Commands run with the selected repository as the working directory.
- Commands do not run for invalid or missing repository paths.
- Exit code `0` returns `success: true`.
- Non-zero exit codes return `success: false`.
- Process launch failures return an error state for the UI.

## UI Behavior

The command runner panel appears only when a valid Git repository is selected.

The panel shows:

- Configured command buttons.
- Current running state when a command is executing.
- Command text for the latest result.
- stdout.
- stderr.
- exit code.
- duration in milliseconds.
- pass/fail state.

The command output is read-only.

Empty state:

- Before any command has run, show a neutral empty state.

Loading state:

- While a command is running, disable or guard command execution to avoid overlapping runs.
- Show which command is running.

Success state:

- If the command exits with code `0`, show a successful result.

Failure state:

- If the command exits with a non-zero code, show a failed result with captured stdout, stderr, exit code, and duration.

Error state:

- If command execution fails before an exit code is available, show a clear non-crashing error.

## Architecture

```text
React UI
  ->
Command button click
  ->
Frontend runRepoCommand(repoPath, commandId)
  ->
Tauri invoke
  ->
Rust command run_repo_command(repo_path, command_id)
  ->
Allowlist maps command_id to command arguments
  ->
Process runs inside selected repository
  ->
CommandResult returned to UI
  ->
Read-only command result panel
```

## Manual Test Plan

### `npm test`

1. Select a valid Git repository with a test script.
2. Run `npm test` from the command runner.
3. Confirm stdout or stderr is captured.
4. Confirm exit code, duration, and pass/fail state are visible.

### Successful command

1. Select a valid Git repository where one configured command exits with code `0`.
2. Run that command.
3. Confirm the UI shows a success state.
4. Confirm command output is read-only.

### Failing command

1. Select a valid Git repository where one configured command exits non-zero.
2. Run that command.
3. Confirm the UI shows a failure state.
4. Confirm stdout, stderr, exit code, and duration are visible.

### Missing package script

1. Select a valid Git repository missing one configured package script.
2. Run the missing-script command.
3. Confirm stderr and failure state are displayed.
4. Confirm the app does not crash.

### Invalid repository

1. Select a non-Git folder.
2. Confirm the command runner does not run commands.
3. Confirm no command output is produced for the invalid folder.

### Feature boundary

1. Confirm no arbitrary shell input has been added.
2. Confirm no command history persistence has been added.
3. Confirm no AI, Stage Payload, or Pre-Stage Screening features have been added.
4. Confirm command output remains read-only.

## Definition of Done

- Backend command runner exists and passes `cargo check`.
- Frontend can run configured commands for the selected repo.
- stdout, stderr, exit code, duration, and pass/fail state are visible.
- Command output is read-only.
- No arbitrary shell input has been added.
- No Pre-Stage Screening or AI-related features have been added.

## Notes

Milestone 4 is an execution evidence milestone. It should collect deterministic local command results before later milestones introduce screening, risk analysis, payload construction, reports, or AI-assisted review.
