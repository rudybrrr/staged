# Staged

Local-first verification before commit.

## Stack

- Tauri v2
- React
- TypeScript
- Vite
- Tailwind CSS

## Current milestone

Milestone 6: Stage Payload Builder.

Milestones 1, 2, 3, 4, 5, and 6 are implemented. Staged can select a local Git repository, validate repository state, show repo metadata, list changed files, display read-only unified diffs for selected changed files, run allowlisted verification commands, show deterministic pre-stage screening findings without AI, and build a read-only local Stage Payload preview from existing app state.

## Current implementation status

Implemented:

- Tauri app shell.
- Tailwind-based Staged home screen.
- Tauri dialog plugin.
- Frontend folder picker.
- Selected folder path display.
- Rust Tauri command `inspect_repo`.
- Git repository validation.
- Repo name display.
- Repo path display.
- Current branch display.
- Clean/dirty working tree detection.
- Invalid folder error handling.
- Rust Tauri command `list_changed_files`.
- Git status retrieval with `git status --porcelain=v1 --untracked-files=all`.
- Changed-file parsing for added, modified, deleted, renamed, copied, and untracked files.
- Index and worktree status preservation.
- Frontend changed-files panel.
- Changed-file count.
- Clean repo empty state.
- Git status error state.
- Manual `Refresh changed files` button.
- Correct changed-file path parsing, including `README.md` and untracked files.
- Rust Tauri command `get_file_diff`.
- Rust Tauri command `get_repo_diff`.
- Git diff retrieval with `git diff --no-ext-diff`.
- File-specific diff retrieval with `git diff --no-ext-diff -- <file_path>`.
- Basic staged fallback with `git diff --cached --no-ext-diff -- <file_path>`.
- Frontend helper `getFileDiff`.
- Clickable changed-file rows.
- Selected file state.
- Read-only diff viewer panel.
- Unified diff text rendered in a whitespace-preserving monospace block.
- Empty diff viewer state when no file is selected.
- Loading state while fetching a diff.
- Error state when diff retrieval fails.
- No-diff state for untracked files or files with no available Git diff.
- Selected diff clears on repo switch and refresh.
- Rust Tauri command `run_repo_command`.
- Strict command ID allowlist: `npm_test`, `npm_lint`, and `npm_typecheck`.
- No arbitrary shell command input.
- Commands run inside the selected Git repository.
- Windows-compatible npm executable handling.
- Captured stdout, stderr, exit code, and duration in milliseconds.
- Success/failure command result based on exit code.
- Non-zero exit codes return valid command results instead of app errors.
- Frontend command runner panel.
- Read-only stdout/stderr output blocks.
- Command loading, success, failure, and error states.
- Rust Tauri command `get_available_repo_commands`.
- Repo-aware command availability detection from the root `package.json`.
- Disabled unavailable command buttons with reasons.
- Empty state when no supported npm scripts are found.
- Command runner state clears when switching repos or selecting invalid folders.
- Frontend Pre-Stage Screening panel.
- Deterministic local findings built from existing app state.
- Repo summary in the screening panel.
- Changed-file count summary.
- File status counts for added, modified, deleted, renamed, copied, untracked, and unknown files.
- Command runner summary in the screening panel.
- Screening findings with `pass`, `info`, `warning`, and `fail` levels.
- Findings for valid repo selection, no changed files, untracked files, deleted files, renamed/copied files, command checks not run, latest command success, latest command failure, command execution error, and no supported npm scripts.
- Read-only screening UI.
- Clear separation between deterministic screening and future AI review.
- Screening panel clears stale state when selecting invalid folders or switching repos.
- Frontend `StagePayload` type.
- Frontend `buildStagePayload` utility.
- Read-only Stage Payload preview panel.
- Formatted JSON payload preview using `JSON.stringify(payload, null, 2)`.
- Stage Payload built from existing local app state only.
- Repo metadata in the Stage Payload.
- Changed-file summary in the Stage Payload.
- Changed-file status counts in the Stage Payload.
- Changed files list in the Stage Payload.
- Selected-file metadata in the Stage Payload.
- Selected-file diff included only when already loaded.
- Latest command result included when available.
- Command error included when available.
- Command availability snapshot included.
- Pre-Stage Screening findings included.
- Payload completeness metadata included to make missing evidence visible.
- Payload limitations list included.
- Clear local-preview warning: `Local preview only. No AI call has been made. Secret redaction is not implemented yet.`

Not implemented yet:

- Workspace or nested package command detection.
- Risk classifier.
- Token Budget.
- Staging Ground.
- Stage Report.
- Secret scanning.
- Redaction.
- SQLite.
- Stage History.
- AI features.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Development

Start the Vite development server:

```bash
npm run dev
```

Start the Tauri desktop app:

```bash
npm run tauri dev
```

Build the frontend:

```bash
npm run build
```
