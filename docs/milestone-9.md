# Milestone 9: Safety Gate and Redaction Preview

Status: Implemented.

## Goal

Add a local Safety Gate that scans the current Stage Payload and the currently loaded selected-file diff for obvious sensitive data patterns, then shows local findings and a redacted preview before any future AI review is possible.

Milestone 9 makes Staged's privacy-first workflow concrete. Before any AI integration, the app shows whether currently collected payload evidence contains likely secrets or sensitive local information, what would be redacted, and whether the current payload is blocked, warning, or passing.

This milestone is intentionally narrow. It is a frontend-only MVP pattern scanner. It does not send data anywhere, does not mutate the original Stage Payload, and does not add AI review, Stage Report generation, submit behavior, persistence, backend scanning, or full-repo scanning.

## Product Context

Staged is a local-first verification workbench for auditing code changes before commit.

Milestones 1 through 8 are complete and cover repository inspection, changed files, diff viewing, allowlisted command execution, deterministic Pre-Stage Screening, Stage Payload preview, Token Budget estimates, and the local Staging Ground.

Milestone 9 adds the first implemented privacy checkpoint before any future AI submission path can be considered.

## Implemented Scope

Frontend:

- Frontend `SafetyGateResult` type.
- Frontend `buildSafetyGateResult` utility.
- Frontend Safety Gate panel.
- Local deterministic pattern matching.
- Findings with `pass`, `warning`, and `blocked` Safety Gate statuses.
- Redacted payload preview.
- Scan coverage summary.
- Scanner limitations shown in the UI.
- Safety Gate status integrated into Staging Ground readiness.

Scanning behavior:

- Scans the serialized Stage Payload JSON.
- Scans the currently loaded selected-file diff directly.
- Produces local findings only.
- Produces a redacted preview with matched sensitive values replaced by `[REDACTED]`.
- Leaves the original Stage Payload unchanged.
- Sends no data anywhere.

Detection:

- Likely secret assignments such as `API_KEY=...`, `TOKEN=...`, `PASSWORD=...`, `SECRET=...`, `PRIVATE_KEY=...`, and `ACCESS_KEY=...`.
- Private key markers.
- Local machine path exposure.

Status behavior:

- `pass` when no likely sensitive patterns are found.
- `warning` when local paths or scanner limitations are present without obvious secrets.
- `blocked` when likely secrets, private keys, or passwords are found.

## Current Boundaries

The Safety Gate is still an MVP pattern scanner. It can miss secrets, flag harmless strings, and does not prove that a payload is safe.

The following are not implemented yet:

- Backend scanning.
- Full-repo scanning.
- Bounded scanning of all changed files.
- AI review.
- OpenAI API integration.
- Stage Report generation.
- Submit behavior.
- Provider or model selection.
- Exact secret scanning engine.
- Entropy-based detection.
- Persistent redaction rules.
- User-editable redaction rules.
- SQLite.
- Stage History.
- RAG.
- Tree-sitter.
- Vector search.
- GitHub PR integration.
- Auto-fixing.
- Safety Gate enforcement for a real submission path.
- New dependencies.

## Technical Summary

Milestone 9 remains frontend-only. It uses the current Stage Payload and the currently loaded selected-file diff as inputs. It adds no backend logic, persistence, network calls, API calls, submit behavior, or AI behavior.

Implemented result shape:

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

Builder behavior:

- Accept the current Stage Payload and selected-file diff state.
- Serialize the Stage Payload JSON consistently.
- Apply deterministic pattern matching to the serialized payload.
- Apply direct pattern matching to the currently loaded selected-file diff.
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
- Findings.
- Redaction count.
- Scan coverage summary.
- Redacted payload preview.
- Scanner limitations.
- Warning that this is an MVP pattern scanner, not a complete security scanner.

The panel remains read-only. It does not add payload editing, persistent redaction rules, user-editable redaction rules, provider selection, model selection, report generation, submit behavior, or persistence controls.

Stale Safety Gate state clears when no valid repository or no valid payload exists, including when selecting a non-Git folder or switching away from a valid repository.

The Staging Ground reflects Safety Gate status while still keeping AI review unavailable. There is no actual submission path or backend enforcement yet.

## Architecture

```text
StagePayload + currently loaded selected-file diff
  ->
buildSafetyGateResult
  ->
SafetyGateResult
  ->
SafetyGatePanel + Staging Ground readiness signal
  ->
Local findings and redaction preview
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

1. Add `API_KEY=fake_test_key_123` to a changed file.
2. Load the changed file diff by selecting that file in the changed-files list.
3. Confirm Safety Gate becomes `blocked`.
4. Confirm the redacted preview contains `[REDACTED]`.
5. Confirm the original Stage Payload preview remains unchanged.
6. Remove the fake secret before committing any real project changes.

### Staging Ground

1. Confirm Staging Ground reflects the current Safety Gate status.
2. Confirm AI review remains unavailable.
3. Confirm no submit behavior is available.

### Invalid repository

1. Select a non-Git folder.
2. Confirm stale Safety Gate state clears.

### Feature boundary

1. Confirm no OpenAI API integration has been added.
2. Confirm no LLM call has been added.
3. Confirm no Stage Report has been added.
4. Confirm no submit behavior has been added.
5. Confirm no backend Safety Gate logic has been added.
6. Confirm no full-repo scanning has been added.
7. Confirm no persistence has been added.
8. Confirm no new dependencies have been added.

## Definition of Done

- Milestone 9 is implemented.
- Frontend `SafetyGateResult` type exists.
- Frontend `buildSafetyGateResult` utility exists.
- Frontend Safety Gate panel exists.
- Safety Gate scans serialized Stage Payload JSON.
- Safety Gate scans the currently loaded selected-file diff directly.
- Safety Gate status uses `pass`, `warning`, and `blocked`.
- Likely secrets produce blocked findings.
- Local path exposure can produce warning findings.
- Redacted preview replaces matched sensitive values with `[REDACTED]`.
- Redacted preview does not mutate the original Stage Payload.
- Scanner limitations are clearly stated.
- Redaction is local preview only.
- Safety Gate status is integrated into Staging Ground.
- AI review remains unavailable.
- No data is sent anywhere.
- No OpenAI API integration is added.
- No Stage Report is added.
- No submit behavior is added.
- No backend logic is added.
- No full-repo scanning is added.
- No persistence is added.
- No dependencies are added.

## Notes

Milestone 9 is a privacy checkpoint, not a full security scanner. Its purpose is to make obvious payload risk visible before Staged adds any AI review path.

The MVP Safety Gate is intentionally not a full-repo scanner. Bounded changed-file scanning and optional full-repo local scanning are later Safety Gate expansions, not AI features.

RAG and retrieval are later context-selection features for AI review and should not be confused with secret scanning. Whole repositories should not be sent to an LLM by default.

The MVP scanner will miss some sensitive data and may flag harmless strings. That tradeoff is acceptable for this milestone because the goal is to establish a local Safety Gate and redaction preview boundary before adding stronger scanning, backend enforcement, user approval, or payload submission.
