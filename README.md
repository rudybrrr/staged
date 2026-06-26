# Staged

Local-first verification before commit.

## Stack

- Tauri v2
- React
- TypeScript
- Vite
- Tailwind CSS

## Current milestone

Milestone 2: Git Status and Changed Files.

Milestones 1 and 2 are implemented. Staged can select a local Git repository, validate repository state, show repo metadata, and list changed files without AI.

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

Not implemented yet:

- Diff viewer.
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
