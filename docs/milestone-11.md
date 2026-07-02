# Milestone 11: Markdown Export

Status: Planned.

## Goal

Allow the user to export the current local Stage Report as a readable Markdown audit note, without adding AI, persistence, or cloud behavior.

Milestone 11 makes Staged useful before real AI integration. A developer should be able to generate a deterministic local verification report, copy it as Markdown, and keep it with their own commit notes or review workflow.

The export is local only. It is not AI-generated, not persisted by Staged, not synced, and not submitted anywhere.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestones 0 through 10A are complete and cover project setup, local repository inspection, changed files, read-only diffs, allowlisted command execution, deterministic Pre-Stage Screening, Stage Payload preview, Token Budget estimates, Staging Ground readiness, Safety Gate and redaction preview, and a local read-only Stage Report preview.

Milestone 10B, real LLM Stage Report generation, is not implemented yet. RAG is documented in `docs/rag-architecture.md`, but RAG is not implemented.

Milestone 11 exports the existing local Stage Report. It does not create a new evidence source and does not change the AI boundary.

## Planned Scope

Frontend:

- Frontend Markdown formatter conceptually named `formatStageReportMarkdown`.
- Export controls in the Stage Report panel or a small adjacent export panel.
- Copy-to-clipboard support using browser clipboard APIs when available.
- Clear local-preview and not-AI-generated wording in the exported Markdown.
- Local-only behavior.

Markdown content:

- Report metadata.
- Repository summary.
- Deterministic evidence summary.
- Safety Gate status.
- Token Budget summary.
- Risk findings.
- Missing evidence.
- Human review checklist.
- Recommendation.
- Clear statement that the report is a local preview and is not AI-generated.

Optional:

- Save-to-file only if it can be done without new dependencies, backend work, persistence, or Tauri capability changes.

## Out of Scope

The following are not part of Milestone 11:

- AI review.
- LLM calls.
- OpenAI API integration.
- Provider or model selection.
- Prompt construction.
- API key storage.
- Stage History persistence.
- SQLite.
- Cloud sync.
- Collaboration.
- GitHub PR comments.
- Auto-fixing.
- PDF export.
- DOCX export.
- RAG implementation.
- Retrieval.
- Tree-sitter.
- Vector search.
- Backend export logic unless strictly necessary.
- New dependencies.
- Tauri capability changes.

## Technical Summary

Milestone 11 should use the existing `StageReport` object and format it into Markdown on the frontend.

Conceptual flow:

```text
StageReport
  ->
formatStageReportMarkdown
  ->
Markdown string
  ->
Copy to clipboard
```

The formatter should preserve the same evidence boundary as the Stage Report preview:

- Deterministic local evidence remains separate from future AI judgment.
- Safety Gate `blocked` status remains visible and should preserve the `do_not_submit` recommendation.
- Missing evidence and payload limitations remain visible.
- The exported note must not claim that an AI review has happened.
- The exported note must not claim that the code is safe to commit.

Clipboard behavior should use browser clipboard APIs when available. The milestone should not add backend persistence, file storage, API calls, prompt construction, model configuration, or provider setup.

## UI Behavior

The Stage Report export controls should appear only when a local Stage Report preview exists.

The UI should allow the user to copy the Markdown version of the current report. It should make clear that:

- The Markdown is generated locally.
- The Markdown is based on deterministic local evidence.
- The Markdown is not AI-generated.
- Copying the Markdown does not send data anywhere.

The export surface should not add report editing, Stage History, saved reports, provider selection, model selection, prompt controls, GitHub PR comments, PDF export, DOCX export, or cloud behavior.

## Manual Test Plan

### Valid repository

1. Select a valid Git repository.
2. Confirm the Stage Report preview exists.
3. Confirm Markdown export controls appear.
4. Confirm the exported Markdown includes report metadata and repository summary.

### Report sections

1. Copy the Markdown.
2. Paste it into a text editor.
3. Confirm the Markdown includes deterministic evidence, Safety Gate status, Token Budget summary, risk findings, missing evidence, human review checklist, and recommendation.
4. Confirm local-preview and not-AI-generated wording appears.

### Safety Gate blocked state

1. Trigger Safety Gate blocked status with a fake API key such as `API_KEY=fake_test_key_123`.
2. Confirm the exported Markdown reflects the blocked Safety Gate state.
3. Confirm the exported recommendation is `do_not_submit`.
4. Remove the fake secret before committing any real project changes.

### Feature boundary

1. Confirm no AI call has been added.
2. Confirm no LLM call has been added.
3. Confirm no prompt construction has been added.
4. Confirm no provider or model selection has been added.
5. Confirm no API key storage has been added.
6. Confirm no Stage History or persistence has been added.
7. Confirm no cloud sync, GitHub PR comment export, RAG, retrieval, PDF export, or DOCX export has been added.
8. Confirm no new dependencies or Tauri capability changes have been added.

## Definition of Done

- Markdown formatter exists.
- Stage Report can be copied as Markdown.
- Export is local only.
- Export uses the existing `StageReport` object.
- Export includes report metadata.
- Export includes repository summary.
- Export includes deterministic evidence and recommendation.
- Export includes Safety Gate status.
- Export includes Token Budget summary.
- Export includes risk findings and missing evidence.
- Export includes a human review checklist.
- Export clearly states the report is a local preview.
- Export clearly states the report is not AI-generated.
- Safety Gate `blocked` status is reflected as `do_not_submit`.
- No AI, LLM call, prompt construction, provider selection, model selection, API key storage, persistence, cloud behavior, GitHub PR comment export, RAG, retrieval, PDF export, DOCX export, dependency, or Tauri capability change is added.

## Notes

Milestone 11 is an export milestone, not an AI milestone.

Markdown copy/export gives developers a portable audit note from the local report preview while keeping Staged's privacy and evidence boundaries intact. Saved scan records, Stage History, Markdown/PDF export options, and GitHub PR comment export remain later expansion paths.
