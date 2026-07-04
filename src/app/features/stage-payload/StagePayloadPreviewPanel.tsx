import { Package } from "lucide-react";

import type { StagePayload } from "../../lib/stagePayload";
import { CodeBlock, EmptyState, MetricPill, Panel, StatusBadge } from "../../ui";

type StagePayloadPreviewPanelProps = {
  payload: StagePayload | null;
};

function commandStatus(payload: StagePayload) {
  if (payload.command_error) {
    return "App-level error";
  }

  if (!payload.command_result) {
    return "No command result";
  }

  return payload.command_result.success ? "Succeeded" : "Failed";
}

export function StagePayloadPreviewPanel({
  payload,
}: StagePayloadPreviewPanelProps) {
  return (
    <Panel
      title="Stage Payload"
      icon={<Package className="h-5 w-5" />}
      description="Local preview only. No AI call has been made. Secret redaction is not implemented yet."
      status={payload ? { tone: "preview", label: "Read-only JSON" } : undefined}
    >
      {!payload && (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No Stage Payload yet"
          description="Select a valid Git repository to build a local read-only Stage Payload preview."
        />
      )}

      {payload && (
        <>
          <div className="flex flex-wrap gap-2">
            <MetricPill label="Schema" value={payload.schema_version} />
            <MetricPill label="Repo" value={payload.repo.repo_name} />
            <MetricPill
              label="Branch"
              value={payload.repo.current_branch ?? "Detached HEAD"}
            />
            <MetricPill
              label="Changed files"
              value={payload.changes.changed_file_count}
            />
            <MetricPill
              label="Screening findings"
              value={payload.screening_findings.length}
            />
            <MetricPill
              label="Command result"
              value={commandStatus(payload)}
              tone={
                payload.command_result
                  ? payload.command_result.success
                    ? "pass"
                    : "fail"
                  : "idle"
              }
            />
          </div>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Command availability
            </h3>
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-zinc-500">Supported detected</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {payload.payload_completeness.supported_commands_detected}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Commands checked</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {payload.command_availability.length}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Unavailable</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {
                    payload.command_availability.filter(
                      (command) => !command.available,
                    ).length
                  }
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Payload completeness
            </h3>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-zinc-500">Selected diff included</dt>
                <dd className="mt-2">
                  <StatusBadge
                    tone={
                      payload.payload_completeness.includes_selected_file_diff
                        ? "pass"
                        : "warning"
                    }
                  >
                    {payload.payload_completeness.includes_selected_file_diff
                      ? "Included"
                      : "Missing"}
                  </StatusBadge>
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Selected file</dt>
                <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                  {payload.payload_completeness.selected_file_path ?? "None"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Command result included</dt>
                <dd className="mt-2">
                  <StatusBadge
                    tone={
                      payload.payload_completeness.command_result_included
                        ? "pass"
                        : "warning"
                    }
                  >
                    {payload.payload_completeness.command_result_included
                      ? "Included"
                      : "Missing"}
                  </StatusBadge>
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Files without diff</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {
                    payload.payload_completeness
                      .changed_files_without_diff_count
                  }
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Untracked without content</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {
                    payload.payload_completeness
                      .untracked_files_without_content_count
                  }
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">Limitations</h3>
            {payload.payload_completeness.limitations.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {payload.payload_completeness.limitations.map((limitation) => (
                  <li
                    key={limitation}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                  >
                    {limitation}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No local limitations detected.
              </p>
            )}
          </section>

          <CodeBlock label="Read-only payload JSON">
            {JSON.stringify(payload, null, 2)}
          </CodeBlock>
        </>
      )}
    </Panel>
  );
}
