# README Screenshot Capture Plan

This plan defines the manual screenshots to capture for the Staged README. Capture images from the real local Tauri app output only. Do not use mockups, generated screenshots, edited UI composites, or fake data that implies unimplemented AI/API behavior.

Save final images in `docs/assets/` when they are captured. Do not link them from `README.md` until the real image files exist and have been reviewed.

## Capture Notes

- Use the completed Milestone 12 / 12F visual design state.
- Prefer a clean desktop window with no personal files, tokens, local paths, or unrelated apps visible.
- Use realistic local project content that demonstrates Staged as a portfolio-ready desktop app.
- Avoid showing unfinished RAG or AI/API functionality, since those are documented architecture only and not implemented.

## Screenshots

### `staged-empty-state.png`

- Target app state: Fresh or cleared Staged workspace with no staged items loaded.
- Should be visible: The primary app shell, empty-state messaging, main navigation/workbench structure, and polished default visual treatment.
- Should not be visible: Placeholder debug data, terminal output, system notifications, personal paths, or fake project results.
- Manual setup notes: Start the app locally, clear any existing session data if needed, and capture the first meaningful empty workspace state.

### `staged-main-workbench.png`

- Target app state: Normal working session with real local staged content loaded.
- Should be visible: Main workbench layout, staged item list or review surface, meaningful local file/change context, and the redesigned visual hierarchy.
- Should not be visible: Sensitive repository content, credentials, personal notes, broken states, or UI that suggests AI-generated analysis.
- Manual setup notes: Use a small local demo project or sanitized repository state with representative changes that show the app's core workflow clearly.

### `staged-safety-blocked.png`

- Target app state: A safety or guardrail state where Staged blocks or warns before an unsafe action.
- Should be visible: The blocked/warning state, clear action language, and enough surrounding UI to understand the workflow.
- Should not be visible: Real secrets, destructive production paths, scary fabricated errors, or stack traces.
- Manual setup notes: Reproduce using a safe local scenario that triggers the existing blocked behavior without performing any destructive action.

### Optional: `staged-markdown-export.png`

- Target app state: Markdown export or preview flow after a real local review/export action.
- Should be visible: Export-ready markdown output, preview, or confirmation UI that demonstrates README/demo usefulness.
- Should not be visible: Nonexistent integrations, invented analysis, personal paths, or unreviewed generated content.
- Manual setup notes: Use sanitized local app output from the existing export capability. Capture only if the flow looks complete and materially improves the README.
