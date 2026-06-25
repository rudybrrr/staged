# Milestone 1: Local Repo Inspector

## Goal

Build the first local verification spine for Staged.

When complete, Milestone 1 will prove that the desktop app can open on Windows, let the user select a local folder, validate that the folder is a Git repository, and show basic repository state without using AI.

This milestone is intentionally narrow. It focuses on local repo inspection only.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestone 1 does not include AI, persistence, diff review, command execution, or report generation. The point is to build the reliable local foundation first.

## Current Implementation

Implemented:

- Tauri app shell.
- Tailwind-based Staged home screen.
- Tauri dialog plugin.
- Frontend-only folder picker.
- Selected folder path display.

Current behavior:

- The user can select a local folder through the Tauri dialog plugin.
- The selected folder path is displayed in the UI.
- The selected folder is not validated as a Git repository yet.
- No Git metadata is read or displayed yet.

## Remaining Work in Milestone 1

Remaining Milestone 1 work:

- Git repository validation.
- Rust Git metadata command.
- Repo name display.
- Current branch display.
- Dirty state detection.
- Whether uncommitted changes exist.
- Clear error handling for invalid non-Git folders.

## Out of Scope / Not Implemented

The following are not implemented and are outside the current Milestone 1 scope:

- Changed files list.
- Diff viewer.
- Command runner.
- Pre-Stage Screening.
- AI features.
- SQLite.
- Stage Payload.
- Token Budget.
- Staging Ground.
- Stage Report.

## Technical Scope

Frontend:

- React.
- TypeScript.
- Tailwind CSS.
- Vite.
- Tauri frontend APIs.

Current backend state:

- Tauri v2 app shell.
- Tauri dialog plugin.
- No Rust Git metadata command yet.

Target backend state for the completed milestone:

- Narrow Rust command for Git repository validation and metadata retrieval.
- Git CLI usage from the Rust backend, not directly from the frontend.

## Target Architecture for the Completed Milestone

```text
React UI
  ↓ Tauri invoke
Rust command layer
  ↓
Git CLI
  ↓
Repo metadata returned to UI
```

## Required Repo Metadata Once Implemented

The backend should return a typed object with this shape conceptually:

```ts
type RepoSummary = {
  repo_path: string;
  repo_name: string;
  is_git_repo: boolean;
  current_branch: string | null;
  has_uncommitted_changes: boolean;
};
```

Use clear technical names. Do not over-theme internal field names.

## Git Commands Expected Once Implemented

The Rust backend can use Git CLI commands such as:

```bash
git -C <repo_path> rev-parse --is-inside-work-tree
git -C <repo_path> rev-parse --show-toplevel
git -C <repo_path> branch --show-current
git -C <repo_path> status --porcelain
```

Expected completed behavior:

- If the selected folder is not a Git repository, show a clear error in the UI.
- If the folder is a Git repository, show repo metadata.
- If the branch name cannot be resolved, return `null` or a safe fallback instead of crashing.
- If `git status --porcelain` returns any output, the repo has uncommitted changes.

## UI Requirements

Current UI behavior:

- Product name: Staged.
- One-line positioning: Local-first verification before commit.
- Current milestone target.
- Active folder picker button.
- Selected folder path after selection.

Target UI behavior for the completed milestone:

- Repo name.
- Full repo path.
- Current branch.
- Dirty/clean state.
- Error message if the selected folder is not a Git repository.

## Final Definition of Done

Milestone 1 is done when:

- `npm run tauri dev` opens the app successfully on Windows.
- The app has a basic Staged home screen.
- The user can click a button to select a local folder.
- The selected folder is validated through a Rust Tauri command.
- The app correctly detects whether the folder is a Git repository.
- For a valid Git repository, the app displays:
  - Repo path.
  - Repo name.
  - Current branch.
  - Whether there are uncommitted changes.
- For an invalid folder, the app displays a clear non-crashing error.
- No AI-related feature has been added.
- No database has been added.
- No diff viewer or command runner has been added yet.

Current status: this definition of done is not complete yet.

## Manual Test Plan

### Current implemented behavior

1. Open Staged.
2. Click the folder picker.
3. Select a local folder.
4. Confirm the selected path is displayed.
5. Confirm the app does not crash.

### Future tests once Git validation is implemented

Test with a valid Git repo:

1. Open Staged.
2. Click the repo picker.
3. Select the local `staged` project folder.
4. Confirm the UI shows:
   - Repo name: `staged`.
   - Current branch.
   - Valid Git repo state.
   - Dirty state based on current uncommitted changes.

Test with a non-Git folder:

1. Create or select a normal folder without `.git`.
2. Open it through Staged.
3. Confirm the UI shows a clear error.
4. Confirm the app does not crash.

Test dirty state:

1. Modify a file in a valid repo.
2. Re-select or refresh the repo state.
3. Confirm `has_uncommitted_changes` becomes true.
4. Commit or discard the change.
5. Confirm the repo returns to clean state.

## Notes

This milestone deliberately avoids advanced features. Staged should first prove that it can inspect local repositories safely and reliably.
