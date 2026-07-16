# Post-MVP Milestone 15: Stage History Foundation

Status: In progress. Milestone 15A (SQLite storage foundation) and Milestone 15B
(explicit save of completed local scans) are implemented. Milestone 15C (history
browsing) and Milestone 15D (retention and deletion UI) remain pending.

## MVP Boundary

The local-first MVP is complete. It includes repository inspection, changed files, a diff viewer, command runner, Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, local Stage Report preview, Markdown Export, provider readiness, and the future-AI approval boundary.

Milestone 15 begins the post-MVP technical spine. It adds no AI calls, RAG, cloud behavior, or collaboration.

## Goal

Persist local scan and report records so users can review previous Staged runs and future RAG and Stage Trials can compare evidence, retrieval, cost, and report outcomes.

## Purpose

Stage History creates a stable local record of what Staged inspected and produced during a completed run. Saved records are historical snapshots: they describe the repository and evidence at save time and must not imply that the current repository still matches an older scan.

All history remains local-only.

## Recommended Persistence Design

Use SQLite stored locally through the Tauri backend. Database initialization and all read/write operations remain in the backend.

The initial design should use one primary scan record with versioned artifact snapshots. This is the recommended first persistence model, not an irreversible final schema. It keeps save, list, read, and delete behavior simple while leaving room to normalize selected data later if real query or migration needs justify it.

Schema evolution should start with a small explicit database version or migration mechanism. Milestone 15 should not commit the project to a complex migration framework.

## Recommended Implementation Split

### 15A: Persistence schema and storage service

Status: Implemented.

- Initialize the local SQLite database.
- Establish the initial schema version.
- Define backend save, list, read, delete, and clear operations.
- Keep storage types and internal fields technically named rather than branded.

### 15B: Save completed local scans

Status: Implemented.

- Create a new `scan_<uuid-v4>` identifier for every explicit save.
- Derive a versioned SHA-256 `diff_hash` from normalized repository identity,
  sorted changed-file metadata, and the currently selected redacted diff. This
  bounded hash does not cover all changed-file content.
- Save a completed scan only through an explicit user action.
- Persist only explicitly allowlisted artifacts constructed from the Safety
  Gate redacted Stage Payload preview. The original unredacted Stage Payload is
  never an input to the history snapshot builder.
- Validate the typed save DTO and persistence contract in the Tauri backend,
  then save the record through the SQLite storage service.
- Keep the active in-memory app state usable if a write fails.
- Allow blocked Safety Gate scans to be saved locally without changing their
  blocked status or approving provider submission.

### 15C: Stage History list and detail UI

Status: Pending.

- List saved scans in a compact history view.
- Read one saved scan and display its evidence and report snapshots.
- Label all stored content as historical.
- State that the current repository may have changed since the scan was saved.
- Provide empty, loading, and controlled error states.

### 15D: Retention, deletion, and validation pass

Status: Pending.

- Retain saved scans until the user deletes them; do not add automatic expiry in this milestone.
- Delete one saved scan.
- Clear all history only after confirmation.
- Validate stored snapshot versions and malformed data handling.
- Confirm that history operations never modify repository files.
- Confirm that disallowed secrets and repository contents are not persisted.

## Core Record Model

Each saved scan record should include:

- `scan_id`
- `repo_path`
- `repo_name`
- `branch`
- `diff_hash`
- `created_at`
- `changed_file_count`
- `selected_file_path`
- `safety_gate_status`
- `estimated_tokens`
- `report_generation_mode`
- `report_status`
- `recommendation_decision`

`report_generation_mode` must distinguish the current `local_preview` mode from the future `ai_generated` mode without implying that AI generation exists in this milestone.

## Versioned Artifact Snapshots

A scan may store versioned snapshots of:

- The redacted Stage Payload, or a smaller explicitly approved subset.
- Token Budget.
- Pre-Stage Screening findings.
- Safety Gate result.
- Local Stage Report.
- Optional Markdown export text.

Each serialized snapshot should carry enough version information for the backend to validate and interpret it safely. Exact SQL table boundaries and final normalization choices are implementation decisions for 15A, not fixed by this document.

## Privacy and Storage Rules

- Do not persist API keys.
- Do not persist provider secrets.
- Do not persist environment-variable values.
- Do not persist arbitrary whole-repository contents.
- Do not store unredacted secret values.
- Persist the redacted Stage Payload by default.
- Treat original, unredacted payload persistence as out of scope unless a later milestone explicitly justifies and protects it.
- Store only the evidence required to reconstruct the saved historical view.

The presence of a local database does not change the future AI approval boundary. Saving history is not approval to submit data to a provider.

## Required Behavior

Milestone 15 defines:

- Local database initialization.
- Explicit save of a completed local scan.
- List of saved scans.
- Read of one saved scan.
- Delete of one saved scan.
- Clear-all history with confirmation.
- Local-only operation.
- Empty, loading, and error states.

No automatic background save or synchronization is included.

Milestone 15B exposes only the explicit save action. Although the backend
storage foundation already has internal list, read, delete, and clear
operations, frontend history browsing and management remain scoped to 15C and
15D.

## Data Integrity and Error Handling

- `scan_id` must be unique and stable for the saved record.
- `created_at` must use one consistent timestamp convention.
- `diff_hash` must be derived consistently so duplicate or changed scans can be identified.
- The hash input and algorithm should be stable or versioned if they later change.
- Failed writes must not corrupt the active app state or leave a record presented as complete.
- Malformed or unsupported stored JSON must produce a controlled error.
- Deleting one record or clearing history must not modify the repository.
- Database operations must remain in the Tauri backend.

## Stage History UI

The compact history list should show:

- Repository name.
- Branch.
- Creation timestamp.
- Changed-file count.
- Safety Gate status.
- Recommendation.
- Estimated tokens.

The detail view should show the stored evidence and report snapshots. It must clearly label them as historical and warn that paths, branches, diffs, files, and repository state may have changed since the saved run.

## In Scope

- Local SQLite database.
- Database initialization.
- Simple versioned schema evolution.
- Explicit save of completed scan records.
- Save, list, read, delete, and clear-all behavior.
- Stable scan identifiers and locally derived diff hashes.
- Historical evidence and report snapshots.
- Retention and validation behavior.
- Local-only UI states.

## Out of Scope

- AI or provider calls.
- OpenAI integration.
- RAG implementation.
- Tree-sitter.
- Vector retrieval.
- Stage Trials implementation.
- Cloud sync.
- Accounts or team collaboration.
- GitHub integration.
- Automatic background synchronization.
- API key storage.
- Whole-repository persistence.
- Complex analytics dashboards.

## Relationship to Future RAG

Stage History is not RAG. It supplies persistence that later retrieval evaluation can build on.

Future versioned extensions may associate a saved scan with query inputs, retrieved chunk IDs, retrieval methods, scores, token contribution, and cited evidence. Milestone 15 does not add those fields to the initial record unless an optional extension envelope is reserved for later versions.

## Relationship to Future Stage Trials

Future Stage Trials may use saved scan records to compare:

- Diff-only and RAG-assisted results.
- Token usage.
- Retrieval accuracy.
- Seeded bug detection.
- False-positive behavior.

Trial definitions, metrics, and results remain later versioned extensions. They are not implemented or stored by Milestone 15.

## Current Delivery Status

- 15A initializes the local SQLite database and implements internal save, list,
  read, delete, and clear storage operations with versioned artifacts.
- 15B adds one explicit Save to Stage History action and one validated Tauri
  save command. It never saves automatically.
- The stored Stage Payload snapshot comes only from the Safety Gate redacted
  preview. Original payloads, provider readiness, environment-variable values,
  API-key values, raw secret matches, and whole-repository contents are outside
  the approved persistence contract.
- Recursive prohibited-key validation is backend defense in depth; it is not a
  secret scanner and does not prove that arbitrary JSON is secret-free.
- 15C history list/detail UI and 15D retention/deletion UI remain pending.
- No AI calls, RAG, Stage Trials, cloud synchronization, or repository writes
  are implemented by 15A or 15B.

## Manual Test Plan

- Launch with no database and confirm it initializes.
- Save a valid completed local scan.
- Save the same completed evidence twice and confirm it creates two records with
  different scan IDs and the same bounded diff hash.
- Save a blocked Safety Gate result and confirm the success copy preserves the
  blocked status and does not imply submission approval.
- Trigger a controlled backend failure and confirm the current verification
  state remains unchanged.
- Confirm no API key, provider secret, environment-variable value, or unredacted secret is stored.
- Confirm repository files are never modified.
- Confirm malformed or unsupported history data is handled safely.

After 15C and 15D, also verify restart/browsing behavior, historical-state
labels, single-record deletion, and confirmed clear-all behavior.

## Notes

Milestone 15 establishes local persistence as the first post-MVP technical foundation. Its purpose is durable, privacy-conscious history—not analytics, retrieval, synchronization, or AI generation.
