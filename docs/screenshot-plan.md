# README Screenshot Capture Plan

This plan defines the two manual screenshots to capture for the Staged README. Screenshots must be real local Tauri app output. Do not use mockups, generated screenshots, edited UI composites, or fake data that implies unimplemented AI/API behavior.

Save final images in `docs/assets/` when they are captured. Do not link screenshots from `README.md` until the real image files exist and have been reviewed.

## Capture Notes

- Use the completed Milestone 12 / 12F visual design state.
- Prefer a clean desktop window with no personal files, tokens, local paths, or unrelated apps visible.
- Use realistic local project content that demonstrates Staged as a portfolio-ready desktop app.
- Avoid showing unfinished RAG or AI/API functionality, since those are documented architecture only and not implemented.

## Screenshots

### `docs/assets/staged-empty-state.png`

- Target app state: No repo selected.
- Should be visible: Pipeline, clean empty states, and clear readiness for local repo selection.
- Should not be visible: Placeholder debug data, terminal output, system notifications, personal paths, or fake project results.
- Manual setup notes: Start the app locally, clear any existing session data if needed, and capture the first meaningful empty workspace state.

### `docs/assets/staged-main-workbench.png`

- Target app state: Valid local repo selected.
- Should be visible: Changed files, one selected diff, command result if available, Stage Report, review rail, Safety Gate status, and Markdown export if it fits.
- Should not be visible: Sensitive repository content, credentials, personal notes, broken states, or UI that suggests AI-generated analysis.
- Manual setup notes: Use a small local demo project or sanitized repository state with representative changes that show the app's core workflow clearly.
