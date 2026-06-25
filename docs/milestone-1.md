# Milestone 1: Local Repo Inspector

## Goal

Build the first real local verification spine for Staged.

Milestone 1 proves that the desktop app can open on Windows, let the user select a local folder, validate that the folder is a Git repository, and show basic repository state without using AI.

This milestone is intentionally narrow. It focuses on local repo inspection only.

## Product Context

Staged is a local-first, cost-aware AI verification workbench for auditing AI-generated code changes before commit.

The long-term product will combine Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports.

Milestone 1 does not include those advanced features yet. The point is to build the reliable local foundation first.

## User Story

As a developer using AI coding tools, I want to open a local Git repository in Staged so that I can verify whether the repo has uncommitted changes before deciding what to review or commit.

## In Scope

Milestone 1 includes:

- A running Tauri desktop app on Windows.
- A basic Staged home screen.
- A local folder picker.
- Git repository validation.
- Repository metadata display:
  - Repo path
  - Repo name
  - Current branch
  - Dirty state
  - Whether uncommitted changes exist

## Out of Scope

Milestone 1 does not include:

- AI review
- OpenAI API calls
- Stage Report generation
- Stage Payload builder
- Token Budget estimate
- Staging Ground
- Safety Gate
- Secret redaction
- SQLite persistence
- Stage History
- Git diff viewer
- Changed files list
- Command runner
- RAG
- Tree-sitter
- Vector search
- GitHub PR integration
- Auto-fixing
- Cloud sync
- Collaboration

## Technical Scope

Frontend:

- React
- TypeScript
- Tailwind CSS
- Vite
- Tauri frontend APIs

Backend:

- Tauri v2
- Rust commands
- Git CLI

The frontend should not directly inspect arbitrary files or shell out to Git. The UI should call narrow Tauri commands, and the Rust backend should perform repo validation and Git metadata retrieval.

## Target Architecture for This Milestone

```text
React UI
  ↓ Tauri invoke
Rust command layer
  ↓
Git CLI
  ↓
Repo metadata returned to UI
```

## Required Repo Metadata

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

## Git Commands Expected

The Rust backend can use Git CLI commands such as:

```bash
git -C <repo_path> rev-parse --is-inside-work-tree
git -C <repo_path> rev-parse --show-toplevel
git -C <repo_path> branch --show-current
git -C <repo_path> status --porcelain
```

Expected behavior:

- If the selected folder is not a Git repository, show a clear error in the UI.
- If the folder is a Git repository, show repo metadata.
- If the branch name cannot be resolved, return `null` or a safe fallback instead of crashing.
- If `git status --porcelain` returns any output, the repo has uncommitted changes.

## UI Requirements

The home screen should show:

- Product name: Staged
- One-line positioning: Local-first verification before commit.
- Current milestone target
- A disabled or inactive repo picker button before repo picker is implemented
- Later in this milestone, an active repo picker button

After repo selection, the UI should show:

- Repo name
- Full repo path
- Current branch
- Dirty/clean state
- Error message if the selected folder is not a Git repository

## Definition of Done

Milestone 1 is done when:

- `npm run tauri dev` opens the app successfully on Windows.
- The app has a basic Staged home screen.
- The user can click a button to select a local folder.
- The selected folder is validated through a Rust Tauri command.
- The app correctly detects whether the folder is a Git repository.
- For a valid Git repository, the app displays:
  - Repo path
  - Repo name
  - Current branch
  - Whether there are uncommitted changes
- For an invalid folder, the app displays a clear non-crashing error.
- No AI-related feature has been added.
- No database has been added.
- No diff viewer or command runner has been added yet.

## Manual Test Plan

Test with a valid Git repo:

1. Open Staged.
2. Click the repo picker.
3. Select the local `staged` project folder.
4. Confirm the UI shows:
   - Repo name: `staged`
   - Current branch: `main`
   - Valid Git repo state
   - Dirty state based on current uncommitted changes

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

## Commit Plan

Recommended commits for this milestone:

1. `feat: add Tailwind and Staged home screen`
2. `feat: add repo picker UI`
3. `feat: validate Git repository from Tauri command`
4. `feat: display repo metadata`

Keep each commit small and testable.

## Notes

This milestone deliberately avoids advanced features. Staged should first prove that it can inspect local repositories safely and reliably.

The next milestone after this will expand from repo metadata into changed files and Git status details.