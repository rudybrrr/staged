import type { ComponentType } from "react";
import { FileText, ShieldAlert, ShieldCheck } from "lucide-react";

import type { SafetyGateResult } from "../../lib/safetyGate";
import type { StagePayload } from "../../lib/stagePayload";
import type { StageReport } from "../../lib/stageReport";
import type { StagingGroundReadiness } from "../../lib/stagingGround";
import type { TokenBudget } from "../../lib/tokenBudget";
import type { FutureAiApproval, ProviderReadinessState } from "../../types/providerReadiness";
import {
  ActionButton,
  Panel,
  StatusBadge,
  type ActionButtonVariant,
  type PipelineStep,
  type StatusTone,
} from "../../ui";
import { SafetyGatePanel } from "../safety-gate/SafetyGatePanel";
import { StagePayloadPreviewPanel } from "../stage-payload/StagePayloadPreviewPanel";
import { StageReportPanel } from "../stage-report/StageReportPanel";
import { StagingGroundPanel } from "../staging-ground/StagingGroundPanel";
import { TokenBudgetPanel } from "../token-budget/TokenBudgetPanel";

type VerdictKind = "blocked" | "warning" | "pass" | "idle";

type Verdict = {
  kind: VerdictKind;
  tone: StatusTone;
  badgeLabel: string;
  title: string;
  reason: string;
  actionLabel: string;
  actionVariant: ActionButtonVariant;
  Icon: ComponentType<{ className?: string }>;
};

const MAX_INLINE_RATIONALE_LENGTH = 160;

function deriveVerdict(
  safetyGateResult: SafetyGateResult | null,
  stageReport: StageReport | null,
  stagingGroundReadiness: StagingGroundReadiness,
): Verdict {
  const decision = stageReport?.recommendation.decision ?? null;

  const isBlocked = safetyGateResult?.status === "blocked" || decision === "do_not_submit";
  const isWarning =
    !isBlocked &&
    (safetyGateResult?.status === "warning" || decision === "review_manually");
  const isPass = !isBlocked && !isWarning && safetyGateResult?.status === "pass" && stageReport;

  let reason: string;
  if (
    stageReport?.recommendation.rationale &&
    stageReport.recommendation.rationale.length <= MAX_INLINE_RATIONALE_LENGTH
  ) {
    reason = stageReport.recommendation.rationale;
  } else if (safetyGateResult) {
    reason =
      safetyGateResult.status === "blocked"
        ? "Safety Gate found likely secrets in the local Stage Payload."
        : safetyGateResult.status === "warning"
          ? "Safety Gate flagged findings that need manual review."
          : "Safety Gate passed its local pattern scan.";
  } else if (stagingGroundReadiness.status !== "not_ready") {
    reason = "Staging Ground has local evidence, but review is still local-only.";
  } else {
    reason = "Local evidence is not ready yet.";
  }

  if (isBlocked) {
    return {
      kind: "blocked",
      tone: "blocked",
      badgeLabel: "Blocked",
      title: "Do not submit",
      reason,
      actionLabel: "Do not submit",
      actionVariant: "danger",
      Icon: ShieldAlert,
    };
  }

  if (isWarning) {
    return {
      kind: "warning",
      tone: "warning",
      badgeLabel: "Warning",
      title: "Review manually",
      reason,
      actionLabel: "Review manually",
      actionVariant: "secondary",
      Icon: ShieldAlert,
    };
  }

  if (isPass) {
    return {
      kind: "pass",
      tone: "preview",
      badgeLabel: "Preview",
      title: "Ready for future AI review",
      reason,
      actionLabel: "Ready for future AI review",
      actionVariant: "secondary",
      Icon: ShieldCheck,
    };
  }

  return {
    kind: "idle",
    tone: "idle",
    badgeLabel: "Not ready",
    title: "Review not ready",
    reason,
    actionLabel: "Review not ready",
    actionVariant: "secondary",
    Icon: FileText,
  };
}

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const { Icon } = verdict;

  return (
    <Panel
      title="Review verdict"
      icon={<Icon className="h-5 w-5" />}
      description="Local preview only. No AI has reviewed this code."
      status={{ tone: verdict.tone, label: verdict.badgeLabel }}
      variant="emphasis"
    >
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">{verdict.title}</h3>
        <p className="text-sm leading-6 text-zinc-400">{verdict.reason}</p>
        <ActionButton variant={verdict.actionVariant} disabled className="w-fit">
          {verdict.actionLabel}
        </ActionButton>
      </div>
    </Panel>
  );
}

function PipelineMiniSummary({ steps }: { steps: PipelineStep[] }) {
  return (
    <Panel title="Pipeline summary" description="Mirrors the pipeline strip above.">
      <ul className="space-y-2.5">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-300">{step.label}</span>
            <StatusBadge tone={step.tone} dot>
              {step.detail}
            </StatusBadge>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function providerSummary(providerReadinessState: ProviderReadinessState) {
  if (providerReadinessState.loading) {
    return "Provider checking";
  }

  if (providerReadinessState.error) {
    return "Provider check error";
  }

  return providerReadinessState.readiness?.configured
    ? "Provider configured"
    : "Provider not configured";
}

function detailsSummary(
  stagePayload: StagePayload | null,
  tokenBudget: TokenBudget | null,
  providerReadinessState: ProviderReadinessState,
) {
  const parts = [providerSummary(providerReadinessState)];

  if (!stagePayload) {
    parts.push("No local evidence yet");
    return parts.join(" | ");
  }

  parts.push(
    stagePayload.schema_version,
    `${stagePayload.changes.changed_file_count} changed files`,
  );

  if (tokenBudget) {
    parts.push(`${tokenBudget.estimated_tokens.toLocaleString()} tokens`);
  }

  return parts.join(" | ");
}
type ReviewRailPanelProps = {
  stagePayload: StagePayload | null;
  tokenBudget: TokenBudget | null;
  safetyGateResult: SafetyGateResult | null;
  stageReport: StageReport | null;
  stagingGroundReadiness: StagingGroundReadiness;
  providerReadinessState: ProviderReadinessState;
  futureAiApproval: FutureAiApproval;
  onRefreshProviderReadiness: () => void;
  hasValidRepo: boolean;
  pipelineSteps: PipelineStep[];
};

export function ReviewRailPanel({
  stagePayload,
  tokenBudget,
  safetyGateResult,
  stageReport,
  stagingGroundReadiness,
  providerReadinessState,
  futureAiApproval,
  onRefreshProviderReadiness,
  hasValidRepo,
  pipelineSteps,
}: ReviewRailPanelProps) {
  const verdict = deriveVerdict(safetyGateResult, stageReport, stagingGroundReadiness);

  return (
    <>
      <VerdictCard verdict={verdict} />

      <PipelineMiniSummary steps={pipelineSteps} />

      <Panel
        title="Details"
        description="Stage Payload, Token Budget, Staging Ground, Safety Gate, and Stage Report."
        collapsible
        defaultOpen={false}
        summary={detailsSummary(stagePayload, tokenBudget, providerReadinessState)}
      >
        <StagePayloadPreviewPanel payload={stagePayload} embedded />
        <TokenBudgetPanel budget={tokenBudget} embedded />
        <StagingGroundPanel
          hasValidRepo={hasValidRepo}
          readiness={stagingGroundReadiness}
          providerReadinessState={providerReadinessState}
          futureAiApproval={futureAiApproval}
          onRefreshProviderReadiness={onRefreshProviderReadiness}
          embedded
        />
        <SafetyGatePanel result={safetyGateResult} embedded />
        <StageReportPanel report={stageReport} embedded />
      </Panel>
    </>
  );
}
