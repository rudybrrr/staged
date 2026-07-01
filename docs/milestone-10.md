# Milestone 10: Structured Stage Report

Status: Phase 10A implemented. Phase 10B not implemented.

## Goal

Define and preview a structured Stage Report generated from the approved local evidence bundle, while keeping deterministic evidence separate from future AI judgment.

Milestone 10 is split into two phases. Phase 10A is implemented and validates the report shape, local preview builder, and read-only UI without any LLM call. Phase 10B remains future work and can add structured AI generation only after the schema, Staging Ground, Safety Gate, and payload readiness rules are stable.

The current Stage Report is local only, read-only, generated from deterministic local evidence, not AI-generated, and not a claim that the code is safe to commit.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestones 0 through 9 are complete and cover project setup, local repository inspection, changed files, read-only diffs, allowlisted command execution, deterministic Pre-Stage Screening, Stage Payload preview, Token Budget estimates, Staging Ground readiness, and a local Safety Gate with redaction preview.

Milestone 10A adds the first structured report surface. It summarizes existing local evidence without implying that an AI review has happened. Deterministic evidence and future AI judgment remain separate.

## Phase 10A Implemented Scope

Frontend:

- Frontend `StageReport` type.
- Frontend `buildLocalStageReportPreview` utility.
- Read-only Stage Report panel.
- Local report preview generated from existing frontend state only.
- Clear labeling that the report is a local preview and is not AI-generated.
- Clear separation between deterministic evidence and future AI judgment.

Report sections:

- Report metadata.
- Repo and change summary.
- Deterministic evidence summary.
- Pre-Stage Screening findings.
- Command result summary when available.
- Safety Gate status.
- Token Budget estimate.
- Payload limitations.
- Deterministic local-preview risk findings.
- Missing evidence list.
- Human review checklist.
- Conservative recommendation logic.

Inputs:

- Stage Payload.
- Pre-Stage Screening findings.
- Token Budget.
- Safety Gate result.
- Staging Ground readiness.
- Command result from the payload.

Implemented behavior:

- Uses existing local frontend state only.
- Does not mutate the Stage Payload.
- Does not construct prompts.
- Does not call APIs.
- Does not call an LLM.
- Does not add provider or model selection.
- Does not add backend logic.
- Does not add persistence or Stage History.
- Treats Safety Gate `blocked` status as `do_not_submit`.

## Phase 10B Not Implemented

The following remain out of scope and are not implemented:

- Real LLM Stage Report generation.
- OpenAI or other API integration.
- Provider selection.
- Model selection.
- Prompt construction.
- API key storage.
- Structured output validation from model responses.
- Streaming behavior.
- Retry behavior.
- Report persistence.
- SQLite.
- Stage History.
- Auto-fixing.
- GitHub PR integration.
- RAG.
- Tree-sitter.
- Vector search.
- Backend report generation.

## Technical Summary

Phase 10A is frontend-only and uses existing local state. It adds no backend logic, persistence, network calls, API calls, submit behavior, or AI behavior.

Conceptual report shape:

```ts
type StageReport = {
  schema_version: "stage-report.v1";
  generated_at: string;
  generation_mode: "local_preview" | "ai_generated";
  report_status: "preview_only" | "complete";
  summary: {
    repo_name: string;
    branch: string | null;
    changed_file_count: number;
    selected_file_path: string | null;
  };
  deterministic_evidence: {
    screening_findings: Array<unknown>;
    command_result: unknown | null;
    safety_gate_status: "pass" | "warning" | "blocked";
    token_budget_estimated_tokens: number | null;
    payload_limitations: string[];
  };
  risk_findings: Array<{
    id: string;
    level: "info" | "warning" | "high";
    title: string;
    detail: string;
    source: "local_preview" | "future_ai";
  }>;
  missing_evidence: string[];
  human_review_checklist: string[];
  recommendation: {
    decision: "review_manually" | "do_not_submit" | "ready_for_future_ai_review";
    rationale: string;
  };
};
```

Builder behavior:

- Accepts the current Stage Payload, Pre-Stage Screening findings, Token Budget, Safety Gate result, Staging Ground readiness, and command result.
- Populates report metadata and change summary from the payload.
- Summarizes deterministic evidence without reclassifying it as AI judgment.
- Surfaces Safety Gate status and Token Budget estimate.
- Converts payload limitations into missing evidence.
- Adds local-preview risk findings with `source: "local_preview"`.
- Uses conservative recommendations when Safety Gate is blocked or required evidence is missing.
- Does not submit anything.

## UI Behavior

The Stage Report panel appears when a valid local Stage Payload exists.

The panel shows:

- Local preview notice.
- Not-AI-generated notice.
- Report metadata.
- Repo and change summary.
- Deterministic evidence summary.
- Safety Gate status.
- Token Budget estimate.
- Command result summary.
- Missing evidence.
- Human review checklist.
- Conservative recommendation.
- Clear label for future AI judgment that is not available yet.

The panel remains read-only. It does not add report editing, provider selection, model selection, prompt controls, submit behavior, persistence controls, or Stage History.

Stale Stage Report state clears when no valid repository or no valid payload exists, including when selecting a non-Git folder or switching away from a valid repository.

## Architecture

```text
Stage Payload, Pre-Stage Screening, Token Budget, Safety Gate, Staging Ground
  ->
buildLocalStageReportPreview
  ->
StageReport
  ->
Stage Report panel
  ->
Read-only local report preview
```

Milestone 10A remains a frontend reporting layer. Existing backend commands remain focused on repository inspection, changed files, diffs, and command execution.

## Manual Test Plan

### Valid repository

1. Select a valid Git repository.
2. Confirm the local Stage Report preview appears when a Stage Payload exists.
3. Confirm it clearly says local preview only and not AI-generated.
4. Confirm repo metadata and changed-file count appear.

### Command result

1. Run an available command.
2. Confirm the command result summary updates in the Stage Report preview.

### Safety Gate

1. Add or select a changed file containing a fake API key such as `API_KEY=fake_test_key_123`.
2. Confirm Safety Gate status becomes blocked.
3. Confirm the Stage Report recommendation becomes `do_not_submit`.
4. Confirm the report does not claim the code is safe to commit.

### Token Budget

1. Confirm Token Budget estimate appears.
2. Confirm Token Budget limitations remain visible.

### Missing evidence

1. Confirm missing evidence reflects payload limitations.
2. Confirm omitted diff or untracked-file content limitations are not hidden.

### Invalid repository

1. Select a non-Git folder.
2. Confirm stale Stage Report state clears.

### Feature boundary

1. Confirm no API call has been added.
2. Confirm no LLM call or AI review exists.
3. Confirm no provider or model selection has been added.
4. Confirm no prompt construction has been added.
5. Confirm no API key storage has been added.
6. Confirm no Stage History has been added.
7. Confirm no persistence has been added.

## Definition of Done for Phase 10A

- Stage Report schema exists.
- Local preview report builder exists.
- Stage Report preview panel exists.
- Report uses existing local evidence only.
- Report clearly labels deterministic evidence separately from future AI judgment.
- Report clearly says it is a local preview and not AI-generated.
- Safety Gate status is included.
- Safety Gate blocked status leads to `do_not_submit`.
- Token Budget estimate is included.
- Command result summary is included when available.
- Missing evidence is visible.
- Conservative recommendation behavior is visible.
- Stale report state clears when no valid Git repository or payload exists.
- No OpenAI API integration is added.
- No LLM call is added.
- No prompt construction is added.
- No provider or model selection is added.
- No backend logic is added.
- No persistence is added.

## Future Phase 10B Notes

Real LLM report generation should happen only after:

- Safety Gate result is available.
- Staging Ground readiness is available.
- Stage Payload and Token Budget are visible.
- User approval flow is defined.
- Official provider API docs are checked.

The LLM should receive a compact, approved, redacted payload, not the whole repository.

Structured output should be validated before rendering as a Stage Report.

Phase 10B may add:

- Structured LLM-generated Stage Report.
- OpenAI or other provider API integration.
- Provider and model configuration.
- Prompt construction.
- Validated structured output from model responses.
- Retry or streaming behavior.
- Stage History persistence.
- Clear distinction between deterministic evidence and AI judgment.

## Notes

Milestone 10A does not make Staged a GPT wrapper. The local Stage Report preview makes the evidence contract clearer before any AI integration exists.

The report summarizes what Staged already knows locally, identifies what evidence is missing, and preserves a conservative human review path until structured AI generation is deliberately added later.
