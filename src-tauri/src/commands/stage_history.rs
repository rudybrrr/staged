use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::infra::stage_history::{
    NewStageHistoryRecord, RecommendationDecision, ReportGenerationMode, ReportStatus,
    SafetyGateStatus, StageHistoryArtifactsV1, StageHistoryError, StageHistoryStore,
};

const INVALID_INPUT_MESSAGE: &str =
    "Current verification evidence could not be validated. Refresh and try again.";
const DUPLICATE_SCAN_ID_MESSAGE: &str =
    "A unique history record could not be created. Try saving again.";
const STORAGE_UNAVAILABLE_MESSAGE: &str = "Stage History storage is unavailable.";
const SAVE_FAILED_MESSAGE: &str = "The scan could not be saved to Stage History.";

const MAX_REPO_PATH_LENGTH: usize = 4096;
const MAX_REPO_NAME_LENGTH: usize = 255;
const MAX_BRANCH_LENGTH: usize = 1024;
const MAX_SELECTED_FILE_PATH_LENGTH: usize = 4096;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SaveStageHistoryScanInput {
    pub scan_id: String,
    pub repo_path: String,
    pub repo_name: String,
    pub branch: Option<String>,
    pub diff_hash: String,
    pub created_at: String,
    pub changed_file_count: i64,
    pub selected_file_path: Option<String>,
    pub safety_gate_status: SafetyGateStatus,
    pub estimated_tokens: i64,
    pub report_generation_mode: ReportGenerationMode,
    pub report_status: ReportStatus,
    pub recommendation_decision: RecommendationDecision,
    pub artifacts: StageHistoryArtifactsV1,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SaveStageHistoryScanResult {
    pub scan_id: String,
    pub diff_hash: String,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "code", rename_all = "snake_case")]
pub enum SaveStageHistoryScanError {
    InvalidInput { message: String },
    DuplicateScanId { message: String },
    StorageUnavailable { message: String },
    SaveFailed { message: String },
}

impl SaveStageHistoryScanError {
    fn invalid_input() -> Self {
        Self::InvalidInput {
            message: INVALID_INPUT_MESSAGE.to_string(),
        }
    }
}

#[tauri::command]
pub fn save_stage_history_scan(
    input: SaveStageHistoryScanInput,
    store: State<'_, StageHistoryStore>,
) -> Result<SaveStageHistoryScanResult, SaveStageHistoryScanError> {
    save_stage_history_scan_with_store(&store, input)
}

fn save_stage_history_scan_with_store(
    store: &StageHistoryStore,
    input: SaveStageHistoryScanInput,
) -> Result<SaveStageHistoryScanResult, SaveStageHistoryScanError> {
    validate_input(&input)?;

    let result = SaveStageHistoryScanResult {
        scan_id: input.scan_id.clone(),
        diff_hash: input.diff_hash.clone(),
        created_at: input.created_at.clone(),
    };
    let record = NewStageHistoryRecord {
        scan_id: input.scan_id,
        repo_path: input.repo_path,
        repo_name: input.repo_name,
        branch: input.branch,
        diff_hash: input.diff_hash,
        created_at: input.created_at,
        changed_file_count: input.changed_file_count,
        selected_file_path: input.selected_file_path,
        safety_gate_status: input.safety_gate_status,
        estimated_tokens: Some(input.estimated_tokens),
        report_generation_mode: input.report_generation_mode,
        report_status: input.report_status,
        recommendation_decision: input.recommendation_decision,
        artifacts: input.artifacts,
    };

    store.save_scan(&record).map_err(map_storage_error)?;
    Ok(result)
}

fn validate_input(input: &SaveStageHistoryScanInput) -> Result<(), SaveStageHistoryScanError> {
    let invalid = SaveStageHistoryScanError::invalid_input;

    if !is_scan_id(&input.scan_id)
        || !is_diff_hash(&input.diff_hash)
        || !is_canonical_utc_shape(&input.created_at)
        || !is_bounded_non_empty(&input.repo_path, MAX_REPO_PATH_LENGTH)
        || !is_bounded_non_empty(&input.repo_name, MAX_REPO_NAME_LENGTH)
        || !is_optional_bounded_non_empty(input.branch.as_deref(), MAX_BRANCH_LENGTH)
        || !is_optional_bounded_non_empty(
            input.selected_file_path.as_deref(),
            MAX_SELECTED_FILE_PATH_LENGTH,
        )
        || input.changed_file_count < 0
        || input.estimated_tokens < 0
        || input.report_generation_mode != ReportGenerationMode::LocalPreview
        || input.report_status != ReportStatus::PreviewOnly
        || input.artifacts.markdown_export.is_some()
    {
        return Err(invalid());
    }

    let artifacts_value = serde_json::to_value(&input.artifacts).map_err(|_| invalid())?;
    // This is defense in depth for clearly prohibited structures. It is not a
    // secret scanner and does not prove that arbitrary JSON is secret-free.
    if contains_prohibited_key(&artifacts_value) {
        return Err(invalid());
    }

    let payload = object(&input.artifacts.redacted_stage_payload)?;
    let token_budget = object(&input.artifacts.token_budget)?;
    let safety_gate = object(&input.artifacts.safety_gate_result)?;
    let report = object(&input.artifacts.local_stage_report)?;

    if string_field(payload, "schema_version") != Some("stage-payload.v1")
        || string_field(report, "schema_version") != Some("stage-report.v1")
        || !has_only_safety_gate_fields(safety_gate)
    {
        return Err(invalid());
    }

    let changed_file_count = nested_i64(
        &input.artifacts.redacted_stage_payload,
        &["changes", "changed_file_count"],
    );
    let selected_file_path = nested_optional_string(
        &input.artifacts.redacted_stage_payload,
        &["payload_completeness", "selected_file_path"],
    )?;
    let safety_status = string_field(safety_gate, "status");
    let estimated_tokens = token_budget.get("estimated_tokens").and_then(Value::as_i64);
    let report_generation_mode = string_field(report, "generation_mode");
    let report_status = string_field(report, "report_status");
    let recommendation_decision = nested_string(
        &input.artifacts.local_stage_report,
        &["recommendation", "decision"],
    );
    let serialized_safety_status = enum_string(input.safety_gate_status)?;
    let serialized_generation_mode = enum_string(input.report_generation_mode)?;
    let serialized_report_status = enum_string(input.report_status)?;
    let serialized_recommendation = enum_string(input.recommendation_decision)?;

    if changed_file_count != Some(input.changed_file_count)
        || selected_file_path.as_deref() != input.selected_file_path.as_deref()
        || safety_status != Some(serialized_safety_status.as_str())
        || estimated_tokens != Some(input.estimated_tokens)
        || report_generation_mode != Some(serialized_generation_mode.as_str())
        || report_status != Some(serialized_report_status.as_str())
        || recommendation_decision != Some(serialized_recommendation.as_str())
    {
        return Err(invalid());
    }

    let payload_screening = input
        .artifacts
        .redacted_stage_payload
        .get("screening_findings")
        .and_then(Value::as_array)
        .ok_or_else(invalid)?;
    if payload_screening != &input.artifacts.pre_stage_screening_findings {
        return Err(invalid());
    }

    let report_screening = input
        .artifacts
        .local_stage_report
        .pointer("/deterministic_evidence/screening_findings")
        .and_then(Value::as_array)
        .ok_or_else(invalid)?;
    if report_screening != payload_screening {
        return Err(invalid());
    }

    Ok(())
}

fn object(value: &Value) -> Result<&serde_json::Map<String, Value>, SaveStageHistoryScanError> {
    value
        .as_object()
        .ok_or_else(SaveStageHistoryScanError::invalid_input)
}

fn string_field<'a>(object: &'a serde_json::Map<String, Value>, field: &str) -> Option<&'a str> {
    object.get(field).and_then(Value::as_str)
}

fn nested_i64(value: &Value, path: &[&str]) -> Option<i64> {
    path.iter()
        .try_fold(value, |current, segment| current.get(*segment))
        .and_then(Value::as_i64)
}

fn nested_string<'a>(value: &'a Value, path: &[&str]) -> Option<&'a str> {
    path.iter()
        .try_fold(value, |current, segment| current.get(*segment))
        .and_then(Value::as_str)
}

fn nested_optional_string(
    value: &Value,
    path: &[&str],
) -> Result<Option<String>, SaveStageHistoryScanError> {
    let value = path
        .iter()
        .try_fold(value, |current, segment| current.get(*segment))
        .ok_or_else(SaveStageHistoryScanError::invalid_input)?;
    match value {
        Value::Null => Ok(None),
        Value::String(value) => Ok(Some(value.clone())),
        _ => Err(SaveStageHistoryScanError::invalid_input()),
    }
}

fn enum_string<T: Serialize>(value: T) -> Result<String, SaveStageHistoryScanError> {
    serde_json::to_value(value)
        .ok()
        .and_then(|value| value.as_str().map(str::to_string))
        .ok_or_else(SaveStageHistoryScanError::invalid_input)
}

fn has_only_safety_gate_fields(object: &serde_json::Map<String, Value>) -> bool {
    const REQUIRED_FIELDS: [&str; 7] = [
        "status",
        "scanned_at",
        "scanner",
        "scan_coverage",
        "findings",
        "redaction_count",
        "limitations",
    ];

    object.len() == REQUIRED_FIELDS.len()
        && REQUIRED_FIELDS
            .iter()
            .all(|field| object.contains_key(*field))
}

fn contains_prohibited_key(value: &Value) -> bool {
    const PROHIBITED_KEYS: [&str; 14] = [
        "original_stage_payload",
        "unredacted_stage_payload",
        "raw_match",
        "raw_matches",
        "matched_text",
        "matched_value",
        "secret_value",
        "raw_secret_values",
        "api_keys",
        "provider_secret_values",
        "environment_variable_values",
        "provider_readiness",
        "repository_contents",
        "redacted_payload_preview",
    ];

    match value {
        Value::Object(object) => object.iter().any(|(key, child)| {
            PROHIBITED_KEYS.contains(&key.as_str()) || contains_prohibited_key(child)
        }),
        Value::Array(values) => values.iter().any(contains_prohibited_key),
        _ => false,
    }
}

fn is_bounded_non_empty(value: &str, max_length: usize) -> bool {
    !value.trim().is_empty() && value.len() <= max_length
}

fn is_optional_bounded_non_empty(value: Option<&str>, max_length: usize) -> bool {
    value.is_none_or(|value| is_bounded_non_empty(value, max_length))
}

fn is_scan_id(value: &str) -> bool {
    let Some(uuid) = value.strip_prefix("scan_") else {
        return false;
    };
    if uuid.len() != 36 {
        return false;
    }

    uuid.bytes().enumerate().all(|(index, byte)| match index {
        8 | 13 | 18 | 23 => byte == b'-',
        14 => byte == b'4',
        19 => matches!(byte, b'8' | b'9' | b'a' | b'b'),
        _ => byte.is_ascii_digit() || matches!(byte, b'a'..=b'f'),
    })
}

fn is_diff_hash(value: &str) -> bool {
    value.strip_prefix("sha256:v1:").is_some_and(|hash| {
        hash.len() == 64
            && hash
                .bytes()
                .all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
    })
}

fn is_canonical_utc_shape(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 24 {
        return false;
    }

    bytes.iter().enumerate().all(|(index, byte)| match index {
        4 | 7 => *byte == b'-',
        10 => *byte == b'T',
        13 | 16 => *byte == b':',
        19 => *byte == b'.',
        23 => *byte == b'Z',
        _ => byte.is_ascii_digit(),
    })
}

fn map_storage_error(error: StageHistoryError) -> SaveStageHistoryScanError {
    match error {
        StageHistoryError::DuplicateScanId { .. } => SaveStageHistoryScanError::DuplicateScanId {
            message: DUPLICATE_SCAN_ID_MESSAGE.to_string(),
        },
        StageHistoryError::ConnectionMutexPoisoned => {
            SaveStageHistoryScanError::StorageUnavailable {
                message: STORAGE_UNAVAILABLE_MESSAGE.to_string(),
            }
        }
        _ => SaveStageHistoryScanError::SaveFailed {
            message: SAVE_FAILED_MESSAGE.to_string(),
        },
    }
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Value};
    use tempfile::TempDir;

    use crate::infra::stage_history::{
        ArtifactSchemaVersion, RecommendationDecision, ReportGenerationMode, ReportStatus,
        SafetyGateStatus, StageHistoryArtifactsV1, StageHistoryError, StageHistoryStore,
    };

    use super::{
        save_stage_history_scan_with_store, SaveStageHistoryScanError, SaveStageHistoryScanInput,
    };

    fn temporary_store() -> (TempDir, StageHistoryStore) {
        let directory = tempfile::tempdir().expect("temporary directory");
        let store = StageHistoryStore::open(directory.path().join("stage-history.sqlite3"))
            .expect("store opens");
        (directory, store)
    }

    fn screening_findings() -> Vec<Value> {
        vec![json!({
            "id": "repo-valid",
            "level": "pass",
            "title": "Valid Git repository selected",
            "detail": "staged is available on main.",
            "source": "repo"
        })]
    }

    fn artifacts_fixture(status: &str) -> StageHistoryArtifactsV1 {
        let recommendation = if status == "blocked" {
            "do_not_submit"
        } else {
            "review_manually"
        };
        let findings = screening_findings();

        StageHistoryArtifactsV1 {
            schema_version: ArtifactSchemaVersion::V1,
            redacted_stage_payload: json!({
                "schema_version": "stage-payload.v1",
                "changes": {
                    "changed_file_count": 2,
                    "files": [
                        {
                            "file_path": "src/main.ts",
                            "old_file_path": null,
                            "status": "modified",
                            "is_staged": false,
                            "is_unstaged": true,
                            "is_untracked": false
                        },
                        {
                            "file_path": "README.md",
                            "old_file_path": null,
                            "status": "modified",
                            "is_staged": true,
                            "is_unstaged": false,
                            "is_untracked": false
                        }
                    ],
                    "selected_file": {
                        "file_path": "src/main.ts",
                        "old_file_path": null,
                        "status": "modified",
                        "is_staged": false,
                        "is_unstaged": true,
                        "is_untracked": false
                    },
                    "selected_file_diff": {
                        "file_path": "src/main.ts",
                        "diff": "+TOKEN=[REDACTED]"
                    }
                },
                "screening_findings": findings,
                "payload_completeness": {
                    "selected_file_path": "src/main.ts"
                }
            }),
            token_budget: json!({
                "estimated_tokens": 100
            }),
            pre_stage_screening_findings: screening_findings(),
            safety_gate_result: json!({
                "status": status,
                "scanned_at": "2026-07-16T10:00:01.000Z",
                "scanner": "mvp_pattern_scanner",
                "scan_coverage": {
                    "stage_payload_json_scanned": true,
                    "selected_file_diff_included": true,
                    "selected_file_diff_scanned": true,
                    "selected_file_path": "src/main.ts",
                    "selected_file_diff_secret_findings_count": if status == "blocked" { 1 } else { 0 }
                },
                "findings": [],
                "redaction_count": if status == "blocked" { 1 } else { 0 },
                "limitations": ["MVP pattern scanner only."]
            }),
            local_stage_report: json!({
                "schema_version": "stage-report.v1",
                "generation_mode": "local_preview",
                "report_status": "preview_only",
                "summary": {
                    "repo_name": "staged",
                    "branch": "main",
                    "changed_file_count": 2,
                    "selected_file_path": "src/main.ts"
                },
                "deterministic_evidence": {
                    "screening_findings": screening_findings(),
                    "safety_gate_status": status,
                    "token_budget_estimated_tokens": 100
                },
                "recommendation": {
                    "decision": recommendation,
                    "rationale": "Local-only recommendation."
                }
            }),
            markdown_export: None,
        }
    }

    fn input_fixture(status: SafetyGateStatus) -> SaveStageHistoryScanInput {
        let is_blocked = status == SafetyGateStatus::Blocked;

        SaveStageHistoryScanInput {
            scan_id: "scan_11111111-1111-4111-8111-111111111111".to_string(),
            repo_path: "C:/Users/rudhr/Documents/Projects/staged".to_string(),
            repo_name: "staged".to_string(),
            branch: Some("main".to_string()),
            diff_hash: format!("sha256:v1:{}", "a".repeat(64)),
            created_at: "2026-07-16T12:34:56.789Z".to_string(),
            changed_file_count: 2,
            selected_file_path: Some("src/main.ts".to_string()),
            safety_gate_status: status,
            estimated_tokens: 100,
            report_generation_mode: ReportGenerationMode::LocalPreview,
            report_status: ReportStatus::PreviewOnly,
            recommendation_decision: if is_blocked {
                RecommendationDecision::DoNotSubmit
            } else {
                RecommendationDecision::ReviewManually
            },
            artifacts: artifacts_fixture(if is_blocked { "blocked" } else { "pass" }),
        }
    }

    fn assert_invalid(input: SaveStageHistoryScanInput) {
        let (_directory, store) = temporary_store();
        let error = save_stage_history_scan_with_store(&store, input)
            .expect_err("invalid input must be rejected");

        assert!(matches!(
            error,
            SaveStageHistoryScanError::InvalidInput { .. }
        ));
    }

    #[test]
    fn valid_scan_saves_and_returns_safe_metadata() {
        let (_directory, store) = temporary_store();
        let input = input_fixture(SafetyGateStatus::Pass);

        let result = save_stage_history_scan_with_store(&store, input).expect("scan saves");
        let stored = store
            .read_scan(&result.scan_id)
            .expect("scan reads")
            .expect("scan exists");

        assert_eq!(result.scan_id, "scan_11111111-1111-4111-8111-111111111111");
        assert_eq!(result.diff_hash, format!("sha256:v1:{}", "a".repeat(64)));
        assert_eq!(result.created_at, "2026-07-16T12:34:56.789Z");
        assert_eq!(stored.safety_gate_status, SafetyGateStatus::Pass);
        assert_eq!(stored.artifacts.markdown_export, None);
    }

    #[test]
    fn blocked_scan_can_be_saved_locally() {
        let (_directory, store) = temporary_store();
        let input = input_fixture(SafetyGateStatus::Blocked);

        let result = save_stage_history_scan_with_store(&store, input).expect("blocked scan saves");
        let stored = store
            .read_scan(&result.scan_id)
            .expect("scan reads")
            .expect("scan exists");

        assert_eq!(stored.safety_gate_status, SafetyGateStatus::Blocked);
        assert_eq!(
            stored.recommendation_decision,
            RecommendationDecision::DoNotSubmit
        );
    }

    #[test]
    fn malformed_identifiers_and_timestamp_shape_are_rejected() {
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.scan_id = "scan_not-a-uuid".to_string();
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.diff_hash = "sha256:v1:not-a-hash".to_string();
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.created_at = "2026-07-16 12:34:56Z".to_string();
        assert_invalid(input);
    }

    #[test]
    fn timestamp_validation_is_intentionally_shape_only() {
        let (_directory, store) = temporary_store();
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.created_at = "9999-99-99T99:99:99.999Z".to_string();

        save_stage_history_scan_with_store(&store, input)
            .expect("canonical shape is accepted without claiming calendar validation");
    }

    #[test]
    fn unsupported_and_unknown_serialized_fields_are_rejected() {
        let mut serialized =
            serde_json::to_value(input_fixture(SafetyGateStatus::Pass)).expect("input serializes");
        serialized["unexpected"] = json!(true);
        assert!(serde_json::from_value::<SaveStageHistoryScanInput>(serialized).is_err());

        let mut serialized =
            serde_json::to_value(input_fixture(SafetyGateStatus::Pass)).expect("input serializes");
        serialized["artifacts"]["unexpected"] = json!(true);
        assert!(serde_json::from_value::<SaveStageHistoryScanInput>(serialized).is_err());

        let mut serialized =
            serde_json::to_value(input_fixture(SafetyGateStatus::Pass)).expect("input serializes");
        serialized["artifacts"]["schema_version"] = json!("stage-history-artifacts.v2");
        assert!(serde_json::from_value::<SaveStageHistoryScanInput>(serialized).is_err());
    }

    #[test]
    fn negative_counts_are_rejected() {
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.changed_file_count = -1;
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.estimated_tokens = -1;
        assert_invalid(input);
    }

    #[test]
    fn every_metadata_cross_field_mismatch_is_rejected() {
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.changed_file_count = 3;
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.selected_file_path = Some("other.ts".to_string());
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.safety_gate_status = SafetyGateStatus::Warning;
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.estimated_tokens = 101;
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.report_generation_mode = ReportGenerationMode::AiGenerated;
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.report_status = ReportStatus::Complete;
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.recommendation_decision = RecommendationDecision::ReadyForFutureAiReview;
        assert_invalid(input);
    }

    #[test]
    fn screening_findings_must_match_the_redacted_payload() {
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.artifacts.pre_stage_screening_findings = vec![];

        assert_invalid(input);
    }

    #[test]
    fn safety_snapshot_rejects_redacted_preview_and_unknown_fields() {
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.artifacts.safety_gate_result["redacted_payload_preview"] = json!("not allowed");
        assert_invalid(input);

        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.artifacts.safety_gate_result["raw_match"] = json!("not allowed");
        assert_invalid(input);
    }

    #[test]
    fn prohibited_nested_keys_are_rejected_as_defense_in_depth() {
        let mut input = input_fixture(SafetyGateStatus::Pass);
        input.artifacts.redacted_stage_payload["nested"] = json!({
            "provider_readiness": { "source": "OPENAI_API_KEY" }
        });

        assert_invalid(input);
    }

    #[test]
    fn duplicate_scan_id_maps_to_a_controlled_error_without_replacing_data() {
        let (_directory, store) = temporary_store();
        let input = input_fixture(SafetyGateStatus::Pass);
        save_stage_history_scan_with_store(&store, input.clone()).expect("first scan saves");

        let error = save_stage_history_scan_with_store(&store, input)
            .expect_err("duplicate scan ID is rejected");

        assert_eq!(
            serde_json::to_value(error).expect("error serializes"),
            json!({
                "code": "duplicate_scan_id",
                "message": "A unique history record could not be created. Try saving again."
            })
        );
    }

    #[test]
    fn error_payloads_are_structured_and_user_safe() {
        let errors = [
            SaveStageHistoryScanError::InvalidInput {
                message:
                    "Current verification evidence could not be validated. Refresh and try again."
                        .to_string(),
            },
            SaveStageHistoryScanError::DuplicateScanId {
                message: "A unique history record could not be created. Try saving again."
                    .to_string(),
            },
            SaveStageHistoryScanError::StorageUnavailable {
                message: "Stage History storage is unavailable.".to_string(),
            },
            SaveStageHistoryScanError::SaveFailed {
                message: "The scan could not be saved to Stage History.".to_string(),
            },
        ];

        for error in errors {
            let serialized = serde_json::to_string(&error).expect("error serializes");
            assert!(!serialized.contains("sqlite"));
            assert!(!serialized.contains("stage-history.sqlite3"));
            assert!(!serialized.contains("SELECT"));
            assert!(!serialized.contains("artifacts_json"));
        }

        let duplicate = StageHistoryError::DuplicateScanId {
            scan_id: "scan_private_identifier".to_string(),
        };
        let mapped = super::map_storage_error(duplicate);
        let serialized = serde_json::to_string(&mapped).expect("mapped error serializes");
        assert!(!serialized.contains("scan_private_identifier"));
    }
}
