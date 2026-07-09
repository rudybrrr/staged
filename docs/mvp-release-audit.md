# MVP Release Audit

## Summary

* Overall status: `blocked`
* Build status: `pass`
* Number of blockers found: 1 implementation blocker, plus the derived release-decision failure
* Number of manual checks remaining: 5 checklist items

Audit date: July 9, 2026.

Scope: static code/docs inspection plus requested build checks. No product code, package files, lockfiles, Tauri config, README, milestone docs, RAG docs, UI design docs, screenshot assets, or the existing checklist were edited.

Build notes:

* `npm run build` first failed in the sandbox with `Error: spawn EPERM` while Vite/esbuild loaded `vite.config.ts`.
* Rerunning the same build outside the sandbox with `npm.cmd run build` passed: TypeScript completed and Vite built `dist/`.
* `npm.cmd run tauri dev` was attempted with a bounded timeout. It did not complete within the timeout, and the audit could not verify the GUI launch state or runtime console state automatically.

Primary blocker:

* User-facing redaction wording is inconsistent with implemented Safety Gate behavior. The Safety Gate creates a redacted payload preview, but Stage Payload and Token Budget text still says secret redaction is not implemented. This is a demo/readiness blocker, not a safety-engine blocker.
  * Likely files: `src/app/features/stage-payload/StagePayloadPreviewPanel.tsx`, `src/app/lib/tokenBudget.ts`, `src/app/lib/stagePayload.ts`.
  * Blocker: yes, because the MVP checklist requires consistent statuses and a clear safety/approval boundary.

## Build and launch

* Pass - `npm run build` passes.
  * Evidence: `npm.cmd run build` completed successfully after the sandbox-only esbuild `EPERM` failure.
* Manual required - `npm run tauri dev` starts the desktop app.
  * Evidence: `npm.cmd run tauri dev` was attempted but timed out after the bounded run window.
  * Manual verification: run `npm run tauri dev` locally, confirm the desktop window opens, and confirm it reaches the Staged workbench.
* Manual required - App launches without console or runtime errors.
  * Evidence: command-only inspection cannot verify the GUI console or runtime state.
  * Manual verification: with the Tauri app running, check the terminal and app devtools console for startup errors.

## Core workflow

* Pass - User can select a valid Git repository.
  * Evidence: `RepoPicker` uses the Tauri dialog plugin for directory selection and `App.tsx` calls `inspectRepo` after selection.
* Pass - Invalid folder shows a useful error.
  * Evidence: `inspect_repo` rejects non-Git paths with `Path is not a Git repository: ...`; `App.tsx` renders repository inspection failure text.
* Pass - Changed files load for a dirty repo.
  * Evidence: `list_changed_files` runs `git status --porcelain=v1 --untracked-files=all`; `ChangedFilesPanel` renders returned files.
* Pass - Clean repo state is handled clearly.
  * Evidence: empty changed-file state says "No changed files"; repo status labels clean working tree as `Clean`.
* Pass - Changed file selection works.
  * Evidence: changed-file rows call `onSelectFile`; `App.tsx` stores `selectedChangedFile`.
* Pass - Diff viewer loads the selected file diff.
  * Evidence: `get_file_diff` runs unstaged diff first and staged diff fallback; `DiffViewerPanel` renders the diff.
* Pass - Untracked and no-diff states are handled clearly.
  * Evidence: untracked files are parsed and labeled; empty diff state explains that untracked files may not have Git diff output until staged.

## Local checks

* Pass - Supported npm scripts are detected.
  * Evidence: `get_available_repo_commands` reads root `package.json` and checks `test`, `lint`, and `typecheck` scripts.
* Pass - Unavailable commands are disabled with a reason.
  * Evidence: unavailable commands are returned with `script not found in package.json` or `package.json not found`, and the UI disables the buttons.
* Pass - Command success displays correctly.
  * Evidence: `CommandRunnerPanel` renders `Success`, exit code, duration, stdout, and stderr when `result.success` is true.
* Pass - Command failure displays correctly.
  * Evidence: non-zero command exits return a valid `CommandResult`; `CommandRunnerPanel` renders `Failure`.
* Pass - stdout and stderr remain readable.
  * Evidence: command outputs are rendered in labeled `CodeBlock` components.

## Pre-Stage Screening

* Pass - Deterministic findings appear from current local state.
  * Evidence: `buildPreStageFindings` derives findings from repo state, changed files, command availability, and command results.
* Pass - `pass`, `info`, `warning`, and `fail` states render correctly.
  * Evidence: `PreStageScreeningPanel` defines labels and tones for all four finding levels.
* Pass - No AI is involved.
  * Evidence: screening is pure local TypeScript state derivation; no API, SDK, or network path is used.

## Stage Payload

* Pass - Payload preview exists.
  * Evidence: `StagePayloadPreviewPanel` renders read-only JSON for `StagePayload`.
* Pass - Selected diff inclusion is clear.
  * Evidence: payload completeness includes `includes_selected_file_diff` and selected file path.
* Pass - Missing evidence limitations are clear.
  * Evidence: `buildStagePayload` records limitations for missing selected diff, omitted changed-file diffs, untracked content, missing command result, and missing supported commands.
* Pass - Payload is local-only.
  * Evidence: payload is built from frontend/Tauri local state only; no network call path was found.
* Pass - Whole repo is not included by default.
  * Evidence: payload includes repo metadata, changed-file metadata, and only the currently selected file diff when loaded.

## Token Budget

* Pass - Approximate estimate appears.
  * Evidence: `TokenBudgetPanel` shows estimated tokens, characters, bytes, and estimator.
* Pass - Section contribution breakdown appears.
  * Evidence: `buildTokenBudget` builds per-section counts and percentages; `TokenBudgetPanel` renders a section table.
* Pass - Warnings appear when evidence is missing or large.
  * Evidence: warnings cover missing selected diff, listed files without diff content, untracked file contents, missing command result, missing scripts, large payloads, and large command output.
* Pass - Estimator limitation is clear.
  * Evidence: `ESTIMATOR_NOTE` explains the local chars-divided-by-4 estimate and tokenizer limitation.

## Safety Gate

* Pass - Safety Gate scans the serialized payload and selected-file diff.
  * Evidence: `buildSafetyGateResult` scans `JSON.stringify(payload, null, 2)` and separately scans `payload.changes.selected_file_diff.diff`.
* Pass - Fake API key triggers a blocked state.
  * Evidence: secret assignment patterns include `API_KEY=...`, `TOKEN=...`, `PASSWORD=...`, `SECRET=...`, `PRIVATE_KEY=...`, and `ACCESS_KEY=...`; blocked findings set status to `blocked`.
* Pass - Redacted preview appears.
  * Evidence: `SafetyGatePanel` renders `redacted_payload_preview` in a labeled `CodeBlock`.
* Pass - Original payload remains unchanged.
  * Evidence: redaction operates on a copied serialized string and scanner limitations state that the preview does not mutate the original payload.
* Pass - No data is sent externally.
  * Evidence: scanner is local TypeScript pattern matching; no external request path was found.

## Staging Ground and provider readiness

* Pass - Provider readiness appears.
  * Evidence: `StagingGroundPanel` renders Provider Readiness / Future AI Approval.
* Pass - Missing environment variable shows not configured.
  * Evidence: `get_provider_readiness` returns `configured: false` and `No provider environment variable was detected.` when no env var is present.
* Pass - Configured environment variable shows configured without exposing the key value.
  * Evidence: `get_provider_readiness` checks `STAGED_OPENAI_API_KEY` and `OPENAI_API_KEY`, but returns only configured state, provider, source name, and message.
* Pass - Future AI action remains disabled.
  * Evidence: `Generate AI Stage Report` is rendered as disabled; `futureAiApproval.disabledReasons` always includes `AI generation not implemented yet`.
* Pass - Safety Gate blocked prevents future submission eligibility.
  * Evidence: `futureAiApproval` adds `Safety Gate blocked`, and `StagingGroundPanel` states no override exists when blocked.
* Pass - Redacted-payload-only rule is visible.
  * Evidence: Staging Ground text says future generation will use the approved redacted payload only.

## Stage Report and Markdown Export

* Pass - Local Stage Report preview appears.
  * Evidence: `StageReportPanel` renders `buildLocalStageReportPreview` output when payload exists.
* Pass - Report is clearly local preview only.
  * Evidence: report status is `preview_only`; UI and Markdown export say local preview only.
* Pass - No AI review is claimed.
  * Evidence: UI and Markdown explicitly state no AI review has been generated.
* Manual required - Copy Markdown works.
  * Evidence: code uses `navigator.clipboard.writeText(markdown)`, but clipboard permissions and behavior require a running app.
  * Manual verification: open a Stage Report in the Tauri app, click `Copy Markdown`, verify the UI shows copied state, and paste the clipboard contents into a local editor.
* Pass - Exported Markdown includes local/no-AI label and recommendation.
  * Evidence: `formatStageReportMarkdown` includes the local/no-AI warning and a Recommendation section with decision and rationale.

## UI/demo readiness

* Manual required - Screenshot states look good.
  * Evidence: screenshot automation and self-visual-analysis were intentionally not run per project instructions.
  * Manual verification: run the Tauri app and compare empty, dirty-repo, selected-diff, safety-warning/blocked, and report states against the intended demo screenshots.
* Pass - README screenshots render.
  * Evidence: README references `docs/assets/staged-empty-state.png` and `docs/assets/staged-main-workbench.png`, and both files exist.
* Pass - Pipeline strip is visible.
  * Evidence: `AppShell` receives `PipelineStrip`, and `PipelineStrip` renders all pipeline steps.
* Pass - Verdict/review rail is clear.
  * Evidence: `ReviewRailPanel` renders a verdict card, pipeline summary, and collapsed detail panels.
* Manual required - Code blocks are readable.
  * Evidence: output and diff content use `CodeBlock`, but readability is visual and viewport dependent.
  * Manual verification: inspect diff output, stdout, stderr, payload JSON, redacted payload, report Markdown, and report JSON in the running app.
* Fail - Statuses are consistent.
  * Exact issue: redaction wording is inconsistent. `SafetyGatePanel` and `buildSafetyGateResult` implement and display a redacted payload preview, while Stage Payload and Token Budget still say secret redaction is not implemented.
  * Likely files: `src/app/features/stage-payload/StagePayloadPreviewPanel.tsx`, `src/app/lib/tokenBudget.ts`, `src/app/lib/stagePayload.ts`.
  * Blocker: yes. This is a user-facing MVP/demo readiness issue because the safety boundary is implemented but described inconsistently.

## Privacy and scope

* Pass - No AI/API/network call is made.
  * Evidence: no frontend `fetch`, XHR, WebSocket, provider SDK, prompt construction, or model call was found. Provider readiness checks local environment variables only.
* Pass - No API key values are displayed, logged, or persisted.
  * Evidence: provider readiness returns only `configured`, provider name, env var source name, and message.
* Pass - No RAG implementation is present.
  * Evidence: source/package inspection found no RAG, retrieval, Tree-sitter, vector, or embedding implementation in app code.
* Pass - No Stage History persistence is present.
  * Evidence: source/package inspection found no SQLite, persistence layer, Stage History storage, or report history implementation.
* Pass - No whole-repo upload exists.
  * Evidence: no upload or external submission path exists; payload includes selected local evidence only.
* Pass - Limitations are documented.
  * Evidence: limitations are present in Stage Payload, Token Budget, Safety Gate, Stage Report, README, and `docs/mvp-tradeoffs.md`.

## Release decision

* Fail - All MVP checklist items pass.
  * Exact issue: at least one implementation checklist item fails, and five checklist items still need manual verification.
  * Likely files: `docs/mvp-release-audit.md` records the current decision; implementation blocker likely files are listed above.
  * Blocker: yes, but derivative. Do not count this as a second independent implementation blocker.
* Pass - Known limitations are documented.
  * Evidence: current README and `docs/mvp-tradeoffs.md` document local-only preview, no AI, no RAG, no Stage History, no persistence, scanner limitations, and post-MVP scope.
* Manual required - README accurately reflects current behavior.
  * Evidence: README broadly matches the inspected implementation, but final accuracy should be manually rechecked after resolving the redaction wording blocker.
  * Manual verification: reread README after fixes and confirm it matches the app's current Stage Payload, Token Budget, Safety Gate, Staging Ground, and Stage Report language.
* Pass - Post-MVP roadmap is clear.
  * Evidence: README and tradeoff docs clearly identify real AI generation, RAG, Stage History, persistence, PR integration, and related work as post-MVP.

Release recommendation: do not mark MVP complete yet. Resolve the redaction wording/status inconsistency, then complete the manual Tauri launch, runtime console, clipboard, visual screenshot-state, code-block readability, and README accuracy checks.
