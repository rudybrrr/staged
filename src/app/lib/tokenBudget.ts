import type { StagePayload } from "./stagePayload";

export type TokenBudget = {
  estimator: "chars_div_4";
  estimator_note: string;
  character_count: number;
  byte_count: number;
  estimated_tokens: number;
  sections: Array<{
    name: string;
    character_count: number;
    byte_count: number;
    estimated_tokens: number;
    percentage: number;
  }>;
  warnings: Array<{
    id: string;
    level: "info" | "warning";
    message: string;
  }>;
};

const ESTIMATOR_NOTE =
  "Approximate local estimate using characters divided by 4. Actual token count depends on the target model tokenizer.";

const LARGE_SECTION_TOKEN_THRESHOLD = 2000;

const textEncoder = new TextEncoder();

function serialize(value: unknown) {
  return JSON.stringify(value) ?? "";
}

function estimateTokens(characterCount: number) {
  return Math.ceil(characterCount / 4);
}

function byteCount(value: string) {
  return textEncoder.encode(value).length;
}

function roundPercentage(value: number) {
  return Math.round(value * 10) / 10;
}

function buildSection(
  name: string,
  value: unknown,
  totalCharacterCount: number,
): TokenBudget["sections"][number] {
  const serializedValue = serialize(value);
  const characterCount = serializedValue.length;

  return {
    name,
    character_count: characterCount,
    byte_count: byteCount(serializedValue),
    estimated_tokens: estimateTokens(characterCount),
    percentage:
      totalCharacterCount === 0
        ? 0
        : roundPercentage((characterCount / totalCharacterCount) * 100),
  };
}

export function buildTokenBudget(payload: StagePayload): TokenBudget {
  const serializedPayload = serialize(payload);
  const characterCount = serializedPayload.length;
  const estimatedTokens = estimateTokens(characterCount);
  const sections = [
    buildSection("repo", payload.repo, characterCount),
    buildSection("changes.files", payload.changes.files, characterCount),
    buildSection(
      "changes.selected_file",
      payload.changes.selected_file,
      characterCount,
    ),
    buildSection(
      "changes.selected_file_diff",
      payload.changes.selected_file_diff,
      characterCount,
    ),
    buildSection(
      "command_availability",
      payload.command_availability,
      characterCount,
    ),
    buildSection("command_result", payload.command_result, characterCount),
    buildSection("command_error", payload.command_error, characterCount),
    buildSection(
      "screening_findings",
      payload.screening_findings,
      characterCount,
    ),
    buildSection(
      "payload_completeness",
      payload.payload_completeness,
      characterCount,
    ),
  ].sort((sectionA, sectionB) => {
    if (sectionB.character_count !== sectionA.character_count) {
      return sectionB.character_count - sectionA.character_count;
    }

    return sectionA.name.localeCompare(sectionB.name);
  });

  const warnings: TokenBudget["warnings"] = [
    {
      id: "approximate-tokenizer-independent-estimate",
      level: "info",
      message:
        "Estimate is approximate, local, and tokenizer-independent; actual token counts vary by model tokenizer.",
    },
  ];

  if (!payload.payload_completeness.includes_selected_file_diff) {
    warnings.push({
      id: "missing-selected-file-diff",
      level: "warning",
      message: "No selected file diff is included in the Stage Payload.",
    });
  }

  if (payload.payload_completeness.changed_files_without_diff_count > 0) {
    warnings.push({
      id: "changed-files-without-diff-content",
      level: "warning",
      message: `${payload.payload_completeness.changed_files_without_diff_count} changed file(s) are listed without diff content.`,
    });
  }

  if (payload.payload_completeness.untracked_files_without_content_count > 0) {
    warnings.push({
      id: "untracked-file-contents-not-included",
      level: "warning",
      message: `${payload.payload_completeness.untracked_files_without_content_count} untracked file(s) are listed without file contents.`,
    });
  }

  if (!payload.payload_completeness.command_result_included) {
    warnings.push({
      id: "missing-command-result",
      level: "warning",
      message: "No command result is included in the Stage Payload.",
    });
  }

  if (payload.payload_completeness.supported_commands_detected === 0) {
    warnings.push({
      id: "no-supported-npm-scripts-detected",
      level: "warning",
      message: "No supported npm scripts were detected for local checks.",
    });
  }

  warnings.push({
    id: "bounded-safety-gate-coverage",
    level: "warning",
    message:
      "Safety Gate redaction preview is available, but this MVP only scans the current Stage Payload and selected-file diff; full-repo secret scanning is not implemented yet.",
  });

  if (estimatedTokens > 8000) {
    warnings.push({
      id: "payload-exceeds-8000-estimated-tokens",
      level: "warning",
      message: "Payload exceeds 8,000 estimated tokens.",
    });
  }

  if (estimatedTokens > 16000) {
    warnings.push({
      id: "payload-exceeds-16000-estimated-tokens",
      level: "warning",
      message: "Payload exceeds 16,000 estimated tokens.",
    });
  }

  const largestSection = sections[0];

  if (
    largestSection?.name === "changes.selected_file_diff" &&
    largestSection.character_count > 0
  ) {
    warnings.push({
      id: "selected-file-diff-largest-section",
      level: "info",
      message: "Selected file diff is the largest Stage Payload section.",
    });
  }

  if (payload.command_result) {
    const stdoutTokens = estimateTokens(payload.command_result.stdout.length);
    const stderrTokens = estimateTokens(payload.command_result.stderr.length);

    if (
      stdoutTokens > LARGE_SECTION_TOKEN_THRESHOLD ||
      stderrTokens > LARGE_SECTION_TOKEN_THRESHOLD
    ) {
      warnings.push({
        id: "large-command-output-section",
        level: "warning",
        message:
          "Command stdout or stderr is a large payload section over 2,000 estimated tokens.",
      });
    }
  }

  return {
    estimator: "chars_div_4",
    estimator_note: ESTIMATOR_NOTE,
    character_count: characterCount,
    byte_count: byteCount(serializedPayload),
    estimated_tokens: estimatedTokens,
    sections,
    warnings,
  };
}
