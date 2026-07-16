// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  BuildStageHistorySnapshotInput,
  SaveStageHistoryScanInput,
  SaveStageHistoryScanResult,
} from "../../lib/stageHistory";
import { StageHistorySavePanel } from "./StageHistorySavePanel";

const stageHistoryMocks = vi.hoisted(() => ({
  buildStageHistorySaveInput: vi.fn(),
  saveStageHistoryScan: vi.fn(),
}));

vi.mock("../../lib/stageHistory", async () => {
  const actual = await vi.importActual<typeof import("../../lib/stageHistory")>(
    "../../lib/stageHistory",
  );

  return {
    ...actual,
    buildStageHistorySaveInput: stageHistoryMocks.buildStageHistorySaveInput,
    saveStageHistoryScan: stageHistoryMocks.saveStageHistoryScan,
  };
});

const builtInput = {
  scan_id: "scan_11111111-1111-4111-8111-111111111111",
} as SaveStageHistoryScanInput;

const savedResult: SaveStageHistoryScanResult = {
  scan_id: "scan_11111111-1111-4111-8111-111111111111",
  diff_hash: `sha256:v1:${"a".repeat(64)}`,
  created_at: "2026-07-16T12:34:56.789Z",
};

function snapshotInput(
  status: "pass" | "warning" | "blocked" = "pass",
): BuildStageHistorySnapshotInput {
  return {
    safety_gate_result: { status },
  } as BuildStageHistorySnapshotInput;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("StageHistorySavePanel", () => {
  beforeEach(() => {
    stageHistoryMocks.buildStageHistorySaveInput.mockReset();
    stageHistoryMocks.saveStageHistoryScan.mockReset();
    stageHistoryMocks.buildStageHistorySaveInput.mockResolvedValue(builtInput);
    stageHistoryMocks.saveStageHistoryScan.mockResolvedValue(savedResult);
  });

  afterEach(cleanup);

  test("does not save on render", () => {
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );

    expect(stageHistoryMocks.buildStageHistorySaveInput).not.toHaveBeenCalled();
    expect(stageHistoryMocks.saveStageHistoryScan).not.toHaveBeenCalled();
  });

  test("missing evidence disables save and shows exact reasons", () => {
    const reasons = [
      "Stage Payload is not available.",
      "Safety Gate result is not available.",
    ];
    render(
      <StageHistorySavePanel snapshotInput={null} disabledReasons={reasons} />,
    );

    expect(
      screen.getByRole("button", { name: "Save to Stage History" }),
    ).toBeDisabled();
    expect(screen.getByText(reasons[0])).toBeInTheDocument();
    expect(screen.getByText(reasons[1])).toBeInTheDocument();
  });

  test("a blocked scan remains saveable", () => {
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput("blocked")}
        disabledReasons={[]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Save to Stage History" }),
    ).toBeEnabled();
    expect(
      screen.getByText(
        "A blocked Safety Gate result can still be saved locally. This does not approve or submit it.",
      ),
    ).toBeInTheDocument();
  });

  test("one click prepares one snapshot and makes one command call", async () => {
    const user = userEvent.setup();
    const input = snapshotInput();
    render(
      <StageHistorySavePanel snapshotInput={input} disabledReasons={[]} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Save to Stage History" }),
    );

    expect(stageHistoryMocks.buildStageHistorySaveInput).toHaveBeenCalledOnce();
    expect(stageHistoryMocks.buildStageHistorySaveInput).toHaveBeenCalledWith(
      input,
    );
    expect(stageHistoryMocks.saveStageHistoryScan).toHaveBeenCalledOnce();
    expect(stageHistoryMocks.saveStageHistoryScan).toHaveBeenCalledWith(
      builtInput,
    );
  });

  test("saving state prevents a second click", async () => {
    const user = userEvent.setup();
    const pending = deferred<SaveStageHistoryScanResult>();
    stageHistoryMocks.saveStageHistoryScan.mockReturnValue(pending.promise);
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Save to Stage History",
    });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Saving..." }));

    expect(stageHistoryMocks.saveStageHistoryScan).toHaveBeenCalledOnce();
    pending.resolve(savedResult);
    await screen.findByText(`Saved locally at ${savedResult.created_at}.`);
  });

  test("success confirms the save and allows another explicit save", async () => {
    const user = userEvent.setup();
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Save to Stage History",
    });
    await user.click(button);
    expect(
      await screen.findByText(`Saved locally at ${savedResult.created_at}.`),
    ).toBeInTheDocument();
    expect(button).toBeEnabled();

    await user.click(button);
    expect(stageHistoryMocks.buildStageHistorySaveInput).toHaveBeenCalledTimes(2);
    expect(stageHistoryMocks.saveStageHistoryScan).toHaveBeenCalledTimes(2);
  });

  test("blocked success preserves the blocked status wording", async () => {
    const user = userEvent.setup();
    stageHistoryMocks.buildStageHistorySaveInput.mockResolvedValue({
      ...builtInput,
      safety_gate_status: "blocked",
    });
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput("blocked")}
        disabledReasons={[]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Save to Stage History" }),
    );

    expect(
      await screen.findByText("Saved locally with Safety Gate status: blocked."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Saving history does not approve or submit this payload.",
      ),
    ).toBeInTheDocument();
  });

  test("duplicate scan IDs display a controlled error", async () => {
    const user = userEvent.setup();
    stageHistoryMocks.saveStageHistoryScan.mockRejectedValue({
      code: "duplicate_scan_id",
      message: "backend detail is not rendered",
    });
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Save to Stage History" }),
    );

    expect(
      await screen.findByText(
        "A unique history record could not be created. Try saving again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Current verification state is unchanged."),
    ).toBeInTheDocument();
  });

  test("generic command failures display a controlled error", async () => {
    const user = userEvent.setup();
    stageHistoryMocks.saveStageHistoryScan.mockRejectedValue(new Error("raw"));
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Save to Stage History" }),
    );

    expect(
      await screen.findByText("The scan could not be saved to Stage History."),
    ).toBeInTheDocument();
    expect(screen.queryByText("raw")).not.toBeInTheDocument();
  });

  test("local snapshot preparation failures are controlled", async () => {
    const user = userEvent.setup();
    stageHistoryMocks.buildStageHistorySaveInput.mockRejectedValue(
      new Error("unsafe detail"),
    );
    render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Save to Stage History" }),
    );

    expect(
      await screen.findByText(
        "A persistence-safe history snapshot could not be prepared.",
      ),
    ).toBeInTheDocument();
    expect(stageHistoryMocks.saveStageHistoryScan).not.toHaveBeenCalled();
  });

  test("changed evidence clears stale confirmation", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <StageHistorySavePanel
        snapshotInput={snapshotInput()}
        disabledReasons={[]}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Save to Stage History" }),
    );
    expect(
      await screen.findByText(`Saved locally at ${savedResult.created_at}.`),
    ).toBeInTheDocument();

    rerender(
      <StageHistorySavePanel
        snapshotInput={snapshotInput("warning")}
        disabledReasons={[]}
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByText(`Saved locally at ${savedResult.created_at}.`),
      ).not.toBeInTheDocument();
    });
  });
});
