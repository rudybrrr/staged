import { ClipboardCheck, RefreshCw, Sparkles } from "lucide-react";

import type { StagingGroundReadiness } from "../../lib/stagingGround";
import type { FutureAiApproval, ProviderReadinessState } from "../../types/providerReadiness";
import { ActionButton, EmptyState, Panel, StatusBadge, type StatusTone } from "../../ui";

type StagingGroundPanelProps = {
  hasValidRepo: boolean;
  readiness: StagingGroundReadiness;
  providerReadinessState: ProviderReadinessState;
  futureAiApproval: FutureAiApproval;
  onRefreshProviderReadiness: () => void;
  embedded?: boolean;
};

const statusLabels: Record<StagingGroundReadiness["status"], string> = {
  not_ready: "Not ready",
  review_only: "Review only",
  ready_later: "Ready later",
};

const statusTones: Record<StagingGroundReadiness["status"], StatusTone> = {
  not_ready: "warning",
  review_only: "preview",
  ready_later: "preview",
};

const messageTones: Record<
  StagingGroundReadiness["messages"][number]["level"],
  StatusTone
> = {
  info: "idle",
  warning: "warning",
  blocked: "blocked",
};

function checklistTone(value: boolean, blocked = false): { tone: StatusTone; label: string } {
  if (blocked) {
    return { tone: "blocked", label: "Blocked" };
  }

  return value
    ? { tone: "pass", label: "Available" }
    : { tone: "warning", label: "Missing" };
}

function safetyGateChecklistState(
  status: StagingGroundReadiness["safety_gate_status"],
): { tone: StatusTone; label: string } {
  if (status === "blocked") {
    return { tone: "blocked", label: "Blocked" };
  }

  if (status === "warning") {
    return { tone: "warning", label: "Warning" };
  }

  if (status === "pass") {
    return { tone: "pass", label: "Pass" };
  }

  return { tone: "blocked", label: "Missing" };
}

function providerReadinessStatus(
  state: ProviderReadinessState,
): { tone: StatusTone; label: string } {
  if (state.loading) {
    return { tone: "idle", label: "Checking" };
  }

  if (state.error) {
    return { tone: "blocked", label: "Check failed" };
  }

  return state.readiness?.configured
    ? { tone: "pass", label: "Configured" }
    : { tone: "warning", label: "Not configured" };
}

function ProviderApprovalSection({
  readiness,
  providerReadinessState,
  futureAiApproval,
  onRefreshProviderReadiness,
}: {
  readiness: StagingGroundReadiness;
  providerReadinessState: ProviderReadinessState;
  futureAiApproval: FutureAiApproval;
  onRefreshProviderReadiness: () => void;
}) {
  const providerStatus = providerReadinessStatus(providerReadinessState);
  const providerMessage =
    providerReadinessState.error ??
    providerReadinessState.readiness?.message ??
    "Provider readiness has not been checked yet.";
  const providerSource = providerReadinessState.readiness?.source ?? "None detected";

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-200">
              Provider Readiness / Future AI Approval
            </h3>
            <StatusBadge tone={providerStatus.tone}>{providerStatus.label}</StatusBadge>
            {futureAiApproval.eligibleWhenImplemented && (
              <StatusBadge tone="preview">Ready when implemented</StatusBadge>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Provider readiness is checked locally from environment variables only. No AI call or network request is made yet.
          </p>
        </div>

        <ActionButton
          variant="ghost"
          disabled={providerReadinessState.loading}
          onClick={onRefreshProviderReadiness}
          className="w-fit"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </ActionButton>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
          <dt className="text-sm text-zinc-500">Provider</dt>
          <dd className="mt-2 text-sm font-medium text-zinc-200">
            {providerReadinessState.readiness?.provider ?? "None"}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
          <dt className="text-sm text-zinc-500">Source</dt>
          <dd className="mt-2 text-sm font-medium text-zinc-200">
            {providerSource}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{providerMessage}</p>

      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
        <li>Future generation will use the approved redacted payload only.</li>
        <li>Safety Gate blocked state prevents future submission.</li>
        <li>Real AI Stage Report generation is not implemented in this build.</li>
        {readiness.safety_gate_status === "blocked" && (
          <li className="text-red-200">
            Safety Gate is blocked; no override exists here.
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ActionButton variant="primary" disabled className="w-fit">
          <Sparkles className="h-4 w-4" />
          Generate AI Stage Report
        </ActionButton>

        <div className="min-w-0 flex-1 sm:max-w-md">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Disabled reasons
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {futureAiApproval.disabledReasons.map((reason) => (
              <li key={reason}>
                <StatusBadge
                  tone={reason === "AI generation not implemented yet" ? "idle" : "warning"}
                >
                  {reason}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function StagingGroundPanel({
  hasValidRepo,
  readiness,
  providerReadinessState,
  futureAiApproval,
  onRefreshProviderReadiness,
  embedded = false,
}: StagingGroundPanelProps) {
  const checklist: Array<{
    id: string;
    label: string;
    state: { tone: StatusTone; label: string };
  }> = [
    {
      id: "stage-payload",
      label: "Stage Payload",
      state: checklistTone(readiness.has_payload),
    },
    {
      id: "selected-file-diff",
      label: "Selected file diff",
      state: checklistTone(readiness.has_selected_file_diff),
    },
    {
      id: "command-result",
      label: "Command result",
      state: checklistTone(readiness.has_command_result),
    },
    {
      id: "token-budget",
      label: "Token Budget",
      state: checklistTone(readiness.has_token_budget),
    },
    {
      id: "safety-gate",
      label: "Safety Gate",
      state: safetyGateChecklistState(readiness.safety_gate_status),
    },
    {
      id: "redaction-preview",
      label: "Redaction preview",
      state: checklistTone(readiness.redaction_ready, !readiness.redaction_ready),
    },
    {
      id: "ai-review-availability",
      label: "AI review availability",
      state: checklistTone(readiness.ai_review_available, true),
    },
  ];

  return (
    <Panel
      title="Staging Ground"
      icon={<ClipboardCheck className="h-5 w-5" />}
      description="Local review before future AI submission. No AI call has been made."
      status={{ tone: statusTones[readiness.status], label: statusLabels[readiness.status] }}
      variant={embedded ? "inset" : "default"}
    >
      <ProviderApprovalSection
        readiness={readiness}
        providerReadinessState={providerReadinessState}
        futureAiApproval={futureAiApproval}
        onRefreshProviderReadiness={onRefreshProviderReadiness}
      />

      {!hasValidRepo && (
        <EmptyState
          icon={<ClipboardCheck className="h-5 w-5" />}
          title="No repository selected"
          description="Select a valid Git repository to build local evidence for the Staging Ground."
        />
      )}

      {hasValidRepo && !readiness.has_payload && (
        <EmptyState
          title="No Stage Payload yet"
          description="The Staging Ground will summarize readiness after local evidence is available."
        />
      )}

      {hasValidRepo && readiness.has_payload && (
        <>
          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Readiness checklist
            </h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3"
                >
                  <dt className="text-sm text-zinc-500">{item.label}</dt>
                  <dd className="mt-2">
                    <StatusBadge tone={item.state.tone}>{item.state.label}</StatusBadge>
                  </dd>
                </div>
              ))}
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
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                >
                  <StatusBadge tone={messageTones[message.level]}>
                    {message.level}
                  </StatusBadge>
                  {message.message}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Panel>
  );
}
