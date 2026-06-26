# Milestone 5: Pre-Stage Screening

Status: Planned.

## Goal

Add a deterministic local screening panel that summarizes the evidence Staged has already collected before any Stage Payload or AI review exists.

Milestone 5 builds on repository inspection, changed-file listing, diff viewing, and configurable command execution. It should organize local facts, command results, and simple deterministic warnings before any LLM is involved.

This milestone is intentionally narrow. It does not include AI review, risk classification, Stage Payload construction, staging workflows, persistence, or new command execution behavior.

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

Milestone 4 is complete and supports:

- Detecting available root `package.json` scripts for supported npm commands.
- Running allowlisted local verification commands.
- Displaying stdout, stderr, exit code, duration, and success/failure state.

Milestone 5 makes the existing local evidence easier to understand before later milestones introduce AI review or Stage Payload features.

## In Scope

Frontend:

- Frontend Pre-Stage Screening panel.
- Read-only deterministic findings derived from existing app state.
- Summary of selected repository metadata.
- Summary of changed files.
- Summary of file status counts.
- Summary of command runner state.
- Empty state when no valid repo is selected.
- Clear separation between deterministic screening and future AI judgment.

File status counts:

- Added.
- Modified.
- Deleted.
- Renamed.
- Copied.
- Untracked.
- Unknown.

Command runner states:

- No commands available.
- Commands available but not run.
- Last command succeeded.
- Last command failed.
- Command execution error.

Finding levels:

- `pass`.
- `info`.
- `warning`.
- `fail`.

Finding sources:

- `repo`.
- `changed_files`.
- `command_runner`.

## Deterministic Findings

Milestone 5 should include simple local findings such as:

- No changed files detected.
- Untracked files present.
- Deleted files present.
- Renamed or copied files present.
- Command checks have not been run.
- Last command failed.
- No supported npm scripts found.

These findings should be deterministic summaries of known local state. They should not infer intent, estimate risk, or provide AI judgment.

## Out of Scope

The following are outside Milestone 5 and should not be added:

- LLM or AI review.
- Risk classifier.
- Stage Payload.
- Token Budget.
- Staging Ground.
- Stage Report.
- Secret scanning.
- Redaction.
- SQLite.
- Stage History.
- Command history persistence.
- New command execution behavior.
- New Git operations unless absolutely necessary.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Technical Summary

Add a frontend panel conceptually named `PreStageScreeningPanel`.

Add a small typed frontend utility if useful, conceptually named `buildPreStageFindings`.

Use existing app state only:

- Repo summary.
- Changed files.
- Command availability.
- Latest command result.
- Command error/loading state.

Do not add backend screening logic unless strictly necessary. Do not add AI or Stage Payload logic.

Conceptual finding shape:

```ts
type ScreeningFinding = {
  id: string;
  level: "pass" | "info" | "warning" | "fail";
  title: string;
  detail: string;
  source: "repo" | "changed_files" | "command_runner";
};
```

Expected behavior:

- The panel updates when repo selection changes.
- The panel updates when changed files refresh.
- The panel updates when command availability changes.
- The panel updates when the latest command result or command error changes.
- The panel clears stale findings when no valid repository is selected.
- The panel remains read-only.

## UI Behavior

The Pre-Stage Screening panel appears as a deterministic evidence summary for a valid selected repository.

The panel should show:

- Repository metadata summary.
- Changed-file summary.
- File status counts.
- Command runner state summary.
- Findings grouped or listed with visible level and source.

Empty state:

- If no valid repository is selected, show a clear empty state.
- Do not show stale findings from a previous repository.

Deterministic boundary:

- Use copy that makes clear the panel is deterministic local screening.
- Do not present findings as AI judgment.
- Do not include Stage Payload, Stage Report, or risk-classifier language.

## Architecture

```text
React UI state
  ->
Repo summary, changed files, command availability, latest command result, command error/loading state
  ->
buildPreStageFindings
  ->
PreStageScreeningPanel
  ->
Read-only deterministic evidence summary
```

The frontend owns Milestone 5 screening presentation. Backend behavior should remain unchanged unless existing state is insufficient for the panel.

## Manual Test Plan

### Clean valid repository

1. Select a clean valid Git repository.
2. Confirm the panel shows no changed files.
3. Confirm findings are deterministic and read-only.

### Modified tracked file

1. Modify a tracked file.
2. Refresh changed files.
3. Confirm changed-file counts update.

### Untracked file

1. Create an untracked file.
2. Refresh changed files.
3. Confirm an untracked-file warning appears.

### Successful command

1. Run a command that exits with code `0`.
2. Confirm a pass finding appears.
3. Confirm the command runner summary reflects the successful result.

### Failing command

1. Run a command that exits with a non-zero code or trigger a missing script command failure.
2. Confirm a fail finding appears.
3. Confirm the command runner summary reflects the failed result.

### No supported npm scripts

1. Select a repository with no supported root `package.json` scripts.
2. Confirm the screening panel reflects that no supported npm scripts were found.

### Invalid repository

1. Select a non-Git folder.
2. Confirm the panel shows its empty state.
3. Confirm stale findings from the previous repository are not shown.

### Feature boundary

1. Confirm no AI review has been added.
2. Confirm no Stage Payload has been added.
3. Confirm no risk classifier has been added.
4. Confirm no command history persistence has been added.
5. Confirm no new command execution behavior has been added.

## Definition of Done

- Pre-Stage Screening panel exists.
- Panel summarizes deterministic local evidence.
- Panel shows clear `pass`, `info`, `warning`, and `fail` findings.
- Panel summarizes selected repository metadata.
- Panel summarizes changed files and file status counts.
- Panel summarizes command runner state.
- Panel updates when changed files, repo selection, or command result changes.
- Panel clears stale findings when no valid repository is selected.
- Panel remains read-only.
- Panel does not perform AI reasoning.
- No Stage Payload or Stage Report has been added.

## Notes

Milestone 5 is a deterministic screening milestone. Its purpose is to make Staged organize local evidence before later milestones introduce AI review, Stage Payload construction, reporting, or staging workflows.
