import { ShieldAlert, ShieldCheck } from "lucide-react";

import type { SafetyGateResult } from "../../lib/safetyGate";
import { CodeBlock, EmptyState, MetricPill, Panel, StatusBadge } from "../../ui";

type SafetyGatePanelProps = {
  result: SafetyGateResult | null;
  embedded?: boolean;
};

const statusLabels: Record<SafetyGateResult["status"], string> = {
  pass: "Pass",
  warning: "Warning",
  blocked: "Blocked",
};

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function SafetyGatePanel({ result, embedded = false }: SafetyGatePanelProps) {
  const isBlocked = result?.status === "blocked";

  return (
    <Panel
      title="Safety Gate"
      icon={
        isBlocked ? (
          <ShieldAlert className="h-5 w-5 text-red-400" />
        ) : (
          <ShieldCheck className="h-5 w-5" />
        )
      }
      description="Local pattern scan only. No data is sent anywhere."
      status={result ? { tone: result.status, label: statusLabels[result.status] } : undefined}
      className={isBlocked ? "!border-red-900/70" : undefined}
      variant={embedded ? "inset" : "default"}
    >
      {!result && (
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="No Safety Gate scan yet"
          description="Select a valid Git repository to scan the current Stage Payload."
        />
      )}

      {result && isBlocked && (
        <div className="flex items-center gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-4">
          <ShieldAlert className="h-4 w-4 flex-none text-red-200" />
          <p className="text-sm font-medium text-red-200">
            Blocked — secrets present. Staging withheld.
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="flex flex-wrap gap-2">
            <MetricPill label="Scanner" value={result.scanner} />
            <MetricPill label="Scanned at" value={result.scanned_at} />
            <MetricPill
              label="Redactions"
              value={result.redaction_count}
              tone={result.redaction_count > 0 ? "warning" : "idle"}
            />
            <MetricPill
              label="Findings"
              value={result.findings.length}
              tone={isBlocked ? "blocked" : "idle"}
            />
          </div>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Scan coverage
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Redactions are counted from the serialized Stage Payload preview;
              selected file diff findings are counted from the direct diff scan.
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-zinc-500">
                  Stage Payload JSON scanned
                </dt>
                <dd className="mt-2">
                  <StatusBadge
                    tone={result.scan_coverage.stage_payload_json_scanned ? "pass" : "idle"}
                  >
                    {yesNo(result.scan_coverage.stage_payload_json_scanned)}
                  </StatusBadge>
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">
                  Selected file diff scanned
                </dt>
                <dd className="mt-2">
                  <StatusBadge
                    tone={result.scan_coverage.selected_file_diff_scanned ? "pass" : "idle"}
                  >
                    {yesNo(result.scan_coverage.selected_file_diff_scanned)}
                  </StatusBadge>
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">
                  Selected file diff included
                </dt>
                <dd className="mt-2">
                  <StatusBadge
                    tone={result.scan_coverage.selected_file_diff_included ? "pass" : "idle"}
                  >
                    {yesNo(result.scan_coverage.selected_file_diff_included)}
                  </StatusBadge>
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">
                  Selected diff secret findings
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {result.scan_coverage.selected_file_diff_secret_findings_count}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm text-zinc-500">Selected file path</dt>
                <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                  {result.scan_coverage.selected_file_path ?? "None"}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">Findings</h3>
            <ul className="mt-3 space-y-2">
              {result.findings.map((finding) => (
                <li
                  key={finding.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={finding.level}>{finding.level}</StatusBadge>
                      <span className="text-sm font-medium text-zinc-100">
                        {finding.title}
                      </span>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">
                      {finding.category} / {finding.match_count}
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
            <h3 className="text-sm font-medium text-zinc-200">Limitations</h3>
            <ul className="mt-3 space-y-2">
              {result.limitations.map((limitation) => (
                <li
                  key={limitation}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                >
                  {limitation}
                </li>
              ))}
            </ul>
          </section>

          <CodeBlock
            label="Redacted payload preview (original Stage Payload is unchanged)"
            collapsible
          >
            {result.redacted_payload_preview}
          </CodeBlock>
        </>
      )}
    </Panel>
  );
}
