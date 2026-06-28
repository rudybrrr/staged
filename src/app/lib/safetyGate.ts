import type { StagePayload } from "./stagePayload";

export type SafetyGateResult = {
  status: "pass" | "warning" | "blocked";
  scanned_at: string;
  scanner: "mvp_pattern_scanner";
  scan_coverage: {
    stage_payload_json_scanned: boolean;
    selected_file_diff_included: boolean;
    selected_file_diff_scanned: boolean;
    selected_file_path: string | null;
    selected_file_diff_secret_findings_count: number;
  };
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

const SCANNER_LIMITATIONS = [
  "MVP pattern scanner only; it can miss secrets and produce false positives.",
  "Only the current Stage Payload is scanned.",
  "Files outside the Stage Payload are not scanned.",
  "Redaction preview does not mutate the original payload.",
];

const SECRET_FIELD_PATTERN =
  /("(?:[^"\\]|\\.)*(?:api_key|apikey|token|secret|password|passwd|private_key|access_key)(?:[^"\\]|\\.)*"\s*:\s*)("(?:(?:\\.)|[^"\\])*"|[^\s,}\]]+)/gi;
const ASSIGNMENT_PATTERN =
  /(^|[\s+\-"]|\\r\\n|\\n)(API_KEY|TOKEN|PASSWORD|SECRET|PRIVATE_KEY|ACCESS_KEY)\s*=\s*([^\\\s"',;}]+)(?=\\r\\n|\\n|\r?\n|"|\s|$|[,;}])/gim;
const PRIVATE_KEY_PATTERN =
  /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/g;
const LOCAL_PATH_PATTERN = /C:(?:\/Users\/|\\\\Users\\\\)/g;

function countMatches(value: string, pattern: RegExp) {
  return [...value.matchAll(pattern)].length;
}

export function buildSafetyGateResult(payload: StagePayload): SafetyGateResult {
  const serializedPayload = JSON.stringify(payload, null, 2);
  const selectedFileDiff = payload.changes.selected_file_diff?.diff ?? "";
  const selectedFileDiffScanned = selectedFileDiff.length > 0;
  let redactedPayloadPreview = serializedPayload;

  const secretFieldMatches = countMatches(serializedPayload, SECRET_FIELD_PATTERN);
  const assignmentMatches = countMatches(serializedPayload, ASSIGNMENT_PATTERN);
  const privateKeyMatches = countMatches(serializedPayload, PRIVATE_KEY_PATTERN);
  const localPathMatches = countMatches(serializedPayload, LOCAL_PATH_PATTERN);
  const selectedFileDiffAssignmentMatches = selectedFileDiffScanned
    ? countMatches(selectedFileDiff, ASSIGNMENT_PATTERN)
    : 0;
  const selectedFileDiffPrivateKeyMatches = selectedFileDiffScanned
    ? countMatches(selectedFileDiff, PRIVATE_KEY_PATTERN)
    : 0;
  const selectedFileDiffSecretMatches =
    selectedFileDiffAssignmentMatches + selectedFileDiffPrivateKeyMatches;

  redactedPayloadPreview = redactedPayloadPreview.replace(
    SECRET_FIELD_PATTERN,
    '$1"[REDACTED]"',
  );
  redactedPayloadPreview = redactedPayloadPreview.replace(
    ASSIGNMENT_PATTERN,
    "$1$2=[REDACTED]",
  );
  redactedPayloadPreview = redactedPayloadPreview.replace(
    PRIVATE_KEY_PATTERN,
    "[REDACTED]",
  );
  redactedPayloadPreview = redactedPayloadPreview.replace(
    LOCAL_PATH_PATTERN,
    "[LOCAL_PATH]",
  );

  const redactionCount =
    secretFieldMatches +
    assignmentMatches +
    privateKeyMatches +
    localPathMatches;
  const findings: SafetyGateResult["findings"] = [];

  if (secretFieldMatches > 0) {
    findings.push({
      id: "likely-secret-fields",
      level: "blocked",
      category: "secret",
      title: "Likely secret field detected",
      detail:
        "The serialized Stage Payload contains secret-like JSON field names or values.",
      match_count: secretFieldMatches,
    });
  }

  if (assignmentMatches > 0) {
    findings.push({
      id: "likely-secret-assignments",
      level: "blocked",
      category: "secret",
      title: "Likely secret assignment detected",
      detail: "Detected likely secret assignment in the serialized Stage Payload JSON.",
      match_count: assignmentMatches,
    });
  }

  if (selectedFileDiffSecretMatches > 0) {
    findings.push({
      id: "selected-file-diff-secret",
      level: "blocked",
      category: "secret",
      title: "Likely secret in selected file diff",
      detail:
        "The currently selected file diff contains a likely secret assignment.",
      match_count: selectedFileDiffSecretMatches,
    });
  }

  if (privateKeyMatches > 0) {
    findings.push({
      id: "private-key-marker",
      level: "blocked",
      category: "secret",
      title: "Private key marker detected",
      detail: "The serialized Stage Payload contains a private key header.",
      match_count: privateKeyMatches,
    });
  }

  if (localPathMatches > 0) {
    findings.push({
      id: "local-machine-path",
      level: "warning",
      category: "local_path",
      title: "Local machine path exposure",
      detail:
        "The serialized Stage Payload contains a local Windows user path pattern.",
      match_count: localPathMatches,
    });
  }

  findings.push({
    id: "mvp-scanner-limitations",
    level: "info",
    category: "scanner_limit",
    title: "MVP scanner limitations",
    detail:
      "This is a simple pattern scanner, not a complete security scanner.",
    match_count: 0,
  });

  const hasBlockedFindings = findings.some(
    (finding) => finding.level === "blocked",
  );
  const hasLocalPathFinding = localPathMatches > 0;

  return {
    status: hasBlockedFindings
      ? "blocked"
      : hasLocalPathFinding
        ? "warning"
        : "pass",
    scanned_at: new Date().toISOString(),
    scanner: "mvp_pattern_scanner",
    scan_coverage: {
      stage_payload_json_scanned: true,
      selected_file_diff_included:
        payload.payload_completeness.includes_selected_file_diff,
      selected_file_diff_scanned: selectedFileDiffScanned,
      selected_file_path: payload.changes.selected_file_diff?.file_path ?? null,
      selected_file_diff_secret_findings_count: selectedFileDiffSecretMatches,
    },
    findings,
    redacted_payload_preview: redactedPayloadPreview,
    redaction_count: redactionCount,
    limitations: SCANNER_LIMITATIONS,
  };
}