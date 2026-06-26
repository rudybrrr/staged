# Milestone 3: Diff Viewer

Status: Planned.

## Goal

Allow the user to inspect the Git diff for changed files before moving to command execution or Pre-Stage Screening.

Milestone 3 builds on Milestone 2 by making the changed-files list inspectable. After the user selects a valid Git repository and sees changed files, Staged should let the user select a file and view its Git diff in a read-only diff panel.

This milestone is intentionally narrow. It does not include syntax highlighting, file editing, staging workflows, command execution, risk analysis, persistence, or AI features.

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

Milestone 3 makes those changed files reviewable by displaying their unified Git diff.

## In Scope

Backend:

- Backend Tauri command to get a Git diff for the selected repository.
- Git CLI execution through the Rust/Tauri backend.
- Unified diff text as the initial diff format.
- Diff retrieval for a selected changed file.
- Diff retrieval for all unstaged changes if useful for implementation simplicity.
- Clear error return when Git diff fails.

Frontend:

- Frontend helper for requesting a file diff.
- Changed-file selection behavior.
- Diff viewer panel.
- Readable monospace rendering of unified diff text.
- Loading state while fetching diff.
- Empty state when a selected file has no available diff.
- Error state when diff retrieval fails.
- Read-only diff display.

## Out of Scope

The following are outside Milestone 3:

- Syntax-highlighted diff rendering.
- Inline comments.
- File editing.
- Patch application.
- Git staging or unstaging.
- Command runner.
- Pre-Stage Screening.
- Risk classifier.
- Stage Payload.
- Token Budget.
- Staging Ground.
- Stage Report.
- SQLite.
- AI features.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Technical Scope

Backend target command:

```rust
get_file_diff(repo_path: String, file_path: String) -> Result<String, String>
```

Optional backend command, only if useful for implementation simplicity:

```rust
get_repo_diff(repo_path: String) -> Result<String, String>
```

Frontend target helper:

```ts
getFileDiff(repoPath, filePath)
```

The backend should continue to own Git CLI details. The frontend should request diff text through Tauri commands and should not shell out to Git directly.

## Git Command Direction

The selected-file diff should use the selected repository path and file path. Conceptually:

```bash
git -C <repo_path> diff -- <file_path>
```

If a repository-wide unstaged diff is added, it can use:

```bash
git -C <repo_path> diff
```

Expected behavior:

- Modified tracked files return unified diff text.
- Clean files return an empty diff string.
- Diff command failures return a string error for the UI.
- Untracked files are handled clearly, even if no standard `git diff` output is available.
- The UI remains read-only.

## UI Behavior

The diff viewer appears after a valid repo is selected and changed files are available.

Expected interaction:

- The user selects a changed file.
- The frontend requests the selected file diff.
- The diff panel shows a loading state while the request is in progress.
- The diff panel renders unified diff text in a readable monospace block.
- If the selected file has no available diff, the panel shows a clear empty state.
- If Git diff fails, the panel shows a clear non-crashing error.

The diff viewer must not allow editing, staging, unstaging, patch application, command execution, or AI actions.

## Architecture

```text
React UI
  ->
Changed file selection
  ->
Frontend diff request
  ->
Tauri invoke
  ->
Rust command get_file_diff(repo_path, file_path)
  ->
git -C <repo_path> diff -- <file_path>
  ->
Unified diff text returned to UI
  ->
Read-only diff panel
```

## Manual Test Plan

### Modified tracked file

1. Modify a tracked file in a valid Git repository.
2. Open or refresh the repo in Staged.
3. Select the modified file.
4. Confirm its unified diff is displayed.

### Untracked file

1. Create an untracked file in a valid Git repository.
2. Open or refresh the repo in Staged.
3. Select the untracked file.
4. Confirm the app handles it clearly, either with a diff if supported or a clear empty state.

### No available diff

1. Select a changed file that has no available diff output.
2. Confirm the diff panel shows a clear empty state.
3. Confirm the app does not treat the empty diff as a crash.

### Git diff failure

1. Select a non-Git folder or otherwise trigger a safe Git diff failure.
2. Confirm the UI shows a clear error.
3. Confirm the app remains usable.

### Feature boundary

1. Confirm the diff panel is read-only.
2. Confirm no file editing features were added.
3. Confirm no staging or unstaging features were added.
4. Confirm no command runner features were added.
5. Confirm no AI-related features were added.

## Definition of Done

- Backend diff command exists and passes `cargo check`.
- Frontend can display diff for a changed file.
- Diff viewer has loading, empty, and error states.
- Diff viewer is read-only.
- No command runner or AI-related features have been added.

## Notes

Milestone 3 is a review surface, not an execution surface. Its purpose is to let the user inspect local changes before later milestones introduce command execution, screening, risk analysis, payload construction, or reporting.
