# Post-MVP Milestone 15: Stage History Foundation

Status: Post-MVP planned. Stage History and persistence are not implemented.

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

- Initialize the local SQLite database.
- Establish the initial schema version.
- Define backend save, list, read, delete, and clear operations.
- Keep storage types and internal fields technically named rather than branded.

### 15B: Save completed local scans

- Create a stable `scan_id`.
- Derive a stable `diff_hash` locally from a consistently defined diff input.
- Save a completed scan only through an explicit user action.
- Persist the scan metadata and approved historical artifact snapshots atomically where practical.
- Keep the active in-memory app state usable if a write fails.

### 15C: Stage History list and detail UI

- List saved scans in a compact history view.
- Read one saved scan and display its evidence and report snapshots.
- Label all stored content as historical.
- State that the current repository may have changed since the scan was saved.
- Provide empty, loading, and controlled error states.

### 15D: Retention, deletion, and validation pass

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

Milestone 15 should define and later implement:

- Local database initialization.
- Explicit save of a completed local scan.
- List of saved scans.
- Read of one saved scan.
- Delete of one saved scan.
- Clear-all history with confirmation.
- Local-only operation.
- Empty, loading, and error states.

No automatic background save or synchronization is included.

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

## Definition of Done

- Stage History architecture and scope are documented.
- SQLite is selected as the intended local store.
- The recommended initial record and versioned snapshot model is defined.
- Privacy and redacted-payload-only defaults are explicit.
- Save, list, read, delete, and clear-all behavior is defined.
- Historical-state labeling and repository mismatch warnings are defined.
- RAG and Stage Trials expansion paths are documented without implementation.
- No AI, RAG, cloud, database, migration, or whole-repository persistence is added by this documentation milestone.

## Manual Test Plan for Later Implementation

- Launch with no database and confirm it initializes.
- Save a valid completed local scan.
- Restart the app and confirm the scan remains.
- Open the saved scan.
- Confirm the stored Safety Gate and Stage Report match the saved run.
- Confirm the detail view labels the record as historical and does not claim the repository still matches it.
- Confirm no API key, provider secret, environment-variable value, or unredacted secret is stored.
- Delete one saved record.
- Clear all saved records with confirmation.
- Confirm repository files are never modified.
- Confirm malformed or unsupported history data is handled safely.

## Notes

Milestone 15 establishes local persistence as the first post-MVP technical foundation. Its purpose is durable, privacy-conscious history—not analytics, retrieval, synchronization, or AI generation.
