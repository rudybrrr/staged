use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ArtifactSchemaVersion {
    #[serde(rename = "stage-history-artifacts.v1")]
    V1,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SafetyGateStatus {
    Pass,
    Warning,
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReportGenerationMode {
    LocalPreview,
    AiGenerated,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReportStatus {
    PreviewOnly,
    Complete,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RecommendationDecision {
    ReviewManually,
    DoNotSubmit,
    ReadyForFutureAiReview,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StageHistoryArtifactsV1 {
    pub schema_version: ArtifactSchemaVersion,
    pub redacted_stage_payload: Value,
    pub token_budget: Value,
    pub pre_stage_screening_findings: Vec<Value>,
    pub safety_gate_result: Value,
    pub local_stage_report: Value,
    pub markdown_export: Option<String>,
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Value};

    use super::{
        ArtifactSchemaVersion, RecommendationDecision, ReportGenerationMode, ReportStatus,
        SafetyGateStatus, StageHistoryArtifactsV1,
    };

    fn artifact_fixture(markdown_export: Option<&str>) -> StageHistoryArtifactsV1 {
        StageHistoryArtifactsV1 {
            schema_version: ArtifactSchemaVersion::V1,
            redacted_stage_payload: json!({"api_key": "[REDACTED]"}),
            token_budget: json!({"estimated_tokens": 42}),
            pre_stage_screening_findings: vec![json!({"id": "repo-valid"})],
            safety_gate_result: json!({"status": "pass"}),
            local_stage_report: json!({"schema_version": "stage-report.v1"}),
            markdown_export: markdown_export.map(str::to_owned),
        }
    }

    #[test]
    fn artifact_v1_uses_the_exact_schema_identifier() {
        let serialized = serde_json::to_value(artifact_fixture(None)).expect("serializes");

        assert_eq!(
            serialized["schema_version"],
            Value::String("stage-history-artifacts.v1".to_string())
        );
    }

    #[test]
    fn artifact_v1_round_trips_through_json() {
        let artifacts = artifact_fixture(Some("# Stage Report"));

        let serialized = serde_json::to_string(&artifacts).expect("serializes");
        let deserialized: StageHistoryArtifactsV1 =
            serde_json::from_str(&serialized).expect("deserializes");

        assert_eq!(deserialized, artifacts);
    }

    #[test]
    fn artifact_v1_has_only_the_expected_top_level_keys() {
        let serialized = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        let mut keys = serialized
            .as_object()
            .expect("artifact is an object")
            .keys()
            .map(String::as_str)
            .collect::<Vec<_>>();
        keys.sort_unstable();

        assert_eq!(
            keys,
            vec![
                "local_stage_report",
                "markdown_export",
                "pre_stage_screening_findings",
                "redacted_stage_payload",
                "safety_gate_result",
                "schema_version",
                "token_budget",
            ]
        );
    }

    #[test]
    fn artifact_v1_supports_an_optional_markdown_export() {
        let without_markdown = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        let with_markdown =
            serde_json::to_value(artifact_fixture(Some("# Stage Report"))).expect("serializes");

        assert!(without_markdown["markdown_export"].is_null());
        assert_eq!(with_markdown["markdown_export"], "# Stage Report");
    }

    #[test]
    fn artifact_v1_rejects_an_unsupported_embedded_schema() {
        let mut serialized = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        serialized["schema_version"] = json!("stage-history-artifacts.v2");

        let error = serde_json::from_value::<StageHistoryArtifactsV1>(serialized)
            .expect_err("unsupported schema must fail");

        assert!(error.to_string().contains("stage-history-artifacts.v1"));
    }

    #[test]
    fn artifact_v1_rejects_unknown_top_level_fields() {
        let mut serialized = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        serialized["original_stage_payload"] = json!({"secret": "raw"});

        let error = serde_json::from_value::<StageHistoryArtifactsV1>(serialized)
            .expect_err("unknown field must fail");

        assert!(error.to_string().contains("unknown field"));
    }

    #[test]
    fn status_values_match_the_frontend_contracts() {
        assert_eq!(
            serde_json::to_value(SafetyGateStatus::Pass).unwrap(),
            "pass"
        );
        assert_eq!(
            serde_json::to_value(SafetyGateStatus::Warning).unwrap(),
            "warning"
        );
        assert_eq!(
            serde_json::to_value(SafetyGateStatus::Blocked).unwrap(),
            "blocked"
        );
        assert_eq!(
            serde_json::to_value(ReportGenerationMode::LocalPreview).unwrap(),
            "local_preview"
        );
        assert_eq!(
            serde_json::to_value(ReportGenerationMode::AiGenerated).unwrap(),
            "ai_generated"
        );
        assert_eq!(
            serde_json::to_value(ReportStatus::PreviewOnly).unwrap(),
            "preview_only"
        );
        assert_eq!(
            serde_json::to_value(ReportStatus::Complete).unwrap(),
            "complete"
        );
        assert_eq!(
            serde_json::to_value(RecommendationDecision::ReviewManually).unwrap(),
            "review_manually"
        );
        assert_eq!(
            serde_json::to_value(RecommendationDecision::DoNotSubmit).unwrap(),
            "do_not_submit"
        );
        assert_eq!(
            serde_json::to_value(RecommendationDecision::ReadyForFutureAiReview).unwrap(),
            "ready_for_future_ai_review"
        );
    }
}
