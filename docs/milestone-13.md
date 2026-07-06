# Milestone 13: Provider/API Setup and Approval Flow

Status: Planned.

## Goal

Prepare Staged for future AI Stage Report generation by defining provider readiness, user approval, Safety Gate enforcement, and redacted payload submission rules, without calling an AI provider yet.

Milestone 13 is a submission-boundary milestone. It does not implement real AI review. It defines the conditions that must be visible and satisfied before a future `Generate AI Stage Report` action can submit anything outside the app.

## Purpose

Before Staged sends anything to an LLM, the app must make the submission boundary explicit.

The user should be able to see:

- What evidence is eligible for future submission.
- Whether Safety Gate allows submission.
- Whether a provider is configured.
- What redacted payload the future AI review action would use.
- What Token Budget warnings or payload limitations remain before approval.
- That deterministic local evidence is separate from future AI judgment.

Milestone 13 keeps Staged local-first while preparing the product for a deliberate, user-approved AI generation step in a later milestone.

## Product Context

Staged is a Tauri v2, React, TypeScript, Vite, and Tailwind desktop app.

The local verification spine is implemented. Markdown Export is implemented. Milestone 12 UI polish and the 12F visual redesign are complete. README screenshots are added.

RAG architecture is documented in `docs/rag-architecture.md`, but RAG is not implemented. Real AI Stage Report generation is not implemented. Stage History persistence is not implemented.

## In Scope

Milestone 13 defines:

- Provider readiness behavior.
- API key and config handling approach for the MVP.
- Explicit user approval flow.
- Disabled states for future AI generation.
- Safety Gate blocking behavior.
- Redacted-payload-only submission rule.
- Token Budget warning behavior before future submission.
- Error and loading states for later implementation.
- How Staging Ground should communicate readiness.
- How deterministic evidence remains separate from future AI judgment.

## Provider Config Approach

MVP development should use environment-variable based provider readiness.

Rules:

- Do not persist API keys yet.
- Do not store secrets in the repository.
- Do not store API keys in SQLite yet.
- Do not add keychain or credential storage yet.
- Treat provider configuration as a readiness signal, not as proof that AI generation exists.
- Verify official provider API documentation before implementing any real network call.

Production-grade credential storage is deferred to a later security milestone.

## Approval Flow

Future AI Stage Report generation must require an explicit user action.

Rules:

- No automatic AI submission.
- The user must explicitly click a future `Generate AI Stage Report` action.
- The action must clearly indicate when no AI review has happened yet.
- The action must use the redacted payload, not the original Stage Payload.
- Token Budget warnings must remain visible before approval.
- Payload limitations must remain visible before approval.
- Deterministic local evidence must remain labeled separately from future AI judgment.

The future approval action should be unavailable until all required readiness conditions are satisfied.

## Disabled States

The future `Generate AI Stage Report` action must be disabled when:

- No repository is selected.
- No Stage Payload exists.
- Safety Gate status is `blocked`.
- No provider configuration is detected.
- No redacted payload is available.

The UI should show clear reasons for the disabled state instead of leaving the user to infer what is missing.

Safety Gate `pass` or `warning` can allow the future action to become eligible only when the other readiness checks pass. Warning states must remain visible before approval.

## Safety Gate Rules

Safety Gate is the submission gate for future AI review.

Rules:

- Safety Gate `blocked` prevents future submission.
- Blocked state must be visible in Staging Ground and the future AI action area.
- The future action must not allow submission of the original, unredacted Stage Payload.
- The future action must use the redacted payload preview as the submission source.
- Redaction preview must not mutate the original Stage Payload.

This milestone does not add a network path, so the enforcement is specified for later implementation rather than executed today.

## Token Budget Rules

Token Budget is a pre-approval warning surface.

Rules:

- Token Budget warnings must remain visible before future approval.
- Large payload warnings should not be hidden by provider readiness.
- Missing or limited evidence warnings should remain visible.
- Token estimates are still local estimates, not provider pricing guarantees.
- Future implementation may add model-aware budgets, but Milestone 13 does not.

## Error and Loading States

Later implementation should account for these states:

- Provider readiness unknown.
- Provider not configured.
- Provider configured but not verified by a real call.
- Redacted payload unavailable.
- Safety Gate blocked.
- Token Budget warning present.
- Future submission pending.
- Future submission failed.
- Future AI response unavailable or invalid.

Milestone 13 documents these states only. It does not implement network requests, retries, streaming, or response validation.

## Staging Ground Readiness

Staging Ground should communicate the future AI submission boundary by showing:

- Stage Payload availability.
- Redacted payload availability.
- Safety Gate status.
- Provider readiness status.
- Token Budget estimate and warnings.
- Payload limitations.
- Whether the future AI action is eligible.
- Reasons the future AI action is disabled.

The Staging Ground should continue to make clear that no AI review has happened until a future approved generation path exists and succeeds.

## Deterministic Evidence Boundary

Deterministic evidence remains separate from future AI judgment.

Local evidence includes repository metadata, changed files, selected diff evidence, command results, Pre-Stage Screening findings, Stage Payload metadata, Token Budget estimates, Safety Gate findings, and redaction preview.

Future AI judgment should be rendered as AI-generated Stage Report content only after explicit approval and successful provider response. It should not overwrite or relabel deterministic evidence as model judgment.

## Out of Scope

The following are not part of Milestone 13:

- Real AI or LLM call.
- OpenAI Responses API implementation.
- Provider SDK or client code.
- Network requests.
- Prompt construction.
- Structured output validation.
- Streaming.
- Retry logic.
- Stage History persistence.
- SQLite.
- RAG implementation.
- Retrieval.
- Tree-sitter.
- Vector search.
- Auto-fixing.
- GitHub PR integration.
- Cloud sync.
- Collaboration.

## Later Implementation Target

A later code milestone can add:

- Provider readiness panel or section in Staging Ground.
- Future AI action area.
- Disabled `Generate AI Stage Report` button.
- Clear reasons for disabled state.
- Safety Gate blocked state that prevents future submission.
- Provider not configured state that prevents future submission.
- Redacted payload availability status.
- No network call yet.
- No API key persistence yet.

## Manual Test Plan for Later Implementation

- No repo selected: future AI action unavailable.
- Valid repo selected: readiness checks appear.
- Safety Gate pass or warning: future AI action can become eligible if provider is configured.
- Safety Gate blocked: future AI action disabled.
- No provider config: future AI action disabled.
- Token Budget warning: warning remains visible before approval.
- Redacted payload preview remains visible.
- No network request occurs.
- No AI report is generated.

## Definition of Done

- Provider/API readiness rules are documented.
- Approval flow is documented.
- Safety Gate submission blocking is documented.
- Redacted-payload-only rule is documented.
- Token Budget warning behavior is documented.
- Future implementation scope is clear.
- No AI call is implemented.

## Notes

Milestone 13 prepares the product boundary for real AI generation, but it does not cross that boundary.

Staged should continue to avoid sending whole repositories to an LLM by default. Future AI generation should operate on a compact, explicit, approved, redacted payload.