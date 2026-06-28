# Milestone 9: Safety Gate and Redaction Preview

Status: Planned.

## Goal

Add a local Safety Gate that scans the current Stage Payload for obvious sensitive data patterns and shows a redaction preview before any future AI review is possible.

Milestone 9 makes Staged's privacy-first workflow concrete. Before any AI integration, the app should show whether the payload contains likely secrets or sensitive local information, what would be redacted, and whether the payload is safe enough for future submission.

This milestone is intentionally narrow. It is a frontend-only MVP scanner over the current Stage Payload text. It does not send data anywhere, does not mutate the original Stage Payload, and does not add AI review or submit behavior.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestone 0 is complete and covers project setup.

Milestone 1 is complete and supports selecting and inspecting a local Git repository.

Milestone 2 is complete and supports listing changed files.

Milestone 3 is complete and supports displaying read-only file diffs.

Milestone 4 is complete and supports running allowlisted local commands.

Milestone 5 is complete and supports deterministic Pre-Stage Screening findings.

Milestone 6 is complete and supports building and previewing a local Stage Payload with completeness metadata and limitations.

Milestone 7 is complete and supports local Stage Payload size and approximate token estimates with section-level contributions and warnings.

Milestone 8 is complete and adds a local Staging Ground review surface while clearly stating that AI review and redaction are not implemented yet.

Milestone 9 adds the missing privacy checkpoint before any future AI submission path can be considered.

## In Scope

Frontend:

- Frontend-only Safety Gate for MVP.
- Frontend `SafetyGateResult` type.
- Frontend `buildSafetyGateResult` utility.
- Frontend `SafetyGatePanel`.
- Compute from the current `StagePayload` only.
- Use simple deterministic pattern matching.
- Produce redaction findings.
- Produce a redacted payload preview.
- Keep all scanning local.
- Do not send any data anywhere.

Detection:

- API keys.
- Tokens.
- Passwords.
- Private keys.
- `.env` style assignments.
- Common secret-like field names.
- Local machine path exposure when practical.

Safety Gate status:

- `pass` when no likely sensitive patterns are found.
- `warning` when local paths or scanner limitations are present without obvious secrets.
- `blocked` when likely secrets, private keys, or passwords are found.

User-facing behavior:

- Show clear warnings when likely secrets are found.
- Show clear warning that this is a simple MVP scanner, not a complete security scanner.
- Show a redacted payload preview with matched sensitive values replaced by `[REDACTED]`.
- Keep the original Stage Payload preview unchanged.
- Integrate Safety Gate status into Staging Ground readiness.

## Out of Scope

The following are not part of Milestone 9:

- AI review.
- OpenAI API integration.
- Stage Report generation.
- Actual submit behavior.
- Provider or model selection.
- Exact secret scanning engine.
- Entropy-based detection unless trivial.
- Full file-system scanning.
- Scanning files outside the current Stage Payload.
- Persistent redaction rules.
- User-editable redaction rules.
- SQLite.
- Stage History.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.
- Backend Safety Gate enforcement.
- New dependencies.

## Technical Summary

Milestone 9 remains frontend-only and uses the current Stage Payload as its only input. It adds no backend logic, persistence, network calls, API calls, submit behavior, or AI behavior.

Conceptual result shape:

```ts
type SafetyGateResult = {
  status: "pass" | "warning" | "blocked";
  scanned_at: string;
  scanner: "mvp_pattern_scanner";
  findings: Array<{
    id: string;
    level: "info" | "warning" | "blocked";
    category: "secret" | "local_path" | "scanner_limit";
    title: string;
    detail: string;
    match_count: number;
  }>;
  redacted_payload_preview: string;
  redaction_count: number;
  limitations: string[];
};
```

Suggested MVP patterns:

- Field names containing `api_key`, `apikey`, `token`, `secret`, `password`, `passwd`, `private_key`, or `access_key`.
- Assignment-like strings such as `API_KEY=...`, `TOKEN=...`, `PASSWORD=...`, or `SECRET=...`.
- Private key markers such as `-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`, or `-----BEGIN OPENSSH PRIVATE KEY-----`.
- Local Windows path exposure such as `C:/Users/` or `C:\\Users\\`.

Builder behavior:

- Accept the current Stage Payload.
- Serialize or inspect the Stage Payload text consistently.
- Apply deterministic pattern matching.
- Count matches by finding category.
- Produce a redacted preview string.
- Replace matched sensitive values with `[REDACTED]` in the preview only.
- Set status to `blocked` for likely secrets, passwords, or private keys.
- Set status to `warning` for local path exposure or scanner limitations without obvious secrets.
- Set status to `pass` when no likely sensitive patterns are found.
- Do not mutate the original Stage Payload.
- Do not call APIs.
- Do not submit anything.

## UI Behavior

The Safety Gate panel appears when a valid Stage Payload exists.

The panel shows:

- Safety Gate status.
- Scan time.
- Scanner name.
- Local-only notice.
- Findings grouped or listed clearly.
- Redaction count.
- Redacted payload preview.
- Scanner limitations.
- Warning that this is an MVP pattern scanner, not a complete security scanner.

The panel remains read-only. It does not add payload editing, persistent redaction rules, user-editable redaction rules, provider selection, model selection, report generation, submit behavior, or persistence controls.

Stale Safety Gate state clears when no valid repository or no valid payload exists, including when selecting a non-Git folder or switching away from a valid repository.

The Staging Ground should treat a blocked Safety Gate status as a blocker once integrated.

## Architecture

```text
StagePayload
  ->
buildSafetyGateResult
  ->
SafetyGateResult
  ->
SafetyGatePanel
  ->
Local redaction preview and readiness signal
```

Milestone 9 remains a frontend privacy checkpoint. Existing backend commands remain focused on repository inspection, changed files, diffs, and command execution.

## Manual Test Plan

### Valid repository

1. Select a valid Git repository.
2. Confirm Safety Gate appears when a Stage Payload exists.
3. Confirm the panel says scanning is local.
4. Confirm no API call, AI review, Stage Report, or submit behavior is added.

### Local path exposure

1. Use a payload that contains `C:/Users/` or `C:\\Users\\`.
2. Confirm local path exposure produces a warning if detected.

### Secret-like value

1. Add a fake secret-like value in a changed file or payload-visible text.
2. Confirm a blocked finding appears.
3. Confirm the redacted preview replaces the sensitive value with `[REDACTED]`.
4. Confirm the original Stage Payload preview remains unchanged.

### Staging Ground

1. Confirm Staging Ground reflects Safety Gate status once implemented.
2. Confirm blocked Safety Gate status is treated as a blocker later.

### Invalid repository

1. Select a non-Git folder.
2. Confirm stale Safety Gate state clears.

### Feature boundary

1. Confirm no OpenAI API integration has been added.
2. Confirm no LLM call has been added.
3. Confirm no Stage Report has been added.
4. Confirm no submit behavior has been added.
5. Confirm no backend Safety Gate logic has been added.
6. Confirm no new dependencies have been added.

## Definition of Done

- Milestone 9 scope is documented.
- Frontend Safety Gate MVP is planned around the current Stage Payload only.
- Frontend `SafetyGateResult` type is defined conceptually.
- Frontend `buildSafetyGateResult` utility is defined conceptually.
- Frontend `SafetyGatePanel` is defined conceptually.
- Safety Gate status uses `pass`, `warning`, and `blocked`.
- Likely secrets produce blocked findings.
- Local path exposure can produce warning findings.
- Redacted preview replaces matched sensitive values with `[REDACTED]`.
- Redacted preview does not mutate the original Stage Payload.
- Scanner limitations are clearly stated.
- Redaction is local preview only.
- Future AI submission remains blocked until Safety Gate exists.
- No AI integration is added.
- No OpenAI API integration is added.
- No Stage Report is added.
- No submit behavior is added.
- No backend logic is added.
- No dependencies are added.

## Notes

Milestone 9 is a privacy checkpoint, not a full security scanner. Its purpose is to make obvious payload risk visible before Staged adds any AI review path.

The MVP scanner will miss some sensitive data and may flag harmless strings. That tradeoff is acceptable for this milestone because the goal is to establish a local Safety Gate and redaction preview boundary before adding stronger scanning, backend enforcement, user approval, or payload submission.