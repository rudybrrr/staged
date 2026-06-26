# Milestone 2: Git Status and Changed Files

## Goal

Show which files have changed in the selected Git repository before moving to diff viewing.

Milestone 2 extends the local repo inspection flow from Milestone 1. After the user selects a valid Git repository, Staged should list changed files using Git status data and show a clear changed-files panel in the frontend.

This milestone is intentionally narrow. It does not include diff rendering, command execution, risk analysis, staging workflows, persistence, or AI features.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestone 0 is complete.

Milestone 1 is complete and currently supports:

- Opening as a Tauri desktop app.
- Selecting a local folder.
- Validating whether the selected folder is a Git repository.
- Showing repo path.
- Showing repo name.
- Showing current branch.
- Showing clean or dirty working tree state.
- Showing invalid-folder errors.

Milestone 2 should make the dirty state actionable by showing which files changed. This is the bridge between basic repo inspection and the later diff viewer.

## In Scope

Backend:

- Add a backend Tauri command conceptually named `list_changed_files(repo_path: String) -> Result<Vec<ChangedFile>, String>`.
- Use Git CLI through the Rust/Tauri backend.
- Run `git status --porcelain=v1`.
- Parse changed file entries from porcelain status output.
- Handle added, modified, deleted, renamed, copied, and untracked files.
- Preserve index and worktree status where useful.
- Return an empty list for a clean repository.
- Return a clear error if Git status fails.

Frontend:

- Add a frontend helper conceptually named `listChangedFiles(repoPath: string)`.
- Refresh changed files after a valid repo is selected.
- Add a changed-files panel after a valid repo is selected.
- Display each changed file path.
- Display a readable file status.
- Show a clear empty state when there are no changes.
- Show a clear error state if Git status fails.

## Out of Scope / Not Implemented

The following are outside Milestone 2:

- Diff viewer.
- Full diff parsing.
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

Frontend:

- React.
- TypeScript.
- Tailwind CSS.
- Vite.
- Tauri frontend invoke API.

Backend:

- Tauri v2 Rust command.
- Git CLI process execution from Rust.
- Repository path passed from the already-selected valid repo.
- Status parsing inside the backend, not the frontend.

Milestone 2 should keep the same architecture direction as Milestone 1: the frontend requests structured repo data through Tauri commands, and the backend handles Git CLI details.

## Architecture

```text
React UI
  ->
Frontend helper listChangedFiles(repoPath)
  ->
Tauri invoke
  ->
Rust command list_changed_files(repo_path)
  ->
git -C <repo_path> status --porcelain=v1
  ->
Parsed changed-file list returned to UI
```

## Changed File Data Shape

The backend should return a typed list with this conceptual shape:

```ts
type ChangedFile = {
  file_path: string;
  old_file_path: string | null;
  status: "added" | "modified" | "deleted" | "renamed" | "copied" | "untracked" | "unknown";
  index_status: string | null;
  worktree_status: string | null;
  is_staged: boolean;
  is_unstaged: boolean;
  is_untracked: boolean;
};
```

Use clear technical names. Avoid product-themed names for internal fields.

## Git Command

Use:

```bash
git -C <repo_path> status --porcelain=v1
```

Expected behavior:

- If the repository is clean, Git returns no status lines and the backend returns an empty list.
- If the repository has changes, each status line is parsed into one `ChangedFile`.
- If the Git command fails, return a string error that the UI can display.
- The frontend should not parse raw Git output.

## Porcelain Status Parsing

Porcelain v1 status lines include two status columns followed by a path:

```text
XY path
```

Where:

- `X` is the index status.
- `Y` is the worktree status.
- `??` indicates an untracked file.

Milestone 2 should support these status categories:

- Added.
- Modified.
- Deleted.
- Renamed.
- Copied.
- Untracked.
- Unknown fallback.

Conceptual mapping:

```text
A  or  A -> added
M  or  M -> modified
D  or  D -> deleted
R  or  R -> renamed
C  or  C -> copied
??       -> untracked
other    -> unknown
```

Renamed and copied files can include both old and new paths. Preserve the old path when present:

```text
R  old/path.ts -> new/path.ts
C  old/path.ts -> new/path.ts
```

For renamed and copied entries:

- `file_path` should be the new path.
- `old_file_path` should be the old path.

For all other entries:

- `file_path` should be the reported path.
- `old_file_path` should be `null`.

## Status Flags

Preserve enough status detail for later milestones without building the later features now.

Expected flag behavior:

- `index_status` is the first porcelain status column, or `null` when not useful.
- `worktree_status` is the second porcelain status column, or `null` when not useful.
- `is_staged` is true when the index status represents a staged change.
- `is_unstaged` is true when the worktree status represents an unstaged change.
- `is_untracked` is true for `??` entries.

These flags are useful because future diff viewing needs to distinguish staged and unstaged changes. Milestone 2 only needs to expose and display the information.

## UI Requirements

Add a changed-files panel that appears after a valid repo is selected.

The panel should show:

- Changed file count.
- File path.
- Readable status label.
- Optional staged or unstaged indicator if the existing UI style supports it cleanly.

Empty state:

- If the repo is clean, show a clear message such as `No changed files`.
- Do not treat a clean repo as an error.

Error state:

- If `list_changed_files` fails, show a clear non-crashing error.
- Keep the selected repo metadata visible if it is still available.

Refresh behavior:

- After a valid repo is selected, refresh the changed-files list.
- If a later refresh control exists or is added within the existing pattern, it should refresh repo metadata and changed files together.

## Non-Goals

Milestone 2 should not:

- Show file diffs.
- Read file contents.
- Run test, lint, or typecheck commands.
- Classify risk.
- Build prompts or payloads.
- Store scans.
- Add AI provider configuration.
- Add database tables.
- Add GitHub integration.
- Modify files in the selected repo.

## Final Definition of Done

Milestone 2 is done when:

- The app can select and inspect a valid Git repository as in Milestone 1.
- The backend exposes a Tauri command conceptually named `list_changed_files`.
- The backend runs `git status --porcelain=v1` for the selected repo.
- The backend returns a typed list of changed files.
- Clean repositories return an empty list.
- Added files are shown correctly.
- Modified files are shown correctly.
- Deleted files are shown correctly.
- Renamed files are shown with the new path and old path preserved.
- Copied files are shown with the new path and old path preserved.
- Untracked files are shown correctly.
- Index and worktree status are preserved where useful.
- The frontend has a helper conceptually named `listChangedFiles`.
- The frontend refreshes changed files after a valid repo is selected.
- The UI shows a changed-files panel.
- The UI shows file path and status for each changed file.
- The UI shows a clear empty state when there are no changes.
- The UI shows a clear error state if Git status fails.
- No diff viewer has been added.
- No command runner has been added.
- No AI-related feature has been added.
- No database has been added.

## Manual Test Plan

### Clean repo

1. Open Staged.
2. Select a valid Git repository with no uncommitted changes.
3. Confirm repo metadata still appears.
4. Confirm the changed-files panel shows an empty state.
5. Confirm the app does not show an error.

### Modified file

1. Modify an existing tracked file.
2. Open or refresh the repo in Staged.
3. Confirm the changed-files panel lists the file.
4. Confirm the status is shown as modified.

### Added or untracked file

1. Create a new file in a valid repo.
2. Open or refresh the repo in Staged.
3. Confirm the file appears as untracked if it has not been staged.
4. Stage the file manually outside Staged.
5. Refresh Staged.
6. Confirm the file appears as added.

### Deleted file

1. Delete a tracked file in a test repo.
2. Open or refresh the repo in Staged.
3. Confirm the file appears as deleted.

### Renamed file

1. Rename a tracked file using Git or the filesystem.
2. Stage the rename if needed for Git to report it as renamed.
3. Open or refresh the repo in Staged.
4. Confirm the new file path is displayed.
5. Confirm the old file path is preserved if shown or available in the returned data.

### Git status failure

1. Select a valid repo.
2. Make Git status fail in a controlled way, such as by using an inaccessible test path or another safe failure condition.
3. Confirm the UI shows a clear error.
4. Confirm the app does not crash.

## Notes

Milestone 2 should make local changes visible, but it should not interpret them yet. The goal is a reliable changed-files list that later milestones can use for diff viewing, screening, risk analysis, payload construction, and reporting.
