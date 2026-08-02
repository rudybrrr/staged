import { useEffect, useRef, useState } from "react";
import { Archive } from "lucide-react";

import {
  buildStageHistorySaveInput,
  saveStageHistoryScan,
  type BuildStageHistorySnapshotInput,
  type SaveStageHistoryCommandError,
  type SaveStageHistoryScanResult,
} from "../../lib/stageHistory";
import { ActionButton, Panel } from "../../ui";

type StageHistorySavePanelProps = {
  snapshotInput: BuildStageHistorySnapshotInput | null;
  disabledReasons: string[];
};

type SaveConfirmation = {
  result: SaveStageHistoryScanResult;
  safetyGateStatus: "pass" | "warning" | "blocked";
};

const COMMAND_ERROR_MESSAGES: Record<
  SaveStageHistoryCommandError["code"],
  string
> = {
  invalid_input:
    "Current verification evidence could not be validated. Refresh and try again.",
  duplicate_scan_id:
    "A unique history record could not be created. Try saving again.",
  storage_unavailable: "Stage History storage is unavailable.",
  save_failed: "The scan could not be saved to Stage History.",
};

function commandErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return COMMAND_ERROR_MESSAGES.save_failed;
  }

  const code = error.code;
  if (typeof code !== "string" || !(code in COMMAND_ERROR_MESSAGES)) {
    return COMMAND_ERROR_MESSAGES.save_failed;
  }

  return COMMAND_ERROR_MESSAGES[code as SaveStageHistoryCommandError["code"]];
}

export function StageHistorySavePanel({
  snapshotInput,
  disabledReasons,
}: StageHistorySavePanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [confirmation, setConfirmation] =
    useState<SaveConfirmation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const evidenceVersion = useRef(0);

  useEffect(() => {
    evidenceVersion.current += 1;
    setConfirmation(null);
    setErrorMessage(null);
  }, [snapshotInput]);

  const isDisabled =
    isSaving || snapshotInput === null || disabledReasons.length > 0;

  async function handleSave() {
    if (isDisabled || !snapshotInput) {
      return;
    }

    const capturedInput = snapshotInput;
    const capturedEvidenceVersion = evidenceVersion.current;
    setIsSaving(true);
    setConfirmation(null);
    setErrorMessage(null);

    let commandInput;
    try {
      commandInput = await buildStageHistorySaveInput(capturedInput);
    } catch {
      if (capturedEvidenceVersion === evidenceVersion.current) {
        setErrorMessage(
          "A persistence-safe history snapshot could not be prepared.",
        );
      }
      setIsSaving(false);
      return;
    }

    try {
      const result = await saveStageHistoryScan(commandInput);
      if (capturedEvidenceVersion === evidenceVersion.current) {
        setConfirmation({
          result,
          safetyGateStatus: commandInput.safety_gate_status,
        });
      }
    } catch (error) {
      if (capturedEvidenceVersion === evidenceVersion.current) {
        setErrorMessage(commandErrorMessage(error));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Panel
      title="Save to Stage History"
      icon={<Archive className="h-5 w-5" />}
      description="Save this completed local verification state. Nothing is submitted to a provider."
    >
      <div className="space-y-3">
        <ActionButton
          type="button"
          variant="secondary"
          disabled={isDisabled}
          onClick={() => void handleSave()}
          className="w-fit"
        >
          {isSaving ? "Saving..." : "Save to Stage History"}
        </ActionButton>

        {disabledReasons.length > 0 && (
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Complete the current local verification first:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
              {disabledReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {snapshotInput?.safety_gate_result.status === "blocked" &&
          !confirmation && (
            <p className="text-sm leading-6 text-amber-300">
              A blocked Safety Gate result can still be saved locally. This
              does not approve or submit it.
            </p>
          )}

        <div aria-live="polite">
          {confirmation?.safetyGateStatus === "blocked" ? (
            <div className="space-y-1 text-sm leading-6 text-amber-300">
              <p>Saved locally with Safety Gate status: blocked.</p>
              <p>Saving history does not approve or submit this payload.</p>
              <p className="text-zinc-400">
                Saved at {confirmation.result.created_at}.
              </p>
            </div>
          ) : confirmation ? (
            <p className="text-sm leading-6 text-emerald-300">
              Saved locally at {confirmation.result.created_at}.
            </p>
          ) : null}

          {errorMessage && (
            <div className="space-y-1 text-sm leading-6 text-red-300">
              <p>{errorMessage}</p>
              <p>Current verification state is unchanged.</p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
