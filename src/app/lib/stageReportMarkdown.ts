import type { StageReport } from "./stageReport";

function formatValue(value: string | number | boolean | null) {
  if (value === null) {
    return "Unknown";
  }

  return String(value);
}

function formatList(items: string[], emptyText: string) {
  if (items.length === 0) {
    return `- ${emptyText}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatScreeningFindings(
  findings: StageReport["deterministic_evidence"]["screening_findings"],
) {
  if (findings.length === 0) {
    return "- No local screening findings are present.";
  }

  return findings
    .map(
      (finding) =>
        `- [${finding.level}] ${finding.title} (${finding.source}): ${finding.detail}`,
    )
    .join("\n");
}

function formatRiskFindings(findings: StageReport["risk_findings"]) {
  if (findings.length === 0) {
    return "- No local-preview risk findings are present.";
  }

  return findings
    .map(
      (finding) =>
        `- [${finding.level}] ${finding.title} (${finding.source}): ${finding.detail}`,
    )
    .join("\n");
}

function formatCommandResult(
  commandResult: StageReport["deterministic_evidence"]["command_result"],
) {
  if (!commandResult) {
    return "- No command result is present.";
  }

  return [
    `- Command ID: ${commandResult.command_id}`,
    `- Command: \`${commandResult.command}\``,
    `- Exit code: ${formatValue(commandResult.exit_code)}`,
    `- Duration: ${commandResult.duration_ms} ms`,
    `- Success: ${commandResult.success ? "yes" : "no"}`,
  ].join("\n");
}

export function formatStageReportMarkdown(report: StageReport): string {
  return [
    "# Stage Report",
    "",
    "> Local preview only. No AI review has been generated.",
    "",
    "This Markdown export is generated locally from deterministic frontend state. It does not imply the code has been AI-reviewed or is safe to commit.",
    "",
    "## Report Metadata",
    "",
    `- Schema version: ${report.schema_version}`,
    `- Generated at: ${report.generated_at}`,
    `- Generation mode: ${report.generation_mode}`,
    `- Report status: ${report.report_status}`,
    "",
    "## Repository and Change Summary",
    "",
    `- Repo name: ${report.summary.repo_name}`,
    `- Branch: ${formatValue(report.summary.branch)}`,
    `- Changed file count: ${report.summary.changed_file_count}`,
    `- Selected file path: ${formatValue(report.summary.selected_file_path)}`,
    "",
    "## Deterministic Evidence (Local Only)",
    "",
    `- Safety Gate status: ${report.deterministic_evidence.safety_gate_status}`,
    `- Token Budget estimated tokens: ${formatValue(
      report.deterministic_evidence.token_budget_estimated_tokens,
    )}`,
    "",
    "### Command Result Summary",
    "",
    formatCommandResult(report.deterministic_evidence.command_result),
    "",
    "### Screening Findings",
    "",
    formatScreeningFindings(report.deterministic_evidence.screening_findings),
    "",
    "### Payload Limitations",
    "",
    formatList(
      report.deterministic_evidence.payload_limitations,
      "No payload limitations are present.",
    ),
    "",
    "## Risk Findings (Local Preview)",
    "",
    formatRiskFindings(report.risk_findings),
    "",
    "## Missing Evidence",
    "",
    formatList(report.missing_evidence, "No missing evidence is listed."),
    "",
    "## Human Review Checklist",
    "",
    formatList(
      report.human_review_checklist,
      "No human review checklist items are listed.",
    ),
    "",
    "## Recommendation",
    "",
    `- Decision: ${report.recommendation.decision}`,
    `- Rationale: ${report.recommendation.rationale}`,
    "",
  ].join("\n");
}
