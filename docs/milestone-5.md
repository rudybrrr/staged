# Milestone 5: Pre-Stage Screening

Status: Implemented.

## Goal

Add a deterministic local screening panel that summarizes the evidence Staged has already collected before any Stage Payload or AI review exists.

Milestone 5 builds on repository inspection, changed-file listing, diff viewing, and configurable command execution. It organizes local facts, command results, and simple deterministic warnings before any LLM is involved.

This milestone is intentionally narrow and is now implemented. It does not include AI review, risk classification, Stage Payload construction, staging workflows, persistence, or new command execution behavior.

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

Milestone 5 is complete and makes the existing local evidence easier to understand before later milestones introduce AI review or Stage Payload features.

## Implemented

Frontend:

- Frontend Pre-Stage Screening panel.
- Deterministic local findings derived from existing app state.
- Repo summary in the screening panel.
- Changed-file count summary.
- File status count summary.
- Command runner summary.
- Read-only UI.
- Clear separation between deterministic screening and future AI judgment.
- Stale screening state clears when selecting invalid folders or switching repos.

File status counts:

- Added.
- Modified.
- Deleted.
- Renamed.
- Copied.
- Untracked.
- Unknown.

Command runner summary:

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

Milestone 5 includes local findings for:

- Valid repo selected.
- No changed files detected.
- Untracked files present.
- Deleted files present.
- Renamed or copied files present.
- Command checks have not been run.
- Latest command succeeded.
- Latest command failed.
- Command execution error.
- No supported npm scripts found.

These findings are deterministic summaries of known local state only. They do not infer intent, estimate risk, or provide AI judgment.

## Not Implemented Yet

The following are outside the implemented Milestone 5 scope and do not exist yet:

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

Milestone 5 is implemented in the frontend as a read-only deterministic screening panel.

The screening logic uses existing app state only:

- Repository summary.
- Changed files.
- Command availability.
- Latest command result.
- Command error/loading state.

No AI review, Stage Payload, Stage Report, persistence layer, secret scanning, redaction, or new Git operation is part of this milestone.

Finding levels:

- `pass`.
- `info`.
- `warning`.
- `fail`.

Implemented behavior:

- The panel updates when repo selection changes.
- The panel updates when changed files refresh.
- The panel updates when command availability changes.
- The panel updates when the latest command result or command error changes.
- The panel clears stale findings when no valid repository is selected.
- The panel remains read-only.

## UI Behavior

The Pre-Stage Screening panel appears as a deterministic evidence summary for a valid selected repository.

The panel shows:

- Repository metadata summary.
- Changed-file summary.
- File status counts.
- Command runner state summary.
- Findings with visible level and source.

Empty state:

- If no valid repository is selected, show a clear empty state.
- Do not show stale findings from a previous repository.

Deterministic boundary:

- The panel copy makes clear that screening is deterministic local evidence only.
- Findings are not presented as AI judgment.
- Stage Payload, Stage Report, and risk-classifier features are not present.

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

The frontend owns Milestone 5 screening presentation. Backend behavior remains focused on repository inspection, changed files, diffs, command availability, and command execution.

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
