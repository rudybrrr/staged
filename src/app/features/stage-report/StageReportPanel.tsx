import { useMemo, useState } from "react";

import type { StageReport } from "../../lib/stageReport";
import { formatStageReportMarkdown } from "../../lib/stageReportMarkdown";

type StageReportPanelProps = {
  report: StageReport | null;
};

const riskStyles: Record<StageReport["risk_findings"][number]["level"], string> = {
  info: "border-zinc-800 bg-zinc-950 text-zinc-300",
  warning: "border-amber-900/70 bg-amber-950/30 text-amber-100",
  high: "border-red-900/70 bg-red-950/30 text-red-100",
};

const recommendationStyles: Record<
  StageReport["recommendation"]["decision"],
  string
> = {
  review_manually: "border-amber-900/70 bg-amber-950/30 text-amber-100",
  do_not_submit: "border-red-900/70 bg-red-950/30 text-red-100",
  ready_for_future_ai_review:
    "border-emerald-900/70 bg-emerald-950/30 text-emerald-100",
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

export function StageReportPanel({ report }: StageReportPanelProps) {
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

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Stage Report</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Local preview only. No AI review has been generated.
          </p>
        </div>

        {report && (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="w-fit rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
              Preview only
            </span>
            <div className="flex items-center gap-3">
              {copyStatus === "copied" && (
                <span className="text-xs font-medium text-emerald-300">
                  Copied
                </span>
              )}
              {copyStatus === "error" && (
                <span className="text-xs font-medium text-red-300">
                  Copy failed
                </span>
              )}
              <button
                type="button"
                onClick={copyMarkdown}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                Copy Markdown
              </button>
            </div>
          </div>
        )}
      </div>

      {!report && (
        <p className="mt-4 text-sm text-zinc-500">
          Select a valid Git repository to build a Stage Payload before viewing
          the local Stage Report preview.
        </p>
      )}

      {report && (
        <div className="mt-6 space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-zinc-500">Generation mode</dt>
              <dd className="mt-1 text-sm font-medium capitalize text-zinc-100">
                {statusLabel(report.generation_mode)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Report status</dt>
              <dd className="mt-1 text-sm font-medium capitalize text-zinc-100">
                {statusLabel(report.report_status)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Generated at</dt>
              <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                {report.generated_at}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Recommendation</dt>
              <dd
                className={`mt-1 w-fit rounded-full border px-2 py-1 text-xs font-medium capitalize ${recommendationStyles[report.recommendation.decision]}`}
              >
                {statusLabel(report.recommendation.decision)}
              </dd>
            </div>
          </dl>

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
            <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-zinc-500">Screening findings</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {report.deterministic_evidence.screening_findings.length}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Command result</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {commandStatus(report)}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Safety Gate</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-zinc-100">
                  {report.deterministic_evidence.safety_gate_status}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Estimated tokens</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {report.deterministic_evidence.token_budget_estimated_tokens ??
                    "Unknown"}
                </dd>
              </div>
            </dl>

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
                  className={`rounded-lg border px-3 py-2 text-sm leading-6 ${riskStyles[finding.level]}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">{finding.title}</span>
                    <span className="text-xs uppercase tracking-wide opacity-80">
                      {finding.level} / {finding.source}
                    </span>
                  </div>
                  <p className="mt-1 opacity-90">{finding.detail}</p>
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

          <section
            className={`rounded-lg border p-4 ${recommendationStyles[report.recommendation.decision]}`}
          >
            <h3 className="text-sm font-medium text-current">Recommendation</h3>
            <p className="mt-2 text-sm leading-6 opacity-90">
              <span className="font-medium capitalize">
                {statusLabel(report.recommendation.decision)}
              </span>
              <span className="text-zinc-500"> / </span>
              {report.recommendation.rationale}
            </p>
          </section>

          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-zinc-200">
                Read-only Markdown export
              </h3>
              <p className="text-xs text-zinc-500">
                Local preview only. Copy stays in this app session.
              </p>
            </div>

            <pre className="mt-3 max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-200">{markdown}</pre>
          </section>

          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-zinc-200">
                Read-only report JSON
              </h3>
              <p className="text-xs text-zinc-500">
                Generated locally from current frontend state.
              </p>
            </div>

            <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-200">{JSON.stringify(report, null, 2)}</pre>
          </section>
        </div>
      )}
    </div>
  );
}

