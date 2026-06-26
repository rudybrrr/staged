import type { StagePayload } from "../../lib/stagePayload";

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

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function StagePayloadPreviewPanel({
  payload,
}: StagePayloadPreviewPanelProps) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Stage Payload</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Local preview only. No AI call has been made. Secret redaction is
            not implemented yet.
          </p>
        </div>

        {payload && (
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
            Read-only JSON
          </span>
        )}
      </div>

      {!payload && (
        <p className="mt-4 text-sm text-zinc-500">
          Select a valid Git repository to build a local read-only Stage Payload
          preview.
        </p>
      )}

      {payload && (
        <div className="mt-6 space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-zinc-500">Schema version</dt>
              <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                {payload.schema_version}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Created at</dt>
              <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                {payload.created_at}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Repo name</dt>
              <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                {payload.repo.repo_name}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Branch</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {payload.repo.current_branch ?? "Detached HEAD / unknown"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Changed files</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {payload.changes.changed_file_count}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Command result</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {commandStatus(payload)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Screening findings</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {payload.screening_findings.length}
              </dd>
            </div>
          </dl>

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
                <dt className="text-sm text-zinc-500">Selected diff</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {yesNo(
                    payload.payload_completeness.includes_selected_file_diff,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Selected file</dt>
                <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                  {payload.payload_completeness.selected_file_path ?? "None"}
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

              <div>
                <dt className="text-sm text-zinc-500">Command result included</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {yesNo(payload.payload_completeness.command_result_included)}
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

          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-zinc-200">
                Read-only payload JSON
              </h3>
              <p className="text-xs text-zinc-500">
                Generated locally from already loaded frontend state.
              </p>
            </div>

            <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-200">{JSON.stringify(payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
