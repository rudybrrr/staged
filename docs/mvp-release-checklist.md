# MVP Release Checklist

This checklist defines the final acceptance pass before calling Staged MVP-complete.

The MVP is a local-first verification workbench plus a visible safety and approval boundary. It includes repo selection, Git validation, changed files, diff review, allowlisted local checks, Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, local Stage Report preview, Markdown Export, polished demo-ready UI, provider readiness, and an explicit future-AI approval boundary.

The MVP does not include real AI/LLM Stage Report generation, an OpenAI network call, RAG implementation, Tree-sitter retrieval, vector retrieval, Stage History persistence, SQLite, Stage Trials, GitHub PR integration, auto-fixing, cloud sync, or collaboration.

## Build and launch

- [ ] `npm run build` passes.
- [ ] `npm run tauri dev` starts the desktop app.
- [ ] App launches without console or runtime errors.

## Core workflow

- [ ] User can select a valid Git repository.
- [ ] Invalid folder shows a useful error.
- [ ] Changed files load for a dirty repo.
- [ ] Clean repo state is handled clearly.
- [ ] Changed file selection works.
- [ ] Diff viewer loads the selected file diff.
- [ ] Untracked and no-diff states are handled clearly.

## Local checks

- [ ] Supported npm scripts are detected.
- [ ] Unavailable commands are disabled with a reason.
- [ ] Command success displays correctly.
- [ ] Command failure displays correctly.
- [ ] stdout and stderr remain readable.

## Pre-Stage Screening

- [ ] Deterministic findings appear from current local state.
- [ ] `pass`, `info`, `warning`, and `fail` states render correctly.
- [ ] No AI is involved.

## Stage Payload

- [ ] Payload preview exists.
- [ ] Selected diff inclusion is clear.
- [ ] Missing evidence limitations are clear.
- [ ] Payload is local-only.
- [ ] Whole repo is not included by default.

## Token Budget

- [ ] Approximate estimate appears.
- [ ] Section contribution breakdown appears.
- [ ] Warnings appear when evidence is missing or large.
- [ ] Estimator limitation is clear.

## Safety Gate

- [ ] Safety Gate scans the serialized payload and selected-file diff.
- [ ] Fake API key triggers a blocked state.
- [ ] Redacted preview appears.
- [ ] Original payload remains unchanged.
- [ ] No data is sent externally.

## Staging Ground and provider readiness

- [ ] Provider readiness appears.
- [ ] Missing environment variable shows not configured.
- [ ] Configured environment variable shows configured without exposing the key value.
- [ ] Future AI action remains disabled.
- [ ] Safety Gate blocked prevents future submission eligibility.
- [ ] Redacted-payload-only rule is visible.

## Stage Report and Markdown Export

- [ ] Local Stage Report preview appears.
- [ ] Report is clearly local preview only.
- [ ] No AI review is claimed.
- [ ] Copy Markdown works.
- [ ] Exported Markdown includes local/no-AI label and recommendation.

## UI/demo readiness

- [ ] Screenshot states look good.
- [ ] README screenshots render.
- [ ] Pipeline strip is visible.
- [ ] Verdict/review rail is clear.
- [ ] Code blocks are readable.
- [ ] Statuses are consistent.

## Privacy and scope

- [ ] No AI/API/network call is made.
- [ ] No API key values are displayed, logged, or persisted.
- [ ] No RAG implementation is present.
- [ ] No Stage History persistence is present.
- [ ] No whole-repo upload exists.
- [ ] Limitations are documented.

## Release decision

- [ ] All MVP checklist items pass.
- [ ] Known limitations are documented.
- [ ] README accurately reflects current behavior.
- [ ] Post-MVP roadmap is clear.
