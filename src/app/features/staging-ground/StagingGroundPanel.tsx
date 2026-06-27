import type { StagingGroundReadiness } from "../../lib/stagingGround";

type StagingGroundPanelProps = {
  hasValidRepo: boolean;
  readiness: StagingGroundReadiness;
};

const statusLabels: Record<StagingGroundReadiness["status"], string> = {
  not_ready: "Not ready",
  review_only: "Review only",
  ready_later: "Ready later",
};

function checklistState(value: boolean, blocked = false) {
  if (blocked) {
    return {
      label: "Blocked",
      className: "border-red-900/70 bg-red-950/30 text-red-100",
    };
  }

  if (value) {
    return {
      label: "Available",
      className: "border-emerald-900/70 bg-emerald-950/30 text-emerald-100",
    };
  }

  return {
    label: "Missing",
    className: "border-amber-900/70 bg-amber-950/30 text-amber-100",
  };
}

function messageStyles(level: StagingGroundReadiness["messages"][number]["level"]) {
  if (level === "blocked") {
    return "border-red-900/70 bg-red-950/30 text-red-100";
  }

  if (level === "warning") {
    return "border-amber-900/70 bg-amber-950/30 text-amber-100";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

export function StagingGroundPanel({
  hasValidRepo,
  readiness,
}: StagingGroundPanelProps) {
  const checklist = [
    {
      id: "stage-payload",
      label: "Stage Payload",
      value: readiness.has_payload,
    },
    {
      id: "selected-file-diff",
      label: "Selected file diff",
      value: readiness.has_selected_file_diff,
    },
    {
      id: "command-result",
      label: "Command result",
      value: readiness.has_command_result,
    },
    {
      id: "token-budget",
      label: "Token Budget",
      value: readiness.has_token_budget,
    },
    {
      id: "secret-redaction",
      label: "Secret redaction",
      value: readiness.redaction_ready,
      blocked: true,
    },
    {
      id: "ai-review-availability",
      label: "AI review availability",
      value: readiness.ai_review_available,
      blocked: true,
    },
  ];

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Staging Ground</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Local review before future AI submission. No AI call has been made.
          </p>
        </div>

        <span className="w-fit rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
          {statusLabels[readiness.status]}
        </span>
      </div>

      {!hasValidRepo && (
        <p className="mt-4 text-sm text-zinc-500">
          Select a valid Git repository to build local evidence for the Staging
          Ground.
        </p>
      )}

      {hasValidRepo && !readiness.has_payload && (
        <p className="mt-4 text-sm text-zinc-500">
          No Stage Payload exists yet. The Staging Ground will summarize
          readiness after local evidence is available.
        </p>
      )}

      <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Readiness checklist
            </h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((item) => {
                const state = checklistState(item.value, item.blocked);

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3"
                  >
                    <dt className="text-sm text-zinc-500">{item.label}</dt>
                    <dd
                      className={`mt-2 w-fit rounded-full border px-2 py-1 text-xs font-medium ${state.className}`}
                    >
                      {state.label}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Readiness messages
            </h3>
            <ul className="mt-3 space-y-2">
              {readiness.messages.map((message) => (
                <li
                  key={message.id}
                  className={`rounded-lg border px-3 py-2 text-sm leading-6 ${messageStyles(
                    message.level,
                  )}`}
                >
                  <span className="font-medium capitalize">
                    {message.level}
                  </span>
                  <span className="text-zinc-500"> / </span>
                  {message.message}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Future AI review
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Submission is blocked until AI integration, redaction, and a
                  Safety Gate exist.
                </p>
              </div>

              <button
                type="button"
                disabled
                className="w-fit cursor-not-allowed rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-500"
              >
                AI review not implemented
              </button>
            </div>
          </section>
      </div>
    </div>
  );
}
