import type { SafetyGateResult } from "./safetyGate";
import type { StagePayload } from "./stagePayload";
import type { StagingGroundReadiness } from "./stagingGround";
import type { TokenBudget } from "./tokenBudget";

export type StageReport = {
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
    screening_findings: Array<{
      id: string;
      level: "pass" | "info" | "warning" | "fail";
      title: string;
      detail: string;
      source: "repo" | "changed_files" | "command_runner";
    }>;
    command_result: {
      command_id: string;
      command: string;
      exit_code: number | null;
      duration_ms: number;
      success: boolean;
    } | null;
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
    decision:
      | "review_manually"
      | "do_not_submit"
      | "ready_for_future_ai_review";
    rationale: string;
  };
};

export type BuildLocalStageReportPreviewInput = {
  stagePayload: StagePayload | null;
  tokenBudget: TokenBudget | null;
  safetyGateResult: SafetyGateResult | null;
  stagingGroundReadiness: StagingGroundReadiness;
};

const HIGH_TOKEN_THRESHOLD = 8000;

function uniqueItems(items: string[]) {
  return [...new Set(items)];
}

function hasImportantLimitations(payload: StagePayload) {
  return (
    payload.payload_completeness.limitations.length > 0 ||
    payload.payload_completeness.changed_files_without_diff_count > 0 ||
    payload.payload_completeness.untracked_files_without_content_count > 0
  );
}

function buildRiskFindings(
  payload: StagePayload,
  tokenBudget: TokenBudget | null,
  safetyGateStatus: StageReport["deterministic_evidence"]["safety_gate_status"],
): StageReport["risk_findings"] {
  const findings: StageReport["risk_findings"] = [];

  if (safetyGateStatus === "blocked") {
    findings.push({
      id: "safety-gate-blocked",
      level: "high",
      title: "Safety Gate is blocked",
      detail:
        "Local Safety Gate found a blocked finding, likely a secret or blocked safety issue in the Stage Payload or selected diff.",
      source: "local_preview",
    });
  }

  if (!payload.payload_completeness.includes_selected_file_diff) {
    findings.push({
      id: "selected-file-diff-missing",
      level: "warning",
      title: "Selected file diff missing",
      detail:
        "The Stage Report cannot include selected diff evidence because no selected file diff is present in the Stage Payload.",
      source: "local_preview",
    });
  }

  if (!payload.payload_completeness.command_result_included) {
    findings.push({
      id: "command-checks-not-included",
      level: "warning",
      title: "Command checks not included",
      detail:
        "No local command result is included, so this preview cannot summarize test, lint, or typecheck results.",
      source: "local_preview",
    });
  }

  if (payload.payload_completeness.changed_files_without_diff_count > 0) {
    findings.push({
      id: "changed-files-lack-diff-content",
      level: "warning",
      title: "Some changed files lack diff content",
      detail: `${payload.payload_completeness.changed_files_without_diff_count} changed file(s) are listed without diff content in the Stage Payload.`,
      source: "local_preview",
    });
  }

  if (
    tokenBudget &&
    tokenBudget.estimated_tokens > HIGH_TOKEN_THRESHOLD
  ) {
    findings.push({
      id: "payload-may-be-large",
      level: "warning",
      title: "Payload may be large",
      detail: `The local token estimate is ${tokenBudget.estimated_tokens} tokens, which may be large for future review workflows.`,
      source: "local_preview",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "local-preview-only",
      level: "info",
      title: "Local preview only",
      detail:
        "This report is generated only from local deterministic state. No AI review has been generated.",
      source: "local_preview",
    });
  }

  return findings;
}

function buildMissingEvidence(
  payload: StagePayload,
  stagingGroundReadiness: StagingGroundReadiness,
): string[] {
  const missingEvidence = [...payload.payload_completeness.limitations];

  if (!payload.payload_completeness.includes_selected_file_diff) {
    missingEvidence.push("Selected file diff is missing.");
  }

  if (!payload.payload_completeness.command_result_included) {
    missingEvidence.push("No command result is included.");
  }

  if (payload.payload_completeness.untracked_files_without_content_count > 0) {
    missingEvidence.push(
      `${payload.payload_completeness.untracked_files_without_content_count} untracked file(s) are listed without file content.`,
    );
  }

  if (!stagingGroundReadiness.ai_review_available) {
    missingEvidence.push("No AI judgment has been generated.");
  }

  missingEvidence.push(
    "This report is not saved automatically; use Save to Stage History explicitly.",
  );

  return uniqueItems(missingEvidence);
}

function buildHumanReviewChecklist(
  payload: StagePayload,
  safetyGateStatus: StageReport["deterministic_evidence"]["safety_gate_status"],
): string[] {
  const checklist = [
    "Review changed files and selected diff.",
    "Run available local checks.",
    "Verify untracked files are intentional.",
    "Confirm command failures are understood.",
    "Review payload limitations before relying on the report.",
  ];

  if (safetyGateStatus === "blocked") {
    checklist.splice(
      2,
      0,
      "Resolve Safety Gate blocked findings before future AI submission.",
    );
  }

  if (payload.payload_completeness.untracked_files_without_content_count === 0) {
    return checklist.filter(
      (item) => item !== "Verify untracked files are intentional.",
    );
  }

  return checklist;
}

function buildRecommendation(
  payload: StagePayload,
  safetyGateStatus: StageReport["deterministic_evidence"]["safety_gate_status"],
): StageReport["recommendation"] {
  if (safetyGateStatus === "blocked") {
    return {
      decision: "do_not_submit",
      rationale:
        "Safety Gate is blocked. Resolve blocked local findings before any future AI submission.",
    };
  }

  if (
    !payload.payload_completeness.includes_selected_file_diff ||
    !payload.payload_completeness.command_result_included ||
    hasImportantLimitations(payload)
  ) {
    return {
      decision: "review_manually",
      rationale:
        "Local evidence is incomplete or limited, so manual review is required before relying on this preview.",
    };
  }

  return {
    decision: "ready_for_future_ai_review",
    rationale:
      "Local deterministic evidence is present and Safety Gate is not blocked, but no AI review has been generated.",
  };
}

export function buildLocalStageReportPreview({
  stagePayload,
  tokenBudget,
  safetyGateResult,
  stagingGroundReadiness,
}: BuildLocalStageReportPreviewInput): StageReport | null {
  if (!stagePayload) {
    return null;
  }

  const safetyGateStatus =
    safetyGateResult?.status ??
    stagingGroundReadiness.safety_gate_status ??
    "blocked";

  return {
    schema_version: "stage-report.v1",
    generated_at: new Date().toISOString(),
    generation_mode: "local_preview",
    report_status: "preview_only",
    summary: {
      repo_name: stagePayload.repo.repo_name,
      branch: stagePayload.repo.current_branch,
      changed_file_count: stagePayload.changes.changed_file_count,
      selected_file_path: stagePayload.payload_completeness.selected_file_path,
    },
    deterministic_evidence: {
      screening_findings: stagePayload.screening_findings,
      command_result: stagePayload.command_result
        ? {
            command_id: stagePayload.command_result.command_id,
            command: stagePayload.command_result.command,
            exit_code: stagePayload.command_result.exit_code,
            duration_ms: stagePayload.command_result.duration_ms,
            success: stagePayload.command_result.success,
          }
        : null,
      safety_gate_status: safetyGateStatus,
      token_budget_estimated_tokens: tokenBudget?.estimated_tokens ?? null,
      payload_limitations: stagePayload.payload_completeness.limitations,
    },
    risk_findings: buildRiskFindings(
      stagePayload,
      tokenBudget,
      safetyGateStatus,
    ),
    missing_evidence: buildMissingEvidence(stagePayload, stagingGroundReadiness),
    human_review_checklist: buildHumanReviewChecklist(
      stagePayload,
      safetyGateStatus,
    ),
    recommendation: buildRecommendation(stagePayload, safetyGateStatus),
  };
}
