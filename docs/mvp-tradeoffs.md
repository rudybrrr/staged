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
- Staging Ground.
- Safety Gate and redaction preview.
- Local read-only Stage Report preview.

## Tradeoffs by area

| Area | Current MVP behavior | Why this choice was made | Current limitation | Later expansion path |
| --- | --- | --- | --- | --- |
| Git operations | Uses the Git CLI first, works from a local repository path, and relies on porcelain status plus unified diff output. | This is simple, inspectable, reliable, and close to normal developer workflow. | No advanced Git graph analysis, staging or unstaging, commit operations, or PR integration. | Add more Git metadata, diff hashes, commit comparison, and optional PR integration after the local MVP works. |
| Changed-file handling | Lists changed files and statuses using `git status --porcelain=v1 --untracked-files=all`. Tracks added, modified, deleted, renamed, copied, untracked, and unknown files. | This gives the app a dependable local change inventory without building a larger indexing system. | No file inclusion or exclusion controls, risk weighting by file type, or workspace-aware grouping yet. | Add selected file sets, omitted evidence lists, file-type heuristics, and change-set grouping. |
| Diff viewer | Shows a read-only unified diff for one selected changed file. It does not fetch every file diff for the payload. Untracked files may have no Git diff output. | This avoids making the first payload too large and keeps the implementation local and simple. | Payloads may contain changed files without diff content. Untracked file contents are not included. There is no syntax highlighting. | Add bounded multi-file diffs, explicit selected and omitted diff lists, optional untracked file content preview with safety checks, and syntax-highlighted diff rendering. |
| Command runner | Runs a strict allowlist: `npm_test`, `npm_lint`, and `npm_typecheck`. Detects root `package.json` scripts before enabling buttons. Captures stdout, stderr, exit code, duration, and success or failure. No arbitrary command input is available. | This provides deterministic local evidence without opening arbitrary shell execution. It keeps safety and scope controlled. | Root `package.json` only. No workspace detection, Cargo, Python, Go, streaming output, command history persistence, or kill process control yet. | Add workspace-aware script detection, a Staged config file for allowlisted commands, Cargo/Python/Go and other ecosystem presets, streaming output, command history, timeouts, and cancel support. |
| Pre-Stage Screening | Shows frontend deterministic findings from existing app state with pass, info, warning, and fail states. It separates local deterministic findings from future AI review. | This proves Staged can organize evidence before an LLM call and avoids pretending AI is needed for simple local facts. | No backend screening engine, dependency checks, test coverage signals, or risk classifier. Safety Gate scanning is separate from Pre-Stage Screening. | Add backend deterministic screening checks, dependency and security checks, test coverage signals, and a heuristic risk classifier kept separate from LLM judgment. |
| Stage Payload | Uses a frontend-only `StagePayload` built from existing local app state. Includes repo metadata, changed files, status counts, selected-file metadata, selected-file diff if already loaded, command result, command availability, screening findings, and payload completeness metadata. Shows a read-only JSON preview. No AI call is made. | This proves Staged can structure evidence before sending anything to a model and makes missing evidence visible. | No backend payload builder, persistence, diff retrieval for every file, untracked file content reading, or schema validation beyond TypeScript. The original payload is not mutated by redaction preview. | Add backend payload generation, stable schema validation, payload diff hash, selected and omitted evidence controls, Safety Gate status, Stage History persistence, and payload export. |
| Payload completeness | Tracks whether the selected diff is included, changed files without diff content, untracked files without content, command result inclusion, supported commands detected, and known limitations. | This keeps the payload honest instead of pretending the evidence is complete. | Completeness is based on current frontend state. It does not enforce required evidence before AI review or block incomplete payloads. | Add required-evidence checks, Staging Ground approval gates, Safety Gate checks, and a payload readiness score or status. |
| Token Budget Estimate | Uses a frontend-only `TokenBudget` built from the current Stage Payload. Shows local approximate character count, byte count, estimated tokens using `Math.ceil(character_count / 4)`, estimator name `chars_div_4`, section-level contribution breakdown, section percentages sorted by size, and warnings for large or missing sections. | This makes context size visible before any AI call and avoids provider, model, pricing, or tokenizer coupling too early. | Not model-specific. Not exact. Not a provider pricing estimate. No tokenizer dependency, remote token counting, configurable budgets, automatic trimming, or AI call. | Add model-aware tokenizer support, provider/model pricing, configurable budgets, payload trimming controls, omitted-evidence warnings, and cost estimates before submission. |
| Staging Ground | Implements a frontend-only, local, read-only pre-submission review surface based on the current Stage Payload, Token Budget, and Safety Gate status. It summarizes readiness, payload completeness, selected-file diff evidence, command result evidence, Safety Gate state, warnings, and limitations. AI review remains unavailable. It does not submit anything. | This makes the privacy and cost boundary visible before any model integration and prevents the MVP from implying that local evidence has already been approved for external submission. | No AI call, provider/model selection, submit behavior, user approval flow, prompt construction, backend logic, persistence, or real submission enforcement. Safety Gate status is visible, but there is no submission path to enforce yet. | Add explicit user approval before submission, Safety Gate enforcement for a real submission path, model/provider selection, structured LLM-generated Stage Reports, and persistent review history. |
| Safety Gate / Redaction | Current MVP Safety Gate is a local frontend pattern scanner. It scans the serialized Stage Payload JSON and also scans the currently loaded selected-file diff directly. It detects likely secret assignments, private key markers, and local machine path exposure. It produces local findings, `pass`/`warning`/`blocked` status, scan coverage, scanner limitations, and a redacted preview without mutating the original Stage Payload. No data is sent anywhere. | This makes privacy risk visible before AI integration while keeping implementation narrow, deterministic, and local-first. Scanning the selected diff directly covers the most visible detailed evidence without expanding to broad file reads. | The pattern scanner can miss secrets and can produce false positives. It does not scan all changed files, perform bounded full-repo scanning, validate whether a detected string is live, provide backend enforcement, persist decisions, support user-editable rules, or submit anything. | Safety Gate v2 should add local-only scanning of changed tracked files, optional bounded repository text-file scanning, ignore rules for `.git`, `node_modules`, `dist`, `target`, build outputs, large files, binaries, and lockfiles where appropriate, stronger secret patterns, optional entropy checks, configurable redaction rules, persisted decisions, and payload submission blocking until Safety Gate passes or the user explicitly overrides. This still does not mean sending the whole repo to an LLM. |
| Structured Stage Report | Milestone 10 Phase 10A is implemented as a frontend-only local report preview. It defines a `StageReport` type, builds a local preview from existing deterministic local evidence, and shows a read-only Stage Report panel. It includes report metadata, repo/change summary, Pre-Stage Screening findings, command result summary when available, Safety Gate status, Token Budget estimate, payload limitations, missing evidence, a human review checklist, and conservative recommendations. It does not make API calls or generate an AI report. | This validates the report contract and UX before introducing provider configuration, prompts, API keys, or model behavior. It keeps deterministic evidence separate from future AI judgment. | The Phase 10A report is local only, read-only, not AI-generated, not persisted, not submitted, and not a claim that code is safe to commit. Deterministic local-preview risk findings and recommendations are conservative summaries of current local state. Safety Gate `blocked` status leads to `do_not_submit`. | Phase 10B can add structured LLM-generated Stage Reports after Safety Gate, Staging Ground, Stage Payload readiness, Token Budget visibility, user approval, and current official provider API docs are in place. Future model responses should use prompt construction, provider/model selection, structured output validation, retry/streaming behavior where appropriate, and Stage History persistence only when deliberately added. |
| Privacy and Safety | The app is local-first. There are no AI calls yet. Stage Payload, Safety Gate, redaction preview, Staging Ground, and Stage Report preview are local previews only. The original Stage Payload is not mutated by redaction preview, and no data is sent anywhere. | This keeps sensitive evidence local while the verification flow is still being built. | Payloads and local reports may include sensitive paths, diffs, stdout, stderr, or file names. The current scanner is pattern-based only and can miss secrets or flag harmless strings. There is no backend scanning, full-repo scanning, submit approval, persistence, or real Safety Gate enforcement yet. | Add stronger secret scanning, backend enforcement, user approval before payload submission, configurable privacy controls, persisted redaction decisions, and clear override behavior for a future submission path. |
| AI integration | No AI integration exists yet. Milestone 10A provides only a local Stage Report preview, not AI generation. There is no OpenAI API call, LLM call, prompt construction, API key storage, provider selection, or model selection. | The local verification spine and report schema must work before adding LLM reasoning. Staged is not a GPT wrapper and should not send whole repositories to an LLM by default. | No AI-assisted review or AI-generated structured report yet. Deterministic evidence and future AI judgment remain separate. | Add structured LLM output in Phase 10B, evidence-grounded findings, provider/model configuration, prompt construction, validated structured output from model responses, retry/streaming behavior where needed, and Stage History persistence from a compact approved redacted payload. |
| Persistence | No SQLite persistence, Stage History, or command history exists yet. | This avoids persistence complexity before the core workflow is validated. | Reports and payloads are not saved. Past scans are not comparable. | Add SQLite-backed Stage History, scan records, diff hash caching, command result history, and report export. |
| Retrieval, parsing, and RAG | No RAG, vector search, Tree-sitter, or codebase graph exists yet. Current Safety Gate scanning is not retrieval; it only checks the Stage Payload JSON and currently loaded selected-file diff for patterns. Future bounded full-repo local scanning for Safety Gate would still be secret/risk scanning, not RAG. | Retrieval should come after a working payload, token budget, and Safety Gate boundary. Staged should reduce context before adding advanced retrieval. Proper RAG means source-backed local retrieval with metadata, scoring, citations, token budgeting, and evaluation, not manually attaching extra files to an LLM request. | Payload context is based only on currently collected local evidence. There is no symbol-aware context expansion. RAG is not the same as local changed-file scanning, full-repo scanning, or secret scanning. Sending whole repositories to an LLM is not RAG and should not be the default. | Add RAG as a post-MVP context-selection subsystem for AI review. Level 1 should use lexical retrieval with `ripgrep`. Level 2 should add symbol-aware retrieval with Tree-sitter. Level 3 should add hybrid vector retrieval only after lexical and symbol retrieval work. RAG should select relevant snippets, improve evidence quality, and reduce payload size rather than blindly expanding context. See `docs/rag-architecture.md`. |

## UI and frontend design debt

The current MVP UI is functional and panel-based. Styling is intentionally simple, and components prioritize implementation clarity over visual polish while the MVP validates the local verification workflow first.

Visual hierarchy, spacing, layout, and component consistency need a dedicated pass. Portfolio screenshots will need polish before final presentation.

Later expansion path:

- Add a post-MVP design polish milestone.
- Standardize layout, cards, badges, buttons, empty states, and code/output panels.
- Improve information hierarchy across Pre-Stage Screening, Stage Payload, Token Budget, Safety Gate, and Staging Ground.
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
- Submit behavior.
