# MVP Tradeoffs and Expansion Paths

## Purpose of this document

This document tracks intentional MVP tradeoffs, current limitations, and planned expansion paths for Staged.

These constraints are not accidental omissions. They are scope decisions that keep the MVP focused on a working local verification spine before adding heavier systems, persistence, retrieval, or AI reasoning.

Update this file whenever milestone documentation is created or changed for a milestone that introduces, removes, or changes an MVP constraint.

## Locked product direction

Staged is a pre-commit verification layer for developers using AI coding agents.

Staged is not a generic AI code reviewer. It is not a GPT wrapper. The product should continue to look and behave like a local-first verification workbench that collects, organizes, and explains concrete evidence before asking an LLM to reason over it.

Local evidence comes before AI reasoning. Whole repositories are not sent to an LLM by default. Deterministic findings must stay separate from heuristic risk signals and LLM judgment.

The MVP should avoid premature complexity until the local verification spine works reliably.

## Current MVP spine

The implemented MVP flow currently includes:

- Repo picker.
- Git repo validation.
- Changed files.
- Diff viewer.
- Configurable command runner.
- Repo-aware command availability.
- Pre-Stage Screening.
- Stage Payload preview.
- Payload completeness metadata.
- Token Budget estimate.

## Tradeoffs by area

| Area | Current MVP behavior | Why this choice was made | Current limitation | Later expansion path |
| --- | --- | --- | --- | --- |
| Git operations | Uses the Git CLI first, works from a local repository path, and relies on porcelain status plus unified diff output. | This is simple, inspectable, reliable, and close to normal developer workflow. | No advanced Git graph analysis, staging or unstaging, commit operations, or PR integration. | Add more Git metadata, diff hashes, commit comparison, and optional PR integration after the local MVP works. |
| Changed-file handling | Lists changed files and statuses using `git status --porcelain=v1 --untracked-files=all`. Tracks added, modified, deleted, renamed, copied, untracked, and unknown files. | This gives the app a dependable local change inventory without building a larger indexing system. | No file inclusion or exclusion controls, risk weighting by file type, or workspace-aware grouping yet. | Add selected file sets, omitted evidence lists, file-type heuristics, and change-set grouping. |
| Diff viewer | Shows a read-only unified diff for one selected changed file. It does not fetch every file diff for the payload. Untracked files may have no Git diff output. | This avoids making the first payload too large and keeps the implementation local and simple. | Payloads may contain changed files without diff content. Untracked file contents are not included. There is no syntax highlighting. | Add bounded multi-file diffs, explicit selected and omitted diff lists, optional untracked file content preview with safety checks, and syntax-highlighted diff rendering. |
| Command runner | Runs a strict allowlist: `npm_test`, `npm_lint`, and `npm_typecheck`. Detects root `package.json` scripts before enabling buttons. Captures stdout, stderr, exit code, duration, and success or failure. No arbitrary command input is available. | This provides deterministic local evidence without opening arbitrary shell execution. It keeps safety and scope controlled. | Root `package.json` only. No workspace detection, Cargo, Python, Go, streaming output, command history persistence, or kill process control yet. | Add workspace-aware script detection, a Staged config file for allowlisted commands, Cargo/Python/Go and other ecosystem presets, streaming output, command history, timeouts, and cancel support. |
| Pre-Stage Screening | Shows frontend deterministic findings from existing app state with pass, info, warning, and fail states. It separates local deterministic findings from future AI review. | This proves Staged can organize evidence before an LLM call and avoids pretending AI is needed for simple local facts. | No backend screening engine, secret scanning, dependency checks, test coverage signals, or risk classifier. | Add backend deterministic screening checks, secret scanning and redaction status, dependency and security checks, test coverage signals, and a heuristic risk classifier kept separate from LLM judgment. |
| Stage Payload | Uses a frontend-only `StagePayload` built from existing local app state. Includes repo metadata, changed files, status counts, selected-file metadata, selected-file diff if already loaded, command result, command availability, screening findings, and payload completeness metadata. Shows a read-only JSON preview. No AI call is made. | This proves Staged can structure evidence before sending anything to a model and makes missing evidence visible. | No backend payload builder, persistence, redaction, diff retrieval for every file, untracked file content reading, or schema validation beyond TypeScript. | Add backend payload generation, stable schema validation, payload diff hash, selected and omitted evidence controls, redaction status, Stage History persistence, and payload export. |
| Payload completeness | Tracks whether the selected diff is included, changed files without diff content, untracked files without content, command result inclusion, supported commands detected, and known limitations. | This keeps the payload honest instead of pretending the evidence is complete. | Completeness is based on current frontend state. It does not enforce required evidence before AI review or block incomplete payloads. | Add required-evidence checks, Staging Ground approval gates, Safety Gate checks, and a payload readiness score or status. |
| Token Budget Estimate | Uses a frontend-only `TokenBudget` built from the current Stage Payload. Shows local approximate character count, byte count, estimated tokens using `Math.ceil(character_count / 4)`, estimator name `chars_div_4`, section-level contribution breakdown, section percentages sorted by size, and warnings for large or missing sections. | This makes context size visible before any AI call and avoids provider, model, pricing, or tokenizer coupling too early. | Not model-specific. Not exact. Not a provider pricing estimate. No tokenizer dependency, remote token counting, configurable budgets, automatic trimming, or AI call. Secret redaction is still not implemented. | Add model-aware tokenizer support, provider/model pricing, configurable budgets, payload trimming controls, omitted-evidence warnings, and cost estimates before submission. |
| Privacy and Safety | The app is local-first. There are no AI calls yet. Stage Payload is a local preview only. Secret redaction is not implemented yet. | This keeps sensitive evidence local while the verification flow is still being built. | Payloads may include sensitive paths, diffs, stdout, stderr, or file names. No Safety Gate or redaction status exists yet. | Add secret scanning, redaction preview, a Safety Gate before any LLM call, user approval before payload submission, and configurable privacy controls. |
| AI integration | No AI integration exists yet. There is no OpenAI API call, Stage Report, or model selection. | The local verification spine must work before adding LLM reasoning. | No AI-assisted review or structured report yet. | Add structured LLM output, Stage Report, evidence-grounded findings, clear separation between deterministic evidence and AI judgment, and model/provider configuration. |
| Persistence | No SQLite persistence, Stage History, or command history exists yet. | This avoids persistence complexity before the core workflow is validated. | Reports and payloads are not saved. Past scans are not comparable. | Add SQLite-backed Stage History, scan records, diff hash caching, command result history, and report export. |
| Retrieval, parsing, and RAG | No RAG, vector search, Tree-sitter, or codebase graph exists yet. | Retrieval should come after a working payload and token budget system. Staged should reduce context before adding advanced retrieval. | Payload context is based only on currently collected local evidence. There is no symbol-aware context expansion. | Add ripgrep-based retrieval first, Tree-sitter symbol extraction, local vector retrieval, bounded context expansion, and Stage Trials evaluation. |

## UI and frontend design debt

The current MVP UI is functional and panel-based. Styling is intentionally simple, and components prioritize implementation clarity over visual polish while the MVP validates the local verification workflow first.

Visual hierarchy, spacing, layout, and component consistency need a dedicated pass. Portfolio screenshots will need polish before final presentation.

Later expansion path:

- Add a post-MVP design polish milestone.
- Standardize layout, cards, badges, buttons, empty states, and code/output panels.
- Improve information hierarchy across Pre-Stage Screening, Stage Payload, and Token Budget.
- Consider shadcn/ui adoption or a small internal component system.
- Improve responsive and screenshot-ready states.

## Documentation maintenance rule

When a milestone doc is created or marked complete, update this file if the milestone introduces:

- A new MVP shortcut.
- A new limitation.
- A deferred feature.
- A future expansion path.
- A change in product scope.

Keep this file honest and concise. Do not use it to hide weak decisions. If a shortcut is risky, say so plainly.

## Current non-goals

The current MVP does not include:

- Agents.
- Auto-fixing.
- GitHub PR integration.
- Cloud sync.
- Collaboration.
- Full codebase graphing.
- Arbitrary shell command input.
- Sending whole repositories to an LLM.
- AI review before local evidence packaging.
