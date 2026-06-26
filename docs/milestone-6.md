# Milestone 6: Stage Payload Builder

Status: Planned.

## Goal

Build a compact, structured evidence bundle from existing local data that can later be reviewed in Staging Ground and eventually sent to an LLM, without making any AI call yet.

Milestone 6 proves that Staged can reduce and organize the local evidence an AI would need to review. The app should not send a whole repository or blindly dump all available data. It should build a structured Stage Payload from known local evidence only.

This milestone is intentionally narrow. It does not include AI review, OpenAI API integration, token budgeting, Staging Ground approval, Stage Reports, persistence, secret scanning, redaction, or backend payload construction unless strictly necessary.

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

Milestone 5 is complete and supports:

- Showing deterministic Pre-Stage Screening findings from local app state.
- Summarizing repository state, changed files, file status counts, and command runner state.

Milestone 6 will package those existing local facts into a structured read-only preview.

## In Scope

Frontend:

- Stage Payload builder.
- Frontend type conceptually named `StagePayload`.
- Frontend utility conceptually named `buildStagePayload`.
- Frontend panel conceptually named `StagePayloadPreviewPanel`.
- Read-only payload preview panel.
- Formatted JSON preview.
- Clear copy that the preview is local only.

Payload contents:

- Selected repository metadata.
- Changed-file summary.
- Changed-file status counts.
- Selected changed files or all changed files for the first version.
- Diff text for the currently selected file if already loaded.
- Latest command result.
- Command error if available.
- Pre-Stage Screening findings.
- Payload metadata:
  - `created_at`
  - `repo_path`
  - `repo_name`
  - `current_branch`
  - `changed_file_count`

State inputs:

- Repo summary.
- Changed files.
- Status counts.
- Selected file.
- Selected file diff if available.
- Latest command result.
- Command error if available.
- Pre-Stage Screening findings.

## Out of Scope

The following must not be added in Milestone 6:

- LLM or AI review.
- OpenAI API integration.
- Token Budget.
- Staging Ground approval workflow.
- Stage Report.
- Risk classifier.
- Secret scanning.
- Redaction.
- SQLite.
- Stage History.
- Command history persistence.
- Diff retrieval for every file.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Technical Summary

Milestone 6 should be implemented in the frontend using existing local app state. Backend payload logic should not be added unless strictly necessary.

Conceptual payload shape:

```ts
type StagePayload = {
  schema_version: string;
  created_at: string;
  repo: {
    repo_path: string;
    repo_name: string;
    current_branch: string | null;
    is_git_repo: boolean;
    has_uncommitted_changes: boolean;
  };
  changes: {
    changed_file_count: number;
    status_counts: Record<string, number>;
    files: Array<{
      file_path: string;
      old_file_path: string | null;
      status: string;
      is_staged: boolean;
      is_unstaged: boolean;
      is_untracked: boolean;
    }>;
    selected_file_diff: {
      file_path: string;
      diff: string;
    } | null;
  };
  command_result: {
    command_id: string;
    command: string;
    exit_code: number | null;
    duration_ms: number;
    success: boolean;
    stdout: string;
    stderr: string;
  } | null;
  screening_findings: Array<{
    id: string;
    level: "pass" | "info" | "warning" | "fail";
    title: string;
    detail: string;
    source: "repo" | "changed_files" | "command_runner";
  }>;
};
```

Expected builder behavior:

- Return `null` or an empty state when no valid Git repository is selected.
- Build payloads from existing state only.
- Include the selected file diff only when it is already loaded.
- Do not fetch diffs for every changed file.
- Do not persist payloads.
- Do not send payloads over the network.
- Do not call AI services.

## UI Behavior

The Stage Payload preview appears when a valid Git repository is selected.

The panel shows:

- A local-only preview notice.
- A read-only formatted JSON payload.
- An empty state when no valid Git repository is selected.

The preview updates when existing state changes:

- Repo selection changes.
- Changed files refresh.
- Selected changed file changes.
- Selected file diff loads.
- Latest command result changes.
- Command error changes.
- Pre-Stage Screening findings change.

Stale payloads must clear when selecting a non-Git folder or switching away from a valid repository.

The panel does not include approval actions, AI review actions, report generation, token budgeting, or persistence controls.

## Architecture

```text
React UI state
  ->
Repo summary, changed files, status counts, selected file, loaded diff, command result, command error, screening findings
  ->
buildStagePayload
  ->
StagePayloadPreviewPanel
  ->
Read-only local JSON preview
```

The frontend owns payload construction for Milestone 6. Existing backend commands remain focused on repository inspection, changed files, diffs, and command execution.

## Manual Test Plan

### Valid repository

1. Select a valid Git repository.
2. Confirm a Stage Payload preview appears.
3. Confirm repository metadata appears in the payload.

### Modified tracked file

1. Modify a tracked file.
2. Refresh changed files.
3. Confirm changed-file data appears in the payload.
4. Confirm status counts update.

### Selected file diff

1. Select a changed file.
2. Confirm the selected file diff appears in the payload if the diff has already loaded.
3. Confirm the app does not fetch diffs for every changed file.

### Command result

1. Run a supported command.
2. Confirm the latest command result appears in the payload.
3. Confirm stdout, stderr, exit code, duration, command ID, and success state are included.

### Pre-Stage Screening findings

1. Confirm Pre-Stage Screening findings are visible in the app.
2. Confirm those findings appear in the payload.

### Invalid repository

1. Select a non-Git folder.
2. Confirm no stale payload remains.
3. Confirm the preview shows an empty state.

### Feature boundary

1. Confirm no AI call has been added.
2. Confirm no OpenAI API integration has been added.
3. Confirm no Token Budget has been added.
4. Confirm no Staging Ground approval workflow has been added.
5. Confirm no Stage Report has been added.
6. Confirm no persistence has been added.

## Definition of Done

- Stage Payload type exists.
- Payload builder utility exists.
- Payload preview panel exists.
- Payload uses existing local evidence only.
- Payload includes repository metadata.
- Payload includes changed-file summary and status counts.
- Payload includes selected file diff only if already loaded.
- Payload includes latest command result when available.
- Payload includes Pre-Stage Screening findings.
- Payload preview is read-only.
- Payload clears when no valid Git repository is selected.
- No AI integration has been added.
- No Token Budget has been added.
- No Stage Report has been added.
- No persistence has been added.

## Notes

Milestone 6 is a payload-construction milestone. Its purpose is to organize local evidence into a compact structured preview before later milestones introduce approval workflows, token budgeting, AI review, reports, history, or integrations.
