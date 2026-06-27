# Milestone 7: Token Budget Estimate

Status: Implemented.

## Goal

Add a local, approximate, section-aware payload size and token estimate for the current Stage Payload before any AI call exists.

Milestone 7 makes the cost and context-size impact of the Stage Payload visible before model integration. It helps users understand which payload sections dominate the estimate and which evidence limitations still exist.

This milestone is intentionally narrow. It does not include OpenAI API integration, LLM calls, model selection, provider pricing, exact tokenization, payload trimming, approval workflow, Stage Reports, persistence, secret scanning, redaction, or backend token counting.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestone 0 is complete.

Milestone 1 is complete and supports selecting and inspecting a local Git repository.

Milestone 2 is complete and supports listing changed files.

Milestone 3 is complete and supports displaying read-only file diffs.

Milestone 4 is complete and supports running allowlisted local commands.

Milestone 5 is complete and supports deterministic Pre-Stage Screening findings.

Milestone 6 is complete and supports building and previewing a local Stage Payload with completeness metadata and limitations.

Milestone 7 is implemented and estimates the size of that existing Stage Payload locally, without sending it anywhere.

## Implemented

Frontend:

- Frontend `TokenBudget` type.
- Frontend `buildTokenBudget` utility.
- Read-only Token Budget panel.
- Estimate updates when the Stage Payload changes.
- Local JavaScript only.
- No backend logic.
- No new dependencies.

Estimate:

- Use the current local `StagePayload` only.
- Estimate payload characters.
- Estimate payload bytes.
- Estimate input tokens using `Math.ceil(character_count / 4)`.
- Include estimator name `chars_div_4`.
- Include an estimator note explaining that the estimate is approximate and tokenizer-independent.
- Use `JSON.stringify(payload)` or section-specific JSON strings for size estimates.

Breakdown:

- Show section-level size contributions.
- Show percentage contribution by section.
- Include sections such as:
  - `repo`
  - `changes.files`
  - `changes.selected_file`
  - `changes.selected_file_diff`
  - `command_availability`
  - `command_result`
  - `command_error`
  - `screening_findings`
  - `payload_completeness`

Warnings:

- Approximate tokenizer-independent estimate.
- No selected file diff is included.
- Some changed files are listed without diff content.
- Untracked file contents are not included.
- No command result is included.
- No supported npm scripts were detected.
- Secret redaction is not implemented yet.
- Payload exceeds 8,000 estimated tokens.
- Payload exceeds 16,000 estimated tokens.
- Selected file diff is the largest payload section.
- Command output is a large payload section.

The estimate is local, approximate, section-aware, and based on the current Stage Payload. It is not model-specific, not a provider pricing estimate, and not an exact tokenizer count.

## Out of Scope

The following are not part of Milestone 7:

- OpenAI API integration.
- Any LLM call.
- Model dropdowns.
- Provider pricing.
- Exact tokenization.
- `tiktoken` or another tokenizer dependency.
- Remote token counting.
- Automatic payload trimming.
- Payload inclusion or exclusion controls.
- Staging Ground approval workflow.
- Stage Report.
- Secret scanning.
- Redaction.
- SQLite.
- Stage History.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.

## Technical Summary

Milestone 7 adds a frontend-only token budget estimate computed from the existing `StagePayload`. The estimate is local, approximate, section-aware, and model-independent.

Conceptual shape:

```ts
type TokenBudget = {
  estimator: "chars_div_4";
  estimator_note: string;
  character_count: number;
  byte_count: number;
  estimated_tokens: number;
  sections: Array<{
    name: string;
    character_count: number;
    byte_count: number;
    estimated_tokens: number;
    percentage: number;
  }>;
  warnings: Array<{
    id: string;
    level: "info" | "warning";
    message: string;
  }>;
};
```

Implemented frontend pieces:

- `TokenBudget` type.
- `buildTokenBudget` utility.
- `TokenBudgetPanel` component.

Builder behavior:

- Accept the current `StagePayload`.
- Serialize the full payload and each major section locally.
- Count characters.
- Count bytes.
- Estimate tokens with `Math.ceil(character_count / 4)`.
- Compute section percentages from section character counts.
- Generate warnings from payload size, section dominance, and payload completeness metadata.
- Do not call an API.
- Do not use provider pricing.
- Do not use exact tokenization.
- Do not trim or mutate the Stage Payload.

## UI Behavior

The Token Budget panel appears when a Stage Payload exists.

The panel shows:

- Estimator name.
- Estimator limitation note.
- Total characters.
- Total bytes.
- Estimated input tokens.
- Section-level contribution table or list.
- Percentage contribution by section.
- Warnings and known limitations.

The panel is read-only. It does not add model selection, pricing, trimming controls, inclusion controls, approval actions, report generation, AI calls, secret redaction, or persistence controls.

The estimate updates when the Stage Payload changes:

- Repo selection changes.
- Changed files refresh.
- Selected changed file changes.
- Selected file diff loads.
- Latest command result changes.
- Command error changes.
- Pre-Stage Screening findings change.
- Payload completeness metadata changes.

## Not Implemented Yet

Milestone 7 does not add an AI call, Staging Ground approval workflow, Stage Report, secret redaction, exact tokenizer, model pricing, or payload trimming.

## Architecture

```text
StagePayload
  ->
buildTokenBudget
  ->
TokenBudget
  ->
TokenBudgetPanel
  ->
Read-only local size estimate and warnings
```

Milestone 7 remains a frontend-only estimation layer. Existing backend commands remain focused on repository inspection, changed files, diffs, and command execution.

## Manual Test Plan

### Valid repository

1. Select a valid Git repository.
2. Confirm the Stage Payload exists.
3. Confirm the Token Budget panel appears.
4. Confirm total characters, bytes, and estimated tokens are shown.

### Modified tracked file

1. Modify a tracked file.
2. Refresh changed files.
3. Confirm the Stage Payload updates.
4. Confirm the Token Budget estimate updates.

### Selected file diff

1. Select a changed file with a loaded diff.
2. Confirm `changes.selected_file_diff` appears as a section contributor.
3. Confirm the selected file diff affects the total estimate.

### Command result

1. Run an available command.
2. Confirm `command_result` contributes to the estimate.
3. Confirm large command output can produce a warning when applicable.

### Warnings

1. Confirm a warning appears when no selected file diff is included.
2. Confirm a warning appears when some changed files are listed without diff content.
3. Confirm a warning appears when untracked file contents are not included.
4. Confirm a warning appears when no command result is included.
5. Confirm a warning appears when secret redaction is not implemented.

### Feature boundary

1. Confirm no API call has been added.
2. Confirm no model pricing estimate has been added.
3. Confirm no exact tokenizer has been added.
4. Confirm no tokenizer dependency has been added.
5. Confirm no payload trimming has been added.
6. Confirm no backend token-counting logic has been added.

## Definition of Done

- Done: `TokenBudget` type exists.
- Done: `buildTokenBudget` utility exists.
- Done: Token Budget panel exists.
- Done: Estimate is computed locally from `StagePayload`.
- Done: Total character count is visible.
- Done: Total byte count is visible.
- Done: Estimated input token count is visible.
- Done: Estimator name is visible.
- Done: Estimator limitation note is visible.
- Done: Section-level size contribution is visible.
- Done: Percentage contribution by section is visible.
- Done: Warnings and estimator limitations are visible.
- Done: Estimate updates when the Stage Payload changes.
- Done: No AI integration has been added.
- Done: No LLM call has been added.
- Done: No pricing has been added.
- Done: No exact tokenizer has been added.
- Done: No tokenizer dependency has been added.
- Done: No automatic payload trimming has been added.
- Done: No backend token-budget logic has been added.

## Notes

Milestone 7 is an estimation milestone. Its purpose is to make local payload size visible before later milestones introduce model-aware tokenization, provider pricing, configurable budgets, trimming controls, omitted-evidence warnings, approval workflow, AI review, reports, history, redaction, or integrations.
