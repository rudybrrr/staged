# Milestone 3: Diff Viewer

Status: Implemented.

## Goal

Allow the user to inspect the Git diff for changed files before moving to command execution or Pre-Stage Screening.

Milestone 3 builds on Milestone 2 by making the changed-files list inspectable. After the user selects a valid Git repository and sees changed files, Staged lets the user select a file and view its Git diff in a read-only diff panel.

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

Milestone 3 is complete and makes those changed files reviewable by displaying their unified Git diff.

## Implemented

Backend:

- Backend Tauri command `get_file_diff`.
- Backend Tauri command `get_repo_diff`.
- Git CLI diff retrieval using `git diff --no-ext-diff`.
- File-specific diff retrieval using `git diff --no-ext-diff -- <file_path>`.
- Basic staged fallback using `git diff --cached --no-ext-diff -- <file_path>`.
- Clear error return when Git diff fails.

Frontend:

- Frontend helper `getFileDiff`.
- Clickable changed-file rows.
- Selected file state.
- Read-only diff viewer panel.
- Unified diff text rendered in a whitespace-preserving monospace block.
- Empty state when no file is selected.
- Loading state while fetching diff.
- Error state if diff retrieval fails.
- No-diff state for untracked files or files with no available Git diff.
- Selected diff clears on repo switch and refresh.

## Out of Scope

The following are outside Milestone 3 and are not implemented yet:

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

## Technical Summary

Backend command:

```rust
get_file_diff(repo_path: String, file_path: String) -> Result<String, String>
```

Backend command:

```rust
get_repo_diff(repo_path: String) -> Result<String, String>
```

Frontend helper:

```ts
getFileDiff(repoPath, filePath)
```

The backend owns Git CLI details. The frontend requests diff text through Tauri commands and does not shell out to Git directly.

## Git Command Direction

The selected-file diff uses the selected repository path and file path. Conceptually:

```bash
git -C <repo_path> diff --no-ext-diff -- <file_path>
```

The repository-wide unstaged diff uses:

```bash
git -C <repo_path> diff --no-ext-diff
```

The file-specific staged fallback uses:

```bash
git -C <repo_path> diff --cached --no-ext-diff -- <file_path>
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
- If no file is selected, the panel shows a clear empty state.
- If the selected file has no available diff, the panel shows a clear no-diff state.
- If Git diff fails, the panel shows a clear non-crashing error.
- If the repo changes or changed files are refreshed, the selected diff clears.

The diff viewer does not allow editing, staging, unstaging, patch application, command execution, or AI actions.

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
git -C <repo_path> diff --no-ext-diff -- <file_path>
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
2. Confirm the diff panel shows a clear no-diff state.
3. Confirm the app does not treat the empty diff as a crash.

### Git diff failure

1. Select a non-Git folder or otherwise trigger a safe Git diff failure.
2. Confirm the UI shows a clear error.
3. Confirm the app remains usable.

### Repo switch and refresh

1. Select a changed file and confirm its diff is displayed.
2. Switch repositories or refresh changed files.
3. Confirm the selected diff clears.

### Feature boundary

1. Confirm the diff panel is read-only.
2. Confirm no file editing features were added.
3. Confirm no staging or unstaging features were added.
4. Confirm no command runner features were added.
5. Confirm no AI-related features were added.

## Definition of Done

- Backend diff commands exist.
- Frontend can display diff for a changed file.
- Diff viewer has loading, empty, no-diff, and error states.
- Diff viewer is read-only.
- No command runner or AI-related features have been added.

## Notes

Milestone 3 is a review surface, not an execution surface. Its purpose is to let the user inspect local changes before later milestones introduce command execution, screening, risk analysis, payload construction, or reporting.
