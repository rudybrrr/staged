# Post-MVP Milestone 14: Real Structured AI Stage Report Generation

Status: Post-MVP planned. This milestone is not required for the MVP cut.

## MVP Boundary

The MVP ends after Milestone 13 with local-first verification, provider readiness metadata, and the safety/approval boundary. It does not include real AI/LLM calls, OpenAI integration, RAG implementation, Stage History, or persistence.

Milestone 14 is a future expansion for real structured AI Stage Report generation after the local verification spine is already proven.

## Goal

Generate the first post-MVP AI-assisted Stage Report from the approved, redacted Stage Payload using structured output, while keeping deterministic evidence separate from AI judgment.

## Purpose

Milestone 14 would extend Staged from a local verification and reporting workbench into an AI-assisted verification workbench.

The AI generation path must operate only on the approved redacted Stage Payload. It must not receive the whole repository, unredacted payload content, API key values, or unrelated local files.

The resulting report must be structured, validated, and clearly labeled as AI-generated. Deterministic local evidence remains separate from model judgment.

## Product Context

Staged is a Tauri v2, React, TypeScript, Vite, and Tailwind desktop app.

The local verification spine is implemented. Markdown Export is implemented. Milestone 12 UI polish and the 12F visual redesign are complete. README screenshots are added. Milestone 13 Provider/API Setup and Approval Flow is implemented.

The MVP proves local repo inspection, changed files, diff viewer, local command runner, deterministic Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, local Stage Report preview, Markdown Export, and the provider readiness / approval boundary.

Provider readiness currently checks local environment variables only. The future AI action is visible but disabled. RAG architecture is documented in `docs/rag-architecture.md`, but RAG is post-MVP and not implemented. Stage History persistence is not implemented. Real AI Stage Report generation is post-MVP and not implemented yet.

## Official API Basis

Future implementation should use the OpenAI Responses API with structured output from a JSON schema. The model should be configurable and must not be hardcoded in milestone documentation or product copy.

Before implementation, verify the current official OpenAI documentation again. At the time of this planning document, the official Responses API guidance describes structured outputs through a JSON schema format with strict schema behavior, such as a `json_schema` response format, required fields, and `additionalProperties: false`.

Milestone 14 should not use free-form model text as the report contract.

## In Scope

Post-MVP Milestone 14 includes:

- Backend AI generation command.
- OpenAI Responses API integration.
- Environment-based API key usage from the existing provider readiness approach.
- Approved redacted payload submission only.
- Safety Gate enforcement before submission.
- Token Budget and payload limitation visibility before submission.
- Structured Stage Report output using JSON schema.
- Response validation before rendering.
- Loading state.
- Error state.
- Invalid structured output handling.
- AI-generated Stage Report rendering.
- Clear labels separating deterministic local evidence, future retrieved/context evidence, and AI judgment.
- Explicit user action through `Generate AI Stage Report`.

No automatic submission is allowed.

## Safety Rules

AI generation must be blocked when:

- Safety Gate status is `blocked`.
- No Stage Payload exists.
- No redacted payload exists.
- Provider readiness is not configured.

Submission rules:

- Never send the whole repository.
- Never send unredacted payload content.
- Never send API key values to the frontend.
- Never log API key values.
- Do not persist the API key.
- Do not claim code is safe to commit.

Safety Gate `pass` or `warning` can allow generation eligibility only when provider readiness, Stage Payload, redacted payload, and explicit user approval are also present. Warning states must remain visible before submission.

## Recommended Implementation Approach

Add a backend Tauri command conceptually named `generate_ai_stage_report`.

The frontend should pass only:

- The approved redacted payload.
- Relevant report metadata.
- Current Safety Gate status.
- Token Budget summary and warnings.
- Payload limitation metadata.

The backend should:

- Re-check that the payload is redacted and eligible.
- Read the API key from the existing environment-variable approach.
- Build the OpenAI Responses API request.
- Attach the Stage Report JSON schema as the required structured output format.
- Use a configurable model value.
- Parse and validate the response before returning it to the frontend.
- Return an error for invalid response shape instead of returning a partial report.

The frontend should render the AI report only after validation succeeds.

Store no report history in this milestone.

## Structured Output Shape

The AI Stage Report schema should include:

```json
{
  "schema_version": "string",
  "generation_mode": "ai_generated",
  "report_status": "complete",
  "summary": "string",
  "risk_level": "string",
  "deterministic_evidence_used": [],
  "ai_findings": [],
  "missing_evidence": [],
  "test_recommendations": [],
  "human_review_checklist": [],
  "recommendation": "string",
  "limitations": [],
  "confidence": "string"
}
```

Each AI finding should include:

- `id`
- `severity`
- `title`
- `detail`
- `evidence_refs`
- `recommendation`
- `source: "ai_generated"`

Evidence references must point to existing payload sections or future retrieved context IDs. The model must not invent file or line citations that are not present in the submitted payload.

## Evidence Boundaries

The rendered Stage Report must clearly separate:

- Deterministic local evidence.
- Retrieved or contextual evidence, if added in a later milestone.
- AI judgment.

Deterministic local evidence includes repository metadata, changed-file metadata, selected diff evidence, command results, Pre-Stage Screening findings, Safety Gate results, redaction status, Token Budget estimates, and payload limitation metadata.

AI judgment includes summary, risk interpretation, AI findings, recommendations, limitations, and confidence produced by the model.

Retrieved/context evidence remains future scope and must not be implied as implemented in Milestone 14.

## UI Behavior

The user must explicitly click `Generate AI Stage Report`.

The UI should show:

- Disabled reasons before eligibility.
- Token Budget estimate and warnings before submission.
- Payload limitations before submission.
- Loading state while the backend request is running.
- AI-generated report label after success.
- Error state for provider, network, blocked, missing payload, missing redaction, or validation errors.
- Invalid structured output as an error, not as a partial report.

Existing local Stage Report preview should remain available or be clearly replaced and labeled so the user can tell whether they are viewing a local preview or an AI-generated report.

Markdown export should export the current visible report with the correct local or AI label.

## Out of Scope

Milestone 14 does not include:

- RAG implementation.
- Retrieval.
- Tree-sitter.
- Vector search.
- Stage History persistence.
- SQLite.
- Secure credential storage or keychain.
- Provider/model settings UI beyond current readiness behavior.
- Streaming.
- Retry logic beyond a simple error.
- Multi-provider support.
- GitHub PR integration.
- Auto-fixing.
- Cloud sync.
- Collaboration.
- Full repo upload.

## Definition of Done

- Milestone is clearly marked as post-MVP and not required for the MVP cut.
- Milestone clearly documents how future real AI generation should work.
- Safety Gate enforcement is documented.
- Redacted-payload-only rule is documented.
- Structured output requirement is documented.
- Validation and error behavior is documented.
- Deterministic evidence and AI judgment separation is documented.
- RAG remains documented as future, not implemented in this milestone.
- Stage History remains future.

## Manual Test Plan

- No provider env var: generate action disabled.
- Provider env var set: generate action can become eligible.
- No repo selected: generate action disabled.
- Valid repo selected with payload: eligibility updates.
- Safety Gate blocked: generate action disabled.
- Safety Gate pass or warning: generate action eligible if provider and payload are ready.
- Click `Generate AI Stage Report`.
- Loading state appears.
- Backend sends only redacted payload.
- AI report renders as `ai_generated`.
- Invalid structured response shows an error.
- Network or provider error shows an error.
- Existing local Stage Report preview remains available or clearly replaced and labeled.
- Markdown export includes the current visible report with correct local or AI label.
- No Stage History persistence occurs.

## Notes

Milestone 14 would cross the first real AI boundary after the MVP, but it should stay narrow.

The product remains local-first. The AI receives only the explicit, approved, redacted evidence package. Local deterministic evidence remains the source of truth for what was observed; the model provides structured judgment over that evidence.
