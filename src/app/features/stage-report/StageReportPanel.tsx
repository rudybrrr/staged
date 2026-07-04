import { useMemo, useState } from "react";
import { AlertTriangle, Copy, FileText, Info, ShieldAlert } from "lucide-react";

import type { StageReport } from "../../lib/stageReport";
import { formatStageReportMarkdown } from "../../lib/stageReportMarkdown";
import {
  ActionButton,
  CodeBlock,
  EmptyState,
  MetricPill,
  Panel,
  StatusBadge,
  type StatusTone,
} from "../../ui";

type StageReportPanelProps = {
  report: StageReport | null;
  embedded?: boolean;
};

const riskTones: Record<StageReport["risk_findings"][number]["level"], StatusTone> = {
  info: "info",
  warning: "warning",
  high: "fail",
};

const recommendationTones: Record<
  StageReport["recommendation"]["decision"],
  StatusTone
> = {
  review_manually: "warning",
  do_not_submit: "blocked",
  ready_for_future_ai_review: "info",
};

const recommendationIcons: Record<
  StageReport["recommendation"]["decision"],
  typeof AlertTriangle
> = {
  review_manually: AlertTriangle,
  do_not_submit: ShieldAlert,
  ready_for_future_ai_review: Info,
};

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function commandStatus(report: StageReport) {
  const commandResult = report.deterministic_evidence.command_result;

  if (!commandResult) {
    return "No command result";
  }

  return commandResult.success ? "Succeeded" : "Failed";
}

export function StageReportPanel({ report, embedded = false }: StageReportPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const markdown = useMemo(
    () => (report ? formatStageReportMarkdown(report) : ""),
    [report],
  );

  async function copyMarkdown() {
    if (!report || !navigator.clipboard) {
      setCopyStatus("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  const RecommendationIcon = report
    ? recommendationIcons[report.recommendation.decision]
    : null;

  return (
    <Panel
      title="Stage Report"
      icon={<FileText className="h-5 w-5" />}
      description="Local preview only. No AI review has been generated."
      status={report ? { tone: "preview", label: "Preview only" } : undefined}
      variant={embedded ? "inset" : "default"}
    >
      {!report && (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No Stage Report yet"
          description="Select a valid Git repository to build a Stage Payload before viewing the local Stage Report preview."
        />
      )}

      {report && (
        <>
          <div className="flex flex-wrap gap-2">
            <MetricPill label="Generation mode" value={statusLabel(report.generation_mode)} />
            <MetricPill label="Report status" value={statusLabel(report.report_status)} />
            <MetricPill label="Generated at" value={report.generated_at} />
          </div>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">Summary</h3>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-zinc-500">Repo name</dt>
                <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                  {report.summary.repo_name}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Branch</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {report.summary.branch ?? "Detached HEAD / unknown"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Changed files</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {report.summary.changed_file_count}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Selected file</dt>
                <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                  {report.summary.selected_file_path ?? "None"}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Deterministic evidence
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <MetricPill
                label="Screening findings"
                value={report.deterministic_evidence.screening_findings.length}
              />
              <MetricPill
                label="Command result"
                value={commandStatus(report)}
                tone={
                  report.deterministic_evidence.command_result
                    ? report.deterministic_evidence.command_result.success
                      ? "pass"
                      : "fail"
                    : "idle"
                }
              />
              <MetricPill
                label="Estimated tokens"
                value={
                  report.deterministic_evidence.token_budget_estimated_tokens ??
                  "Unknown"
                }
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-zinc-500">Safety Gate</span>
              <StatusBadge tone={report.deterministic_evidence.safety_gate_status}>
                {statusLabel(report.deterministic_evidence.safety_gate_status)}
              </StatusBadge>
            </div>

            {report.deterministic_evidence.command_result && (
              <dl className="mt-4 grid gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-zinc-500">Command</dt>
                  <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                    {report.deterministic_evidence.command_result.command}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-zinc-500">Exit code</dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-100">
                    {report.deterministic_evidence.command_result.exit_code ??
                      "null"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-zinc-500">Duration</dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-100">
                    {report.deterministic_evidence.command_result.duration_ms} ms
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-zinc-500">Success</dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-100">
                    {report.deterministic_evidence.command_result.success
                      ? "Yes"
                      : "No"}
                  </dd>
                </div>
              </dl>
            )}

            {report.deterministic_evidence.payload_limitations.length > 0 && (
              <ul className="mt-4 space-y-2">
                {report.deterministic_evidence.payload_limitations.map(
                  (limitation) => (
                    <li
                      key={limitation}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                    >
                      {limitation}
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">Risk findings</h3>
            <ul className="mt-3 space-y-2">
              {report.risk_findings.map((finding) => (
                <li
                  key={finding.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={riskTones[finding.level]}>
                        {finding.level}
                      </StatusBadge>
                      <span className="text-sm font-medium text-zinc-100">
                        {finding.title}
                      </span>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {finding.source}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {finding.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Missing evidence
            </h3>
            {report.missing_evidence.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {report.missing_evidence.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No missing deterministic evidence detected.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Human review checklist
            </h3>
            <ul className="mt-3 space-y-2">
              {report.human_review_checklist.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-2">
              {RecommendationIcon && (
                <RecommendationIcon className="h-4 w-4 flex-none text-zinc-400" />
              )}
              <h3 className="text-sm font-medium text-zinc-200">Recommendation</h3>
              <StatusBadge tone={recommendationTones[report.recommendation.decision]}>
                {statusLabel(report.recommendation.decision)}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {report.recommendation.rationale}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">
              This preview never confirms code is safe to commit and does not
              reflect any AI review.
            </p>
          </section>

          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-zinc-200">
                Read-only Markdown export
              </h3>
              <div className="flex items-center gap-3">
                {copyStatus === "copied" && (
                  <StatusBadge tone="pass">Copied</StatusBadge>
                )}
                {copyStatus === "error" && (
                  <StatusBadge tone="fail">Copy failed</StatusBadge>
                )}
                <ActionButton variant="secondary" onClick={copyMarkdown}>
                  <Copy className="h-4 w-4" />
                  Copy Markdown
                </ActionButton>
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Local preview only. Copy stays in this app session.
            </p>

            <CodeBlock className="mt-3" label="Markdown preview" collapsible>
              {markdown}
            </CodeBlock>
          </section>

          <CodeBlock label="Read-only report JSON" collapsible>
            {JSON.stringify(report, null, 2)}
          </CodeBlock>
        </>
      )}
    </Panel>
  );
}
