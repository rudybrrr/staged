# Milestone 8: Staging Ground

Status: Implemented.

## Goal

Add a local review screen that shows the user what would be prepared for a future AI review before any LLM call exists.

Milestone 8 makes Staged's privacy-aware and cost-aware workflow visible. It combines the Stage Payload, payload completeness metadata, Token Budget, and current limitations into a clear pre-submission review area.

This milestone is intentionally narrow and is implemented as a local-only, read-only pre-submission review surface. It does not send anything to an AI model, does not generate a Stage Report, and does not add submission behavior.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestone 0 is complete.

Milestone 1 is complete and supports selecting and inspecting a local Git repository.

Milestone 2 is complete and supports listing changed files.

Milestone 3 is complete and supports displaying read-only file diffs.

Milestone 4 is complete and supports running allowlisted local commands.

Milestone 5 is complete and supports deterministic Pre-Stage Screening findings.

Milestone 6 is complete and supports building and previewing a local Stage Payload with completeness metadata and limitations.

Milestone 7 is complete and supports local Stage Payload size and approximate token estimates with section-level contributions and warnings.

Milestone 8 is implemented and adds a local Staging Ground review surface that summarizes whether the current evidence is ready to review later, while making clear that AI review, Safety Gate enforcement, and redaction are not implemented yet.

## Implemented Scope

Frontend:

- Frontend `StagingGroundReadiness` type.
- Frontend `buildStagingGroundReadiness` utility.
- Frontend Staging Ground panel.
- Existing app state only.
- Read-only UI except for normal existing app interactions.
- Disabled or non-functional submission area that clearly says AI review is not implemented yet.

Readiness summary:

- Show whether a valid Stage Payload exists.
- Show Stage Payload readiness.
- Show payload completeness status.
- Show Token Budget summary when available.
- Show major warnings and limitations.
- Show whether the selected-file diff is included.
- Show whether a command result is included.
- Show whether untracked file contents are omitted.
- Show whether secret redaction is implemented.
- Show whether AI review is available.
- Make missing evidence visible instead of hiding it.
- Make clear this is a local preview and no data is sent anywhere.
- Show explicit blocked states because AI review and secret redaction/Safety Gate enforcement are not implemented.

State inputs:

- Stage Payload.
- Payload completeness metadata.
- Token Budget.
- Pre-Stage Screening findings.
- Command result state.

## Out of Scope

The following are not part of Milestone 8:

- OpenAI API integration.
- Any LLM call.
- Stage Report generation.
- Actual submit button behavior.
- Provider or model selection.
- Prompt construction.
- Secret scanning.
- Redaction.
- Safety Gate enforcement.
- Payload editing.
- Payload inclusion or exclusion controls.
- SQLite.
- Stage History.
- Command history persistence.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Technical Summary

Milestone 8 remains frontend-only and uses existing state. It adds no backend logic, persistence, API calls, submit behavior, or AI behavior.

Implemented readiness shape:

```ts
type StagingGroundReadiness = {
  has_payload: boolean;
  has_selected_file_diff: boolean;
  has_command_result: boolean;
  has_token_budget: boolean;
  has_blocking_limitations: boolean;
  redaction_ready: boolean;
  ai_review_available: boolean;
  status: "not_ready" | "review_only" | "ready_later";
  messages: Array<{
    id: string;
    level: "info" | "warning" | "blocked";
    message: string;
  }>;
};
```

Expected MVP behavior:

- `redaction_ready` is `false` because secret redaction is not implemented yet.
- `ai_review_available` is `false` because no AI integration exists yet.
- The Staging Ground is local only.
- The Staging Ground is read-only.
- The Staging Ground is a pre-submission review surface.
- The Staging Ground is based on the current Stage Payload and Token Budget.
- The Staging Ground is not an AI review.
- The Staging Ground is not a Safety Gate yet.
- The panel does not allow submission.
- The panel shows missing evidence and limitations explicitly.
- The panel uses existing local state only.

Builder behavior:

- Accept the current Stage Payload, payload completeness metadata, Token Budget, Pre-Stage Screening findings, and command result state.
- Report whether a valid Stage Payload exists.
- Report whether selected-file diff evidence is included.
- Report whether command result evidence is included.
- Report whether Token Budget information is available.
- Report known limitations, including omitted untracked file contents.
- Report redaction as not implemented.
- Report AI review as not implemented.
- Do not mutate the Stage Payload.
- Do not construct prompts.
- Do not call APIs.
- Do not submit anything.

## UI Behavior

The Staging Ground panel appears for a valid selected repository when the app has enough local state to show the current review readiness.

The panel shows:

- Local preview notice.
- No-data-sent notice.
- Stage Payload readiness summary.
- Payload completeness summary.
- Token Budget summary when available.
- Evidence inclusion summary.
- Warnings and limitations.
- Redaction status as not implemented.
- AI review status as not implemented.
- Disabled or non-functional submission area explaining that AI review is not available yet.

The panel remains read-only. It does not add payload editing, inclusion controls, submission controls, provider selection, model selection, report generation, secret scanning, redaction, or persistence controls.

Stale Staging Ground state clears when no valid repository or no valid payload exists, including when selecting a non-Git folder or switching away from a valid repository.

## Architecture

```text
StagePayload, payload completeness, TokenBudget, Pre-Stage Screening, command result
  ->
buildStagingGroundReadiness
  ->
StagingGroundReadiness
  ->
StagingGroundPanel
  ->
Read-only local pre-submission review
```

Milestone 8 remains a frontend review layer. Existing backend commands remain focused on repository inspection, changed files, diffs, and command execution.

## Manual Test Plan

### Valid repository

1. Select a valid Git repository.
2. Confirm Staging Ground appears.
3. Confirm it says local preview only.
4. Confirm it says no AI call has been made.
5. Confirm it shows payload readiness from the current Stage Payload.

### Token Budget

1. Confirm Token Budget summary appears when available.
2. Confirm Token Budget limitations remain visible.

### Selected file diff

1. Select a changed file with a loaded diff.
2. Confirm readiness reflects that the selected-file diff is included.

### Command result

1. Run a supported command.
2. Confirm readiness reflects command result availability.

### Known limitations

1. Confirm untracked file contents are shown as omitted when applicable.
2. Confirm redaction is shown as not implemented.
3. Confirm AI review is shown as not implemented.
4. Confirm submission is disabled or non-functional.

### Invalid repository

1. Select a non-Git folder.
2. Confirm stale Staging Ground state clears.

### Feature boundary

1. Confirm no API call has been added.
2. Confirm no LLM call has been added.
3. Confirm no Stage Report has been added.
4. Confirm no secret scanning has been added.
5. Confirm no redaction has been added.
6. Confirm no Safety Gate enforcement has been added.
7. Confirm no persistence has been added.

## Definition of Done

- Staging Ground milestone is implemented and documented.
- Frontend Staging Ground panel is implemented.
- Frontend `StagingGroundReadiness` type is implemented.
- Frontend `buildStagingGroundReadiness` utility is implemented.
- Readiness uses existing app state only.
- Stage Payload readiness is visible.
- Payload completeness status is visible.
- Token Budget summary is visible when available.
- Selected-file diff inclusion is visible.
- Command result inclusion is visible.
- Untracked file content omission is visible.
- Redaction is shown as not implemented.
- AI review is shown as not implemented.
- Submission is disabled or non-functional.
- Local preview and no-data-sent copy is visible.
- Missing evidence is visible instead of hidden.
- Stale state clears when no valid Git repository is selected.
- No OpenAI API integration is added.
- No LLM call is added.
- No Stage Report is added.
- No prompt construction is added.
- No provider or model selection is added.
- No secret scanning or redaction is added.
- No Safety Gate enforcement is added.
- No backend logic is added.
- No persistence is added.

## Notes

Milestone 8 is a local review milestone. Its purpose is to make the future submission boundary explicit before later milestones add Safety Gate checks, redaction, user approval, provider or model selection, AI review, and structured Stage Report generation.
