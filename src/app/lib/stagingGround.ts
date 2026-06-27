import type { StagePayload } from "./stagePayload";
import type { TokenBudget } from "./tokenBudget";

export type StagingGroundReadiness = {
  has_payload: boolean;
  has_selected_file_diff: boolean;
  has_command_result: boolean;
  has_token_budget: boolean;
  has_blocking_limitations: boolean;
  redaction_ready: boolean;
  ai_review_available: boolean;
  status: "not_ready" | "review_only" | "ready_later";
  messages: Array<{
    id: string;
    level: "info" | "warning" | "blocked";
    message: string;
  }>;
};

export function buildStagingGroundReadiness(
  payload: StagePayload | null,
  tokenBudget: TokenBudget | null,
): StagingGroundReadiness {
  const hasPayload = payload !== null;
  const hasSelectedFileDiff =
    payload?.payload_completeness.includes_selected_file_diff ?? false;
  const hasCommandResult =
    payload?.payload_completeness.command_result_included ?? false;
  const hasTokenBudget = tokenBudget !== null;
  const redactionReady = false;
  const aiReviewAvailable = false;
  const hasBlockingLimitations = !redactionReady || !aiReviewAvailable;
  const messages: StagingGroundReadiness["messages"] = [
    {
      id: "local-preview-only",
      level: "info",
      message: "Local preview only; no data has been sent anywhere.",
    },
  ];

  if (hasPayload) {
    messages.push({
      id: "stage-payload-exists",
      level: "info",
      message: "Stage Payload exists.",
    });
  }

  if (payload && !hasSelectedFileDiff) {
    messages.push({
      id: "missing-selected-file-diff",
      level: "warning",
      message: "No selected file diff is included.",
    });
  }

  if (payload && !hasCommandResult) {
    messages.push({
      id: "missing-command-result",
      level: "warning",
      message: "No command result is included.",
    });
  }

  if (
    payload &&
    payload.payload_completeness.untracked_files_without_content_count > 0
  ) {
    messages.push({
      id: "untracked-file-contents-omitted",
      level: "warning",
      message: `${payload.payload_completeness.untracked_files_without_content_count} untracked file(s) are omitted from payload content.`,
    });
  }

  if (payload && payload.payload_completeness.changed_files_without_diff_count > 0) {
    messages.push({
      id: "changed-files-without-diff-content",
      level: "warning",
      message: `${payload.payload_completeness.changed_files_without_diff_count} changed file(s) are listed without diff content.`,
    });
  }

  messages.push({
    id: "secret-redaction-not-implemented",
    level: "blocked",
    message: "Secret redaction is not implemented yet.",
  });

  messages.push({
    id: "ai-review-not-implemented",
    level: "blocked",
    message: "AI review is not implemented yet.",
  });

  if (hasTokenBudget) {
    messages.push({
      id: "token-budget-available",
      level: "info",
      message: "Token Budget estimate is available.",
    });
  } else {
    messages.push({
      id: "token-budget-missing",
      level: "warning",
      message: "Token Budget estimate is missing.",
    });
  }

  return {
    has_payload: hasPayload,
    has_selected_file_diff: hasSelectedFileDiff,
    has_command_result: hasCommandResult,
    has_token_budget: hasTokenBudget,
    has_blocking_limitations: hasBlockingLimitations,
    redaction_ready: redactionReady,
    ai_review_available: aiReviewAvailable,
    status: hasPayload ? "review_only" : "not_ready",
    messages,
  };
}
