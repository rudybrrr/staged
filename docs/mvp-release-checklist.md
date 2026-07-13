# MVP Release Checklist

This checklist is the final acceptance record for the completed, release-ready Staged MVP.

**Release status:** `pass` — MVP complete and release-ready (July 13, 2026).

The MVP is a local-first verification workbench plus a visible safety and approval boundary. It includes repo selection, Git validation, changed files, diff review, allowlisted local checks, Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, local Stage Report preview, Markdown Export, polished demo-ready UI, provider readiness, and an explicit future-AI approval boundary.

The MVP does not include real AI/LLM Stage Report generation, an OpenAI network call, RAG implementation, Tree-sitter retrieval, vector retrieval, Stage History persistence, SQLite, Stage Trials, GitHub PR integration, auto-fixing, cloud sync, or collaboration.

## Build and launch

- [x] `npm run build` passes.
- [x] `npm run tauri dev` starts the desktop app.
- [x] App launches without console or runtime errors.

## Core workflow

- [x] User can select a valid Git repository.
- [x] Invalid folder shows a useful error.
- [x] Changed files load for a dirty repo.
- [x] Clean repo state is handled clearly.
- [x] Changed file selection works.
- [x] Diff viewer loads the selected file diff.
- [x] Untracked and no-diff states are handled clearly.

## Local checks

- [x] Supported npm scripts are detected.
- [x] Unavailable commands are disabled with a reason.
- [x] Command success displays correctly.
- [x] Command failure displays correctly.
- [x] stdout and stderr remain readable.

## Pre-Stage Screening

- [x] Deterministic findings appear from current local state.
- [x] `pass`, `info`, `warning`, and `fail` states render correctly.
- [x] No AI is involved.

## Stage Payload

- [x] Payload preview exists.
- [x] Selected diff inclusion is clear.
- [x] Missing evidence limitations are clear.
- [x] Payload is local-only.
- [x] Whole repo is not included by default.

## Token Budget

- [x] Approximate estimate appears.
- [x] Section contribution breakdown appears.
- [x] Warnings appear when evidence is missing or large.
- [x] Estimator limitation is clear.

## Safety Gate

- [x] Safety Gate scans the serialized payload and selected-file diff.
- [x] Fake API key triggers a blocked state.
- [x] Redacted preview appears.
- [x] Original payload remains unchanged.
- [x] No data is sent externally.

## Staging Ground and provider readiness

- [x] Provider readiness appears.
- [x] Missing environment variable shows not configured.
- [x] Configured environment variable shows configured without exposing the key value.
- [x] Future AI action remains disabled.
- [x] Safety Gate blocked prevents future submission eligibility.
- [x] Redacted-payload-only rule is visible.

## Stage Report and Markdown Export

- [x] Local Stage Report preview appears.
- [x] Report is clearly local preview only.
- [x] No AI review is claimed.
- [x] Copy Markdown works.
- [x] Exported Markdown includes local/no-AI label and recommendation.

## UI/demo readiness

- [x] Empty and selected-project demo states look good.
- [x] README screenshots render.
- [x] Pipeline strip is visible.
- [x] Verdict/review rail is clear.
- [x] Code blocks are readable.
- [x] Statuses are consistent.

## Privacy and scope

- [x] No AI/API/network call is made.
- [x] No API key values are displayed, logged, or persisted.
- [x] No RAG implementation is present.
- [x] No Stage History persistence is present.
- [x] No whole-repo upload exists.
- [x] Limitations are documented.

## Release decision

- [x] All MVP checklist items pass.
- [x] Known limitations are documented.
- [x] README accurately reflects current behavior.
- [x] Post-MVP roadmap is clear.
