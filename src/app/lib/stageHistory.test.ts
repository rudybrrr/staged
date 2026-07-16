import { describe, expect, expectTypeOf, test } from "vitest";

import type { RepoSummary } from "./repo";
import type { SafetyGateResult } from "./safetyGate";
import type { StageReport } from "./stageReport";
import type { TokenBudget } from "./tokenBudget";
import {
  buildStageHistorySaveInput,
  getStageHistorySaveDisabledReasons,
  normalizeRepositoryPath,
  type BuildStageHistorySnapshotInput,
  type StageHistorySnapshotRuntime,
} from "./stageHistory";

const ORIGINAL_SECRET = "sk-original-unredacted-value";

function redactedPayloadFixture() {
  return {
    schema_version: "stage-payload.v1",
    created_at: "2026-07-16T10:00:00.000Z",
    repo: {
      repo_path: "[LOCAL_PATH]rudhr/Documents/Projects/staged",
      repo_name: "staged",
      current_branch: "main",
      is_git_repo: true,
      has_uncommitted_changes: true,
    },
    changes: {
      changed_file_count: 2,
      status_counts: { modified: 1, untracked: 1 },
      files: [
        {
          file_path: "src/z.ts",
          old_file_path: null,
          status: "modified",
          is_staged: false,
          is_unstaged: true,
          is_untracked: false,
        },
        {
          file_path: "src/a.ts",
          old_file_path: null,
          status: "untracked",
          is_staged: false,
          is_unstaged: false,
          is_untracked: true,
        },
      ],
      selected_file: {
        file_path: "src/z.ts",
        old_file_path: null,
        status: "modified",
        is_staged: false,
        is_unstaged: true,
        is_untracked: false,
      },
      selected_file_diff: {
        file_path: "src/z.ts",
        diff: "+TOKEN=[REDACTED]",
      },
    },
    command_availability: [
      {
        command_id: "npm_test",
        label: "npm test",
        command: "npm test",
        available: true,
        unavailable_reason: null,
      },
    ],
    command_result: {
      command_id: "npm_test",
      command: "npm test",
      exit_code: 0,
      duration_ms: 42,
      success: true,
      stdout: "TOKEN=[REDACTED]",
      stderr: "",
    },
    command_error: null,
    screening_findings: [
      {
        id: "command-error",
        level: "fail",
        title: "Command error",
        detail: "TOKEN=[REDACTED]",
        source: "command_runner",
      },
    ],
    payload_completeness: {
      includes_selected_file_diff: true,
      selected_file_path: "src/z.ts",
      changed_files_without_diff_count: 1,
      untracked_files_without_content_count: 1,
      command_result_included: true,
      supported_commands_detected: 1,
      limitations: ["Some changed files are listed without diff content."],
    },
  };
}

function tokenBudgetFixture(): TokenBudget {
  return {
    estimator: "chars_div_4",
    estimator_note: "Approximate local estimate.",
    character_count: 400,
    byte_count: 400,
    estimated_tokens: 100,
    sections: [
      {
        name: "changes.selected_file_diff",
        character_count: 100,
        byte_count: 100,
        estimated_tokens: 25,
        percentage: 25,
      },
    ],
    warnings: [
      {
        id: "bounded-safety-gate-coverage",
        level: "warning",
        message: "Coverage is bounded.",
      },
    ],
  };
}

function safetyGateFixture(
  redactedPayload = redactedPayloadFixture(),
  status: SafetyGateResult["status"] = "blocked",
): SafetyGateResult {
  return {
    status,
    scanned_at: "2026-07-16T10:00:01.000Z",
    scanner: "mvp_pattern_scanner",
    scan_coverage: {
      stage_payload_json_scanned: true,
      selected_file_diff_included: true,
      selected_file_diff_scanned: true,
      selected_file_path: "src/z.ts",
      selected_file_diff_secret_findings_count: 1,
    },
    findings: [
      {
        id: "selected-file-diff-secret",
        level: "blocked",
        category: "secret",
        title: "Likely secret in selected file diff",
        detail: "The selected diff contains a likely secret assignment.",
        match_count: 1,
      },
    ],
    redacted_payload_preview: JSON.stringify(redactedPayload),
    redaction_count: 1,
    limitations: ["MVP pattern scanner only."],
  };
}

function reportFixture(): StageReport {
  return {
    schema_version: "stage-report.v1",
    generated_at: "2026-07-16T10:00:02.000Z",
    generation_mode: "local_preview",
    report_status: "preview_only",
    summary: {
      repo_name: "unsafe-original-name",
      branch: "unsafe-original-branch",
      changed_file_count: 999,
      selected_file_path: "unsafe/original.ts",
    },
    deterministic_evidence: {
      screening_findings: [
        {
          id: "unsafe-original",
          level: "fail",
          title: "Unsafe original finding",
          detail: ORIGINAL_SECRET,
          source: "command_runner",
        },
      ],
      command_result: {
        command_id: "npm_test",
        command: "npm test",
        exit_code: 0,
        duration_ms: 42,
        success: true,
      },
      safety_gate_status: "blocked",
      token_budget_estimated_tokens: 100,
      payload_limitations: [ORIGINAL_SECRET],
    },
    risk_findings: [
      {
        id: "safety-gate-blocked",
        level: "high",
        title: "Safety Gate is blocked",
        detail: "Resolve the blocked local finding.",
        source: "local_preview",
      },
    ],
    missing_evidence: ["No AI judgment has been generated."],
    human_review_checklist: ["Review changed files and selected diff."],
    recommendation: {
      decision: "do_not_submit",
      rationale: "Safety Gate is blocked.",
    },
  };
}

function repoFixture(): RepoSummary {
  return {
    repo_path: "C:\\Users\\rudhr\\Documents\\Projects\\staged\\",
    repo_name: "staged",
    is_git_repo: true,
    current_branch: "main",
    has_uncommitted_changes: true,
  };
}

function snapshotInput(
  safetyGateResult = safetyGateFixture(),
): BuildStageHistorySnapshotInput {
  return {
    repo: repoFixture(),
    redacted_payload_preview: safetyGateResult.redacted_payload_preview,
    token_budget: tokenBudgetFixture(),
    safety_gate_result: safetyGateResult,
    local_stage_report: reportFixture(),
  };
}

function runtimeFixture(
  uuid = "11111111-1111-4111-8111-111111111111",
): StageHistorySnapshotRuntime {
  return {
    randomUuid: () => uuid,
    now: () => new Date("2026-07-16T12:34:56.789Z"),
    sha256Hex: async (value) => {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(value),
      );

      return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    },
  };
}

describe("normalizeRepositoryPath", () => {
  test.each([
    ["C:\\", "C:/"],
    ["C:\\work\\staged\\", "C:/work/staged"],
    ["/", "/"],
    ["/work/staged/", "/work/staged"],
  ])("normalizes %s without removing filesystem roots", (input, expected) => {
    expect(normalizeRepositoryPath(input)).toBe(expected);
  });
});

describe("buildStageHistorySaveInput", () => {
  test("does not accept the original Stage Payload in its public input contract", () => {
    expectTypeOf<keyof BuildStageHistorySnapshotInput>().not.toEqualTypeOf<"stage_payload">();
  });

  test("constructs only the approved artifact fields from the redacted preview", async () => {
    const result = await buildStageHistorySaveInput(snapshotInput(), runtimeFixture());

    expect(Object.keys(result.artifacts).sort()).toEqual([
      "local_stage_report",
      "markdown_export",
      "pre_stage_screening_findings",
      "redacted_stage_payload",
      "safety_gate_result",
      "schema_version",
      "token_budget",
    ]);
    expect(result.artifacts.schema_version).toBe("stage-history-artifacts.v1");
    expect(result.artifacts.markdown_export).toBeNull();
    expect(JSON.stringify(result)).not.toContain(ORIGINAL_SECRET);
  });

  test("derives persisted screening and mirrored report fields from the redacted payload", async () => {
    const result = await buildStageHistorySaveInput(snapshotInput(), runtimeFixture());
    const redacted = redactedPayloadFixture();

    expect(result.artifacts.pre_stage_screening_findings).toEqual(
      redacted.screening_findings,
    );
    expect(result.artifacts.local_stage_report.summary).toEqual({
      repo_name: redacted.repo.repo_name,
      branch: redacted.repo.current_branch,
      changed_file_count: redacted.changes.changed_file_count,
      selected_file_path: redacted.payload_completeness.selected_file_path,
    });
    expect(
      result.artifacts.local_stage_report.deterministic_evidence.screening_findings,
    ).toEqual(redacted.screening_findings);
    expect(
      result.artifacts.local_stage_report.deterministic_evidence.payload_limitations,
    ).toEqual(redacted.payload_completeness.limitations);
  });

  test("constructs a Safety Gate summary without the redacted preview or injected raw fields", async () => {
    const safetyGate = safetyGateFixture() as SafetyGateResult & {
      raw_match: string;
    };
    safetyGate.raw_match = ORIGINAL_SECRET;

    const result = await buildStageHistorySaveInput(
      snapshotInput(safetyGate),
      runtimeFixture(),
    );

    expect(result.artifacts.safety_gate_result).not.toHaveProperty(
      "redacted_payload_preview",
    );
    expect(result.artifacts.safety_gate_result).not.toHaveProperty("raw_match");
    expect(JSON.stringify(result.artifacts.safety_gate_result)).not.toContain(
      ORIGINAL_SECRET,
    );
  });

  test("rejects empty, malformed, and unsupported redacted previews", async () => {
    for (const preview of ["", "not-json", JSON.stringify({ schema_version: "stage-payload.v2" })]) {
      const input = snapshotInput();
      input.redacted_payload_preview = preview;

      await expect(
        buildStageHistorySaveInput(input, runtimeFixture()),
      ).rejects.toThrow("redacted Stage Payload preview");
    }
  });

  test("rejects prohibited raw-match-style keys in the redacted payload", async () => {
    const payload = redactedPayloadFixture() as ReturnType<
      typeof redactedPayloadFixture
    > & { raw_match: string };
    payload.raw_match = ORIGINAL_SECRET;
    const safetyGate = safetyGateFixture(payload);

    await expect(
      buildStageHistorySaveInput(snapshotInput(safetyGate), runtimeFixture()),
    ).rejects.toThrow("prohibited persistence field");
  });

  test("generates the required scan ID and canonical UTC save timestamp", async () => {
    const result = await buildStageHistorySaveInput(snapshotInput(), runtimeFixture());

    expect(result.scan_id).toBe(
      "scan_11111111-1111-4111-8111-111111111111",
    );
    expect(result.created_at).toBe("2026-07-16T12:34:56.789Z");
  });

  test("captures the scan ID and save timestamp before asynchronous hashing", async () => {
    const calls: string[] = [];
    const runtime = runtimeFixture();
    runtime.randomUuid = () => {
      calls.push("scan_id");
      return "11111111-1111-4111-8111-111111111111";
    };
    runtime.now = () => {
      calls.push("created_at");
      return new Date("2026-07-16T12:34:56.789Z");
    };
    runtime.sha256Hex = async () => {
      calls.push("hash");
      return "a".repeat(64);
    };

    await buildStageHistorySaveInput(snapshotInput(), runtime);

    expect(calls).toEqual(["scan_id", "created_at", "hash"]);
  });

  test("generates a new scan ID for each explicit snapshot build", async () => {
    const uuids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ];
    const runtime = runtimeFixture();
    runtime.randomUuid = () => uuids.shift() ?? "unexpected";

    const first = await buildStageHistorySaveInput(snapshotInput(), runtime);
    const second = await buildStageHistorySaveInput(snapshotInput(), runtime);

    expect(first.scan_id).not.toBe(second.scan_id);
  });

  test("produces the same bounded diff hash when file order changes", async () => {
    const original = snapshotInput();
    const reorderedPayload = redactedPayloadFixture();
    reorderedPayload.changes.files.reverse();
    const reordered = snapshotInput(safetyGateFixture(reorderedPayload));

    const first = await buildStageHistorySaveInput(original, runtimeFixture());
    const second = await buildStageHistorySaveInput(reordered, runtimeFixture());

    expect(first.diff_hash).toMatch(/^sha256:v1:[0-9a-f]{64}$/u);
    expect(second.diff_hash).toBe(first.diff_hash);
  });

  test("uses every included metadata field as a deterministic sort tiebreaker", async () => {
    const firstPayload = redactedPayloadFixture();
    const firstFile = firstPayload.changes.files[0];
    const secondFile = {
      ...firstFile,
      is_staged: true,
      is_unstaged: false,
    };
    firstPayload.changes.files = [firstFile, secondFile];

    const secondPayload = redactedPayloadFixture();
    secondPayload.changes.files = [secondFile, firstFile];

    const first = await buildStageHistorySaveInput(
      snapshotInput(safetyGateFixture(firstPayload)),
      runtimeFixture(),
    );
    const second = await buildStageHistorySaveInput(
      snapshotInput(safetyGateFixture(secondPayload)),
      runtimeFixture(),
    );

    expect(second.diff_hash).toBe(first.diff_hash);
  });

  test("changes the bounded diff hash when the selected redacted diff changes", async () => {
    const changedPayload = redactedPayloadFixture();
    if (changedPayload.changes.selected_file_diff) {
      changedPayload.changes.selected_file_diff.diff = "+TOKEN=[REDACTED-CHANGED]";
    }

    const first = await buildStageHistorySaveInput(snapshotInput(), runtimeFixture());
    const second = await buildStageHistorySaveInput(
      snapshotInput(safetyGateFixture(changedPayload)),
      runtimeFixture(),
    );

    expect(second.diff_hash).not.toBe(first.diff_hash);
  });

  test("excludes command-run evidence from the bounded diff hash", async () => {
    const changedPayload = redactedPayloadFixture();
    if (changedPayload.command_result) {
      changedPayload.command_result.exit_code = 1;
      changedPayload.command_result.duration_ms = 9999;
      changedPayload.command_result.success = false;
      changedPayload.command_result.stdout = "different redacted output";
    }

    const first = await buildStageHistorySaveInput(snapshotInput(), runtimeFixture());
    const second = await buildStageHistorySaveInput(
      snapshotInput(safetyGateFixture(changedPayload)),
      runtimeFixture(),
    );

    expect(second.diff_hash).toBe(first.diff_hash);
  });

  test("allows a blocked Safety Gate snapshot", async () => {
    const result = await buildStageHistorySaveInput(snapshotInput(), runtimeFixture());

    expect(result.safety_gate_status).toBe("blocked");
    expect(result.artifacts.safety_gate_result.status).toBe("blocked");
  });
});

describe("getStageHistorySaveDisabledReasons", () => {
  test("requires stable completed evidence but does not require a selected diff or command result", () => {
    const reasons = getStageHistorySaveDisabledReasons({
      has_valid_repo: true,
      has_stage_payload: true,
      token_budget: tokenBudgetFixture(),
      safety_gate_result: safetyGateFixture(),
      local_stage_report: reportFixture(),
      is_inspecting_repo: false,
      is_loading_changed_files: false,
      is_loading_diff: false,
      is_loading_commands: false,
      is_running_command: false,
    });

    expect(reasons).toEqual([]);
  });

  test("returns exact reasons for missing and in-progress evidence", () => {
    const reasons = getStageHistorySaveDisabledReasons({
      has_valid_repo: false,
      has_stage_payload: false,
      token_budget: null,
      safety_gate_result: null,
      local_stage_report: null,
      is_inspecting_repo: true,
      is_loading_changed_files: true,
      is_loading_diff: true,
      is_loading_commands: true,
      is_running_command: true,
    });

    expect(reasons).toEqual([
      "Select a valid Git repository.",
      "Wait for repository inspection to finish.",
      "Wait for changed files to finish loading.",
      "Wait for the selected diff to finish loading.",
      "Wait for command availability to finish loading.",
      "Wait for the local command to finish.",
      "Stage Payload is not available.",
      "Token Budget is not available.",
      "Safety Gate result is not available.",
      "Local Stage Report is not available.",
    ]);
  });

  test("reports an invalid redacted preview without blocking a valid blocked result", () => {
    const safetyGate = safetyGateFixture();
    safetyGate.redacted_payload_preview = "not-json";

    expect(
      getStageHistorySaveDisabledReasons({
        has_valid_repo: true,
        has_stage_payload: true,
        token_budget: tokenBudgetFixture(),
        safety_gate_result: safetyGate,
        local_stage_report: reportFixture(),
        is_inspecting_repo: false,
        is_loading_changed_files: false,
        is_loading_diff: false,
        is_loading_commands: false,
        is_running_command: false,
      }),
    ).toEqual(["Redacted payload preview is invalid. Refresh the evidence."]);
  });
});
