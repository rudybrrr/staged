import { ClipboardCheck } from "lucide-react";

import type { StagingGroundReadiness } from "../../lib/stagingGround";
import { ActionButton, EmptyState, Panel, StatusBadge, type StatusTone } from "../../ui";

type StagingGroundPanelProps = {
  hasValidRepo: boolean;
  readiness: StagingGroundReadiness;
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

export function StagingGroundPanel({
  hasValidRepo,
  readiness,
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
    >
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

      <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">
              Future AI review
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              No AI review has been generated. AI submission is disabled in
              this build — this is a local preview before any future model
              call, gated by a passing or warning-only Safety Gate.
            </p>
          </div>

          <ActionButton variant="secondary" disabled className="w-fit">
            AI review not implemented
          </ActionButton>
        </div>
      </section>
    </Panel>
  );
}
