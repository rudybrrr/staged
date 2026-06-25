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

The current milestone is focused on building the local foundation for selecting a repository folder and, when complete, validating Git repository state without AI.

## Current implementation status

Implemented:

- Tauri app shell.
- Tailwind-based Staged home screen.
- Tauri dialog plugin.
- Frontend-only folder picker.
- Selected folder path display.

Not implemented yet:

- Git repository validation.
- Rust Git metadata command.
- Repo name display.
- Current branch display.
- Dirty state detection.
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
