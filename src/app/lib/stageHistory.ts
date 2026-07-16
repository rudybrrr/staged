import { invoke } from "@tauri-apps/api/core";

import type { RepoSummary } from "./repo";
import type { SafetyGateResult } from "./safetyGate";
import type { StagePayload } from "./stagePayload";
import type { StageReport } from "./stageReport";
import type { TokenBudget } from "./tokenBudget";

export type RedactedStagePayloadV1 = Omit<StagePayload, "schema_version"> & {
  schema_version: "stage-payload.v1";
};

export type PersistedSafetyGateResultV1 = {
  status: SafetyGateResult["status"];
  scanned_at: string;
  scanner: SafetyGateResult["scanner"];
  scan_coverage: SafetyGateResult["scan_coverage"];
  findings: SafetyGateResult["findings"];
  redaction_count: number;
  limitations: string[];
};

export type PersistedLocalStageReportV1 = StageReport;

export type StageHistoryArtifactsV1 = {
  schema_version: "stage-history-artifacts.v1";
  redacted_stage_payload: RedactedStagePayloadV1;
  token_budget: TokenBudget;
  pre_stage_screening_findings: RedactedStagePayloadV1["screening_findings"];
  safety_gate_result: PersistedSafetyGateResultV1;
  local_stage_report: PersistedLocalStageReportV1;
  markdown_export: null;
};

export type SaveStageHistoryScanInput = {
  scan_id: string;
  repo_path: string;
  repo_name: string;
  branch: string | null;
  diff_hash: string;
  created_at: string;
  changed_file_count: number;
  selected_file_path: string | null;
  safety_gate_status: SafetyGateResult["status"];
  estimated_tokens: number;
  report_generation_mode: "local_preview";
  report_status: "preview_only";
  recommendation_decision: StageReport["recommendation"]["decision"];
  artifacts: StageHistoryArtifactsV1;
};

export type SaveStageHistoryScanResult = {
  scan_id: string;
  diff_hash: string;
  created_at: string;
};

export type SaveStageHistoryCommandError = {
  code:
    | "invalid_input"
    | "duplicate_scan_id"
    | "storage_unavailable"
    | "save_failed";
  message: string;
};

export type BuildStageHistorySnapshotInput = {
  repo: Pick<
    RepoSummary,
    "repo_path" | "repo_name" | "current_branch" | "is_git_repo"
  >;
  redacted_payload_preview: string;
  token_budget: TokenBudget;
  safety_gate_result: SafetyGateResult;
  local_stage_report: StageReport;
};

export type StageHistorySnapshotRuntime = {
  randomUuid(): string;
  now(): Date;
  sha256Hex(value: string): Promise<string>;
};

export type StageHistorySaveEvidence = {
  has_valid_repo: boolean;
  has_stage_payload: boolean;
  token_budget: TokenBudget | null;
  safety_gate_result: SafetyGateResult | null;
  local_stage_report: StageReport | null;
  is_inspecting_repo: boolean;
  is_loading_changed_files: boolean;
  is_loading_diff: boolean;
  is_loading_commands: boolean;
  is_running_command: boolean;
};

const PROHIBITED_PERSISTENCE_KEYS = new Set([
  "original_stage_payload",
  "unredacted_stage_payload",
  "raw_match",
  "raw_matches",
  "matched_text",
  "matched_value",
  "secret_value",
  "raw_secret_values",
  "api_keys",
  "provider_secret_values",
  "environment_variable_values",
  "provider_readiness",
  "repository_contents",
]);

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return value;
}

function asNullableString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }

  return asString(value, label);
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean.`);
  }

  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return value;
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray(value, label).map((item, index) =>
    asString(item, `${label}[${index}]`),
  );
}

function asOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  const stringValue = asString(value, label);

  if (!allowed.includes(stringValue as T)) {
    throw new Error(`${label} is unsupported.`);
  }

  return stringValue as T;
}

// Defense in depth only: rejecting known-dangerous field names cannot prove
// arbitrary JSON is secret-free. The approved redacted preview remains the
// source of persisted Stage Payload content.
function assertNoProhibitedKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoProhibitedKeys);
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (PROHIBITED_PERSISTENCE_KEYS.has(key)) {
      throw new Error(`Found prohibited persistence field: ${key}.`);
    }

    assertNoProhibitedKeys(nestedValue);
  }
}

function buildChangedFile(value: unknown, label: string) {
  const file = asRecord(value, label);

  return {
    file_path: asString(file.file_path, `${label}.file_path`),
    old_file_path: asNullableString(
      file.old_file_path,
      `${label}.old_file_path`,
    ),
    status: asString(file.status, `${label}.status`),
    is_staged: asBoolean(file.is_staged, `${label}.is_staged`),
    is_unstaged: asBoolean(file.is_unstaged, `${label}.is_unstaged`),
    is_untracked: asBoolean(file.is_untracked, `${label}.is_untracked`),
  };
}

function buildScreeningFinding(value: unknown, label: string) {
  const finding = asRecord(value, label);

  return {
    id: asString(finding.id, `${label}.id`),
    level: asOneOf(
      finding.level,
      ["pass", "info", "warning", "fail"] as const,
      `${label}.level`,
    ),
    title: asString(finding.title, `${label}.title`),
    detail: asString(finding.detail, `${label}.detail`),
    source: asOneOf(
      finding.source,
      ["repo", "changed_files", "command_runner"] as const,
      `${label}.source`,
    ),
  };
}

function parseRedactedStagePayload(
  preview: string,
): RedactedStagePayloadV1 {
  if (preview.trim().length === 0) {
    throw new Error("The redacted Stage Payload preview is empty.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(preview);
  } catch {
    throw new Error("The redacted Stage Payload preview is not valid JSON.");
  }

  const payload = asRecord(parsed, "The redacted Stage Payload preview");
  if (payload.schema_version !== "stage-payload.v1") {
    throw new Error("The redacted Stage Payload preview schema is unsupported.");
  }

  assertNoProhibitedKeys(payload);

  const repo = asRecord(payload.repo, "redacted payload repo");
  const changes = asRecord(payload.changes, "redacted payload changes");
  const statusCountsValue = asRecord(
    changes.status_counts,
    "redacted payload status counts",
  );
  const statusCounts: Record<string, number> = {};
  for (const [status, count] of Object.entries(statusCountsValue)) {
    statusCounts[status] = asNumber(
      count,
      `redacted payload status_counts.${status}`,
    );
  }

  const selectedFileValue = changes.selected_file;
  const selectedFile =
    selectedFileValue === null
      ? null
      : buildChangedFile(selectedFileValue, "redacted payload selected_file");
  const selectedDiffValue = changes.selected_file_diff;
  const selectedFileDiff =
    selectedDiffValue === null
      ? null
      : (() => {
          const selectedDiff = asRecord(
            selectedDiffValue,
            "redacted payload selected_file_diff",
          );
          return {
            file_path: asString(
              selectedDiff.file_path,
              "redacted payload selected_file_diff.file_path",
            ),
            diff: asString(
              selectedDiff.diff,
              "redacted payload selected_file_diff.diff",
            ),
          };
        })();

  const commandResultValue = payload.command_result;
  const commandResult =
    commandResultValue === null
      ? null
      : (() => {
          const result = asRecord(
            commandResultValue,
            "redacted payload command_result",
          );
          return {
            command_id: asString(
              result.command_id,
              "redacted payload command_result.command_id",
            ),
            command: asString(
              result.command,
              "redacted payload command_result.command",
            ),
            exit_code:
              result.exit_code === null
                ? null
                : asNumber(
                    result.exit_code,
                    "redacted payload command_result.exit_code",
                  ),
            duration_ms: asNumber(
              result.duration_ms,
              "redacted payload command_result.duration_ms",
            ),
            success: asBoolean(
              result.success,
              "redacted payload command_result.success",
            ),
            stdout: asString(
              result.stdout,
              "redacted payload command_result.stdout",
            ),
            stderr: asString(
              result.stderr,
              "redacted payload command_result.stderr",
            ),
          };
        })();
  const completeness = asRecord(
    payload.payload_completeness,
    "redacted payload completeness",
  );

  return {
    schema_version: "stage-payload.v1",
    created_at: asString(payload.created_at, "redacted payload created_at"),
    repo: {
      repo_path: asString(repo.repo_path, "redacted payload repo.repo_path"),
      repo_name: asString(repo.repo_name, "redacted payload repo.repo_name"),
      current_branch: asNullableString(
        repo.current_branch,
        "redacted payload repo.current_branch",
      ),
      is_git_repo: asBoolean(
        repo.is_git_repo,
        "redacted payload repo.is_git_repo",
      ),
      has_uncommitted_changes: asBoolean(
        repo.has_uncommitted_changes,
        "redacted payload repo.has_uncommitted_changes",
      ),
    },
    changes: {
      changed_file_count: asNumber(
        changes.changed_file_count,
        "redacted payload changes.changed_file_count",
      ),
      status_counts: statusCounts,
      files: asArray(changes.files, "redacted payload changes.files").map(
        (file, index) =>
          buildChangedFile(file, `redacted payload changes.files[${index}]`),
      ),
      selected_file: selectedFile,
      selected_file_diff: selectedFileDiff,
    },
    command_availability: asArray(
      payload.command_availability,
      "redacted payload command_availability",
    ).map((value, index) => {
      const command = asRecord(
        value,
        `redacted payload command_availability[${index}]`,
      );
      return {
        command_id: asString(
          command.command_id,
          `redacted payload command_availability[${index}].command_id`,
        ),
        label: asString(
          command.label,
          `redacted payload command_availability[${index}].label`,
        ),
        command: asString(
          command.command,
          `redacted payload command_availability[${index}].command`,
        ),
        available: asBoolean(
          command.available,
          `redacted payload command_availability[${index}].available`,
        ),
        unavailable_reason: asNullableString(
          command.unavailable_reason,
          `redacted payload command_availability[${index}].unavailable_reason`,
        ),
      };
    }),
    command_result: commandResult,
    command_error: asNullableString(
      payload.command_error,
      "redacted payload command_error",
    ),
    screening_findings: asArray(
      payload.screening_findings,
      "redacted payload screening_findings",
    ).map((finding, index) =>
      buildScreeningFinding(
        finding,
        `redacted payload screening_findings[${index}]`,
      ),
    ),
    payload_completeness: {
      includes_selected_file_diff: asBoolean(
        completeness.includes_selected_file_diff,
        "redacted payload completeness.includes_selected_file_diff",
      ),
      selected_file_path: asNullableString(
        completeness.selected_file_path,
        "redacted payload completeness.selected_file_path",
      ),
      changed_files_without_diff_count: asNumber(
        completeness.changed_files_without_diff_count,
        "redacted payload completeness.changed_files_without_diff_count",
      ),
      untracked_files_without_content_count: asNumber(
        completeness.untracked_files_without_content_count,
        "redacted payload completeness.untracked_files_without_content_count",
      ),
      command_result_included: asBoolean(
        completeness.command_result_included,
        "redacted payload completeness.command_result_included",
      ),
      supported_commands_detected: asNumber(
        completeness.supported_commands_detected,
        "redacted payload completeness.supported_commands_detected",
      ),
      limitations: asStringArray(
        completeness.limitations,
        "redacted payload completeness.limitations",
      ),
    },
  };
}

function buildPersistedTokenBudget(tokenBudget: TokenBudget): TokenBudget {
  return {
    estimator: tokenBudget.estimator,
    estimator_note: tokenBudget.estimator_note,
    character_count: tokenBudget.character_count,
    byte_count: tokenBudget.byte_count,
    estimated_tokens: tokenBudget.estimated_tokens,
    sections: tokenBudget.sections.map((section) => ({
      name: section.name,
      character_count: section.character_count,
      byte_count: section.byte_count,
      estimated_tokens: section.estimated_tokens,
      percentage: section.percentage,
    })),
    warnings: tokenBudget.warnings.map((warning) => ({
      id: warning.id,
      level: warning.level,
      message: warning.message,
    })),
  };
}

function buildPersistedSafetyGateResult(
  safetyGateResult: SafetyGateResult,
): PersistedSafetyGateResultV1 {
  return {
    status: safetyGateResult.status,
    scanned_at: safetyGateResult.scanned_at,
    scanner: safetyGateResult.scanner,
    scan_coverage: {
      stage_payload_json_scanned:
        safetyGateResult.scan_coverage.stage_payload_json_scanned,
      selected_file_diff_included:
        safetyGateResult.scan_coverage.selected_file_diff_included,
      selected_file_diff_scanned:
        safetyGateResult.scan_coverage.selected_file_diff_scanned,
      selected_file_path:
        safetyGateResult.scan_coverage.selected_file_path,
      selected_file_diff_secret_findings_count:
        safetyGateResult.scan_coverage.selected_file_diff_secret_findings_count,
    },
    findings: safetyGateResult.findings.map((finding) => ({
      id: finding.id,
      level: finding.level,
      category: finding.category,
      title: finding.title,
      detail: finding.detail,
      match_count: finding.match_count,
    })),
    redaction_count: safetyGateResult.redaction_count,
    limitations: safetyGateResult.limitations.map((limitation) => limitation),
  };
}

function buildPersistedStageReport(
  localStageReport: StageReport,
  redactedPayload: RedactedStagePayloadV1,
  tokenBudget: TokenBudget,
  safetyGateResult: PersistedSafetyGateResultV1,
): PersistedLocalStageReportV1 {
  const commandResult = redactedPayload.command_result;
  const missingEvidence = [
    ...redactedPayload.payload_completeness.limitations,
  ];
  if (!redactedPayload.payload_completeness.includes_selected_file_diff) {
    missingEvidence.push("Selected file diff is missing.");
  }
  if (!redactedPayload.payload_completeness.command_result_included) {
    missingEvidence.push("No command result is included.");
  }
  if (
    redactedPayload.payload_completeness
      .untracked_files_without_content_count > 0
  ) {
    missingEvidence.push(
      `${redactedPayload.payload_completeness.untracked_files_without_content_count} untracked file(s) are listed without file content.`,
    );
  }
  missingEvidence.push(
    "No AI judgment has been generated.",
    "This report is not saved automatically; use Save to Stage History explicitly.",
  );

  return {
    schema_version: localStageReport.schema_version,
    generated_at: localStageReport.generated_at,
    generation_mode: localStageReport.generation_mode,
    report_status: localStageReport.report_status,
    summary: {
      repo_name: redactedPayload.repo.repo_name,
      branch: redactedPayload.repo.current_branch,
      changed_file_count: redactedPayload.changes.changed_file_count,
      selected_file_path:
        redactedPayload.payload_completeness.selected_file_path,
    },
    deterministic_evidence: {
      screening_findings: redactedPayload.screening_findings.map((finding) => ({
        id: finding.id,
        level: finding.level,
        title: finding.title,
        detail: finding.detail,
        source: finding.source,
      })),
      command_result: commandResult
        ? {
            command_id: commandResult.command_id,
            command: commandResult.command,
            exit_code: commandResult.exit_code,
            duration_ms: commandResult.duration_ms,
            success: commandResult.success,
          }
        : null,
      safety_gate_status: safetyGateResult.status,
      token_budget_estimated_tokens: tokenBudget.estimated_tokens,
      payload_limitations:
        redactedPayload.payload_completeness.limitations.map(
          (limitation) => limitation,
        ),
    },
    risk_findings: localStageReport.risk_findings.map((finding) => ({
      id: finding.id,
      level: finding.level,
      title: finding.title,
      detail: finding.detail,
      source: finding.source,
    })),
    missing_evidence: [...new Set(missingEvidence)],
    human_review_checklist: localStageReport.human_review_checklist.map(
      (item) => item,
    ),
    recommendation: {
      decision: localStageReport.recommendation.decision,
      rationale: localStageReport.recommendation.rationale,
    },
  };
}

export function normalizeRepositoryPath(repoPath: string): string {
  const normalizedSeparators = repoPath.replace(/\\/g, "/");

  if (/^[A-Za-z]:\/+$/u.test(normalizedSeparators)) {
    return `${normalizedSeparators.slice(0, 2)}/`;
  }

  if (/^\/+$/u.test(normalizedSeparators)) {
    return "/";
  }

  return normalizedSeparators.replace(/\/+$/u, "");
}

function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function buildBoundedDiffHashInput(
  repo: BuildStageHistorySnapshotInput["repo"],
  redactedPayload: RedactedStagePayloadV1,
): string {
  const files = redactedPayload.changes.files
    .map((file) => ({
      file_path: file.file_path,
      old_file_path: file.old_file_path,
      status: file.status,
      is_staged: file.is_staged,
      is_unstaged: file.is_unstaged,
      is_untracked: file.is_untracked,
    }))
    .sort((left, right) =>
      compareText(JSON.stringify(left), JSON.stringify(right)),
    );

  // This intentionally fingerprints only changed-file metadata plus the
  // currently selected redacted diff. It does not cover all changed-file
  // content, unselected file contents, command runs, or repository contents.
  return JSON.stringify({
    schema_version: "stage-history-diff-hash.v1",
    repository: {
      repo_path: normalizeRepositoryPath(repo.repo_path),
      branch: repo.current_branch,
    },
    changes: {
      files,
      selected_file_path:
        redactedPayload.payload_completeness.selected_file_path,
      selected_file_diff:
        redactedPayload.changes.selected_file_diff?.diff ?? null,
    },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const defaultRuntime: StageHistorySnapshotRuntime = {
  randomUuid: () => crypto.randomUUID(),
  now: () => new Date(),
  sha256Hex,
};

export async function buildStageHistorySaveInput(
  input: BuildStageHistorySnapshotInput,
  runtime: StageHistorySnapshotRuntime = defaultRuntime,
): Promise<SaveStageHistoryScanInput> {
  const scanId = `scan_${runtime.randomUuid()}`;
  const createdAt = runtime.now().toISOString();
  const redactedPayload = parseRedactedStagePayload(
    input.redacted_payload_preview,
  );
  const tokenBudget = buildPersistedTokenBudget(input.token_budget);
  const safetyGateResult = buildPersistedSafetyGateResult(
    input.safety_gate_result,
  );
  const localStageReport = buildPersistedStageReport(
    input.local_stage_report,
    redactedPayload,
    tokenBudget,
    safetyGateResult,
  );
  const hashInput = buildBoundedDiffHashInput(input.repo, redactedPayload);
  const hash = await runtime.sha256Hex(hashInput);

  return {
    scan_id: scanId,
    repo_path: input.repo.repo_path,
    repo_name: input.repo.repo_name,
    branch: input.repo.current_branch,
    diff_hash: `sha256:v1:${hash}`,
    created_at: createdAt,
    changed_file_count: redactedPayload.changes.changed_file_count,
    selected_file_path:
      redactedPayload.payload_completeness.selected_file_path,
    safety_gate_status: safetyGateResult.status,
    estimated_tokens: tokenBudget.estimated_tokens,
    report_generation_mode: "local_preview",
    report_status: "preview_only",
    recommendation_decision: localStageReport.recommendation.decision,
    artifacts: {
      schema_version: "stage-history-artifacts.v1",
      redacted_stage_payload: redactedPayload,
      token_budget: tokenBudget,
      pre_stage_screening_findings: redactedPayload.screening_findings.map(
        (finding) => ({
          id: finding.id,
          level: finding.level,
          title: finding.title,
          detail: finding.detail,
          source: finding.source,
        }),
      ),
      safety_gate_result: safetyGateResult,
      local_stage_report: localStageReport,
      markdown_export: null,
    },
  };
}

function hasValidRedactedPreview(result: SafetyGateResult): boolean {
  try {
    parseRedactedStagePayload(result.redacted_payload_preview);
    return true;
  } catch {
    return false;
  }
}

export function getStageHistorySaveDisabledReasons(
  evidence: StageHistorySaveEvidence,
): string[] {
  const reasons: string[] = [];

  if (!evidence.has_valid_repo) {
    reasons.push("Select a valid Git repository.");
  }
  if (evidence.is_inspecting_repo) {
    reasons.push("Wait for repository inspection to finish.");
  }
  if (evidence.is_loading_changed_files) {
    reasons.push("Wait for changed files to finish loading.");
  }
  if (evidence.is_loading_diff) {
    reasons.push("Wait for the selected diff to finish loading.");
  }
  if (evidence.is_loading_commands) {
    reasons.push("Wait for command availability to finish loading.");
  }
  if (evidence.is_running_command) {
    reasons.push("Wait for the local command to finish.");
  }
  if (!evidence.has_stage_payload) {
    reasons.push("Stage Payload is not available.");
  }
  if (!evidence.token_budget) {
    reasons.push("Token Budget is not available.");
  }
  if (!evidence.safety_gate_result) {
    reasons.push("Safety Gate result is not available.");
  }
  if (!evidence.local_stage_report) {
    reasons.push("Local Stage Report is not available.");
  }

  if (evidence.safety_gate_result) {
    const preview = evidence.safety_gate_result.redacted_payload_preview;
    if (preview.trim().length === 0) {
      reasons.push("Redacted payload preview is not available.");
    } else if (!hasValidRedactedPreview(evidence.safety_gate_result)) {
      reasons.push("Redacted payload preview is invalid. Refresh the evidence.");
    }
  }

  return reasons;
}

export function saveStageHistoryScan(
  input: SaveStageHistoryScanInput,
): Promise<SaveStageHistoryScanResult> {
  return invoke<SaveStageHistoryScanResult>("save_stage_history_scan", {
    input,
  });
}
