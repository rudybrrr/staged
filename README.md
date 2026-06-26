# Staged

Local-first verification before commit.

## Stack

- Tauri v2
- React
- TypeScript
- Vite
- Tailwind CSS

## Current milestone

Milestone 1: Local Repo Inspector.

Milestone 1 is implemented. It provides the local foundation for selecting a repository folder and validating Git repository state without AI.

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

Not implemented yet:

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
