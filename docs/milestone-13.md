# Milestone 13: Provider/API Setup and Approval Flow

Status: Implemented.

## Goal

Prepare Staged for future AI Stage Report generation by implementing provider readiness visibility, future user approval messaging, Safety Gate submission blocking state, and redacted payload submission rules, without calling an AI provider yet.

Milestone 13 is a submission-boundary milestone. It does not implement real AI review. It makes the conditions visible before a future `Generate AI Stage Report` action can submit anything outside the app.

## Purpose

Before Staged sends anything to an LLM, the app must make the submission boundary explicit.

The user can see:

- What evidence is eligible for future submission.
- Whether Safety Gate allows submission.
- Whether a provider is configured.
- What redacted payload the future AI review action would use.
- What Token Budget warnings or payload limitations remain before approval.
- That deterministic local evidence is separate from future AI judgment.

Milestone 13 keeps Staged local-first while preparing the product for a deliberate, user-approved AI generation step in a later milestone.

## Product Context

Staged is a Tauri v2, React, TypeScript, Vite, and Tailwind desktop app.

The local verification spine is implemented. Markdown Export is implemented. Milestone 12 UI polish and the 12F visual redesign are complete. README screenshots are added. Milestone 13 Provider/API Setup and Approval Flow is implemented.

RAG architecture is documented in `docs/rag-architecture.md`, but RAG is not implemented. Real AI Stage Report generation is not implemented. Stage History persistence is not implemented.

## In Scope

Milestone 13 implements:

- Provider readiness behavior.
- API key and config handling boundaries for the MVP.
- Future user approval UI messaging.
- Disabled states for future AI generation.
- Safety Gate blocking behavior.
- Redacted-payload-only submission rule.
- Token Budget warning behavior before future submission.
- How Staging Ground communicates readiness.
- How deterministic evidence remains separate from future AI judgment.

## Provider Config Approach

MVP development uses environment-variable based provider readiness.

Rules:

- Detect `STAGED_OPENAI_API_KEY`.
- Detect `OPENAI_API_KEY` as a fallback when available.
- Return only readiness metadata: configured boolean, provider name, environment variable source, and message.
- Do not return API key values.
- Do not display API key values.
- Do not log API key values.
- Do not persist API keys yet.
- Do not store secrets in the repository.
- Do not store API keys in SQLite yet.
- Do not add keychain or credential storage yet.
- Treat provider configuration as a readiness signal, not as proof that AI generation exists.
- Do not validate provider keys over the network.
- Verify official provider API documentation before implementing any real network call.

Production-grade credential storage is deferred to a later security milestone.

## Approval Flow

Future AI Stage Report generation must require an explicit user action. Milestone 13 shows the future approval boundary but keeps the action disabled because real generation is not implemented yet.

Rules:

- No automatic AI submission.
- The user must explicitly click a future `Generate AI Stage Report` action once that action is implemented.
- The action must clearly indicate when no AI review has happened yet.
- The action must use the redacted payload, not the original Stage Payload.
- Token Budget warnings must remain visible before approval.
- Payload limitations must remain visible before approval.
- Deterministic local evidence must remain labeled separately from future AI judgment.

The future approval action remains unavailable in this milestone. Provider readiness can be configured, but the action stays disabled until real structured AI Stage Report generation is implemented in a later milestone.

## Disabled States

The future `Generate AI Stage Report` action is disabled. Disabled reasons are visible, including:

- No repository is selected.
- No Stage Payload exists.
- Safety Gate status is `blocked`.
- No provider configuration is detected.
- No redacted payload is available.
- Real AI Stage Report generation is not implemented yet.

The UI shows clear reasons for the disabled state instead of leaving the user to infer what is missing.

Safety Gate `pass` or `warning` can allow a future implementation to become eligible only when the other readiness checks pass and real generation exists. Warning states must remain visible before approval.

## Safety Gate Rules

Safety Gate is the submission gate for future AI review.

Rules:

- Safety Gate `blocked` prevents future submission.
- Blocked state must be visible in Staging Ground and the future AI action area.
- The future action must not allow submission of the original, unredacted Stage Payload.
- The future action must use the redacted payload preview as the submission source.
- Redaction preview must not mutate the original Stage Payload.

This milestone does not add a network path. The blocked state prevents future submission eligibility in the UI; actual network-path enforcement belongs to the later real-generation implementation.

## Token Budget Rules

Token Budget is a pre-approval warning surface.

Rules:

- Token Budget warnings must remain visible before future approval.
- Large payload warnings should not be hidden by provider readiness.
- Missing or limited evidence warnings should remain visible.
- Token estimates are still local estimates, not provider pricing guarantees.
- Future implementation may add model-aware budgets, but Milestone 13 does not.

## Error and Loading States

Milestone 13 accounts for local readiness and disabled states. Later real-generation implementation should add request lifecycle states for:

- Provider readiness unknown.
- Provider not configured.
- Provider configured but not verified by a real call.
- Redacted payload unavailable.
- Safety Gate blocked.
- Token Budget warning present.
- Future submission pending.
- Future submission failed.
- Future AI response unavailable or invalid.

Milestone 13 does not implement network requests, retries, streaming, or response validation.

## Staging Ground Readiness

Staging Ground communicates the future AI submission boundary by showing:

- Stage Payload availability.
- Redacted payload availability.
- Safety Gate status.
- Provider readiness status.
- Token Budget estimate and warnings.
- Payload limitations.
- Whether the future AI action is eligible.
- Reasons the future AI action is disabled.

The Staging Ground continues to make clear that no AI review has happened because the approved generation path does not exist yet.

## Deterministic Evidence Boundary

Deterministic evidence remains separate from future AI judgment.

Local evidence includes repository metadata, changed files, selected diff evidence, command results, Pre-Stage Screening findings, Stage Payload metadata, Token Budget estimates, Safety Gate findings, provider readiness metadata, and redaction preview.

Future AI judgment should be rendered as AI-generated Stage Report content only after explicit approval and successful provider response. It should not overwrite or relabel deterministic evidence as model judgment.

## Implemented Behavior

- Backend provider readiness command checks local environment readiness.
- `STAGED_OPENAI_API_KEY` is detected as the primary readiness signal.
- `OPENAI_API_KEY` is detected as a fallback when available.
- Only readiness metadata is returned: configured boolean, provider name, environment variable source, and message.
- API key values are not returned, displayed, logged, or persisted.
- Provider readiness is local environment detection only.
- Keys are not validated over the network.
- Frontend loads provider readiness.
- Frontend shows Provider Readiness / Future AI Approval UI.
- Future `Generate AI Stage Report` action remains disabled.
- Disabled reasons are visible.
- Safety Gate `blocked` status prevents future submission eligibility.
- Redacted-payload-only rule is communicated.
- No AI call, API request, network request, provider SDK, prompt construction, structured model output, Stage History, or RAG implementation exists.

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

## Next Milestone Target

The next AI milestone should add real structured AI Stage Report generation after explicit user approval.

That later milestone should include:

- A real provider request path.
- Prompt construction from the approved redacted payload.
- Structured model output.
- Response validation.
- Error and retry handling where appropriate.
- Clear separation between deterministic evidence and AI judgment.
- Stage History persistence only when deliberately added.

## Manual Test Plan

- No provider env var: readiness is not configured.
- `STAGED_OPENAI_API_KEY` set before launch: readiness is configured without exposing the key value.
- Future AI action remains disabled.
- Safety Gate blocked disables future submission.
- Existing Stage Payload, Safety Gate, Staging Ground, Stage Report, and Markdown Export still work.
- No network request occurs.
- No AI generation occurs.

## Definition of Done

- Provider/API readiness rules are implemented and documented.
- Approval flow boundary is implemented and documented.
- Safety Gate submission blocking state is implemented and documented.
- Redacted-payload-only rule is communicated.
- Token Budget warning behavior remains visible.
- Future real-generation scope is clear.
- No AI call is implemented.

## Notes

Milestone 13 prepares the product boundary for real AI generation, but it does not cross that boundary.

Staged should continue to avoid sending whole repositories to an LLM by default. Future AI generation should operate on a compact, explicit, approved, redacted payload.