import type { SafetyGateResult } from "../../lib/safetyGate";

type SafetyGatePanelProps = {
  result: SafetyGateResult | null;
};

const statusLabels: Record<SafetyGateResult["status"], string> = {
  pass: "Pass",
  warning: "Warning",
  blocked: "Blocked",
};

const statusStyles: Record<SafetyGateResult["status"], string> = {
  pass: "border-emerald-900/70 bg-emerald-950/30 text-emerald-100",
  warning: "border-amber-900/70 bg-amber-950/30 text-amber-100",
  blocked: "border-red-900/70 bg-red-950/30 text-red-100",
};

function findingStyles(level: SafetyGateResult["findings"][number]["level"]) {
  if (level === "blocked") {
    return "border-red-900/70 bg-red-950/30 text-red-100";
  }

  if (level === "warning") {
    return "border-amber-900/70 bg-amber-950/30 text-amber-100";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function SafetyGatePanel({ result }: SafetyGatePanelProps) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Safety Gate</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Local pattern scan only. No data is sent anywhere.
          </p>
        </div>

        {result && (
          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[result.status]}`}
          >
            {statusLabels[result.status]}
          </span>
        )}
      </div>

      {!result && (
        <p className="mt-4 text-sm text-zinc-500">
          Select a valid Git repository to scan the current Stage Payload.
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-zinc-500">Status</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {statusLabels[result.status]}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Scanned at</dt>
              <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                {result.scanned_at}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Scanner</dt>
              <dd className="mt-1 break-all text-sm font-medium text-zinc-100">
                {result.scanner}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Redactions</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {result.redaction_count}
              </dd>
            </div>
          </dl>

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
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {yesNo(result.scan_coverage.stage_payload_json_scanned)}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">
                  Selected file diff scanned
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {yesNo(result.scan_coverage.selected_file_diff_scanned)}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">
                  Selected file diff included
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {yesNo(result.scan_coverage.selected_file_diff_included)}
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

              <div>
                <dt className="text-sm text-zinc-500">Redaction count</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {result.redaction_count}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-zinc-500">Finding count</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-100">
                  {result.findings.length}
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
                  className={`rounded-lg border px-3 py-2 text-sm leading-6 ${findingStyles(
                    finding.level,
                  )}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">{finding.title}</span>
                    <span className="text-xs uppercase tracking-wide opacity-80">
                      {finding.level} / {finding.category} /{" "}
                      {finding.match_count}
                    </span>
                  </div>
                  <p className="mt-1 opacity-90">{finding.detail}</p>
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

          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-zinc-200">
                Redacted payload preview
              </h3>
              <p className="text-xs text-zinc-500">
                Preview only. Original Stage Payload is unchanged.
              </p>
            </div>

            <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-200">{result.redacted_payload_preview}</pre>
          </section>
        </div>
      )}
    </div>
  );
}