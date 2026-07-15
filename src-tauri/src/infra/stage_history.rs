use std::error::Error;
use std::fmt;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const DATABASE_SCHEMA_VERSION: i32 = 1;
const BUSY_TIMEOUT: Duration = Duration::from_secs(5);

const MIGRATION_0_TO_1: &str = r#"
CREATE TABLE stage_history (
    scan_id TEXT PRIMARY KEY NOT NULL,
    repo_path TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    branch TEXT,
    diff_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    changed_file_count INTEGER NOT NULL
        CHECK (changed_file_count >= 0),
    selected_file_path TEXT,
    safety_gate_status TEXT NOT NULL,
    estimated_tokens INTEGER
        CHECK (estimated_tokens IS NULL OR estimated_tokens >= 0),
    report_generation_mode TEXT NOT NULL,
    report_status TEXT NOT NULL,
    recommendation_decision TEXT NOT NULL,
    artifact_schema_version INTEGER NOT NULL
        CHECK (artifact_schema_version > 0),
    artifacts_json TEXT NOT NULL
);

CREATE INDEX idx_stage_history_created_at
    ON stage_history (created_at DESC, scan_id DESC);
CREATE INDEX idx_stage_history_repo_path
    ON stage_history (repo_path);
CREATE INDEX idx_stage_history_diff_hash
    ON stage_history (diff_hash);
"#;

#[derive(Debug)]
pub enum StageHistoryError {
    DatabaseOpen {
        path: PathBuf,
        source: rusqlite::Error,
    },
    DatabaseInitialization {
        path: PathBuf,
        source: rusqlite::Error,
    },
    UnsupportedDatabaseSchema {
        found: i32,
        supported: i32,
    },
}

impl fmt::Display for StageHistoryError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DatabaseOpen { path, source } => write!(
                formatter,
                "failed to open Stage History database at {}: {source}",
                path.display()
            ),
            Self::DatabaseInitialization { path, source } => write!(
                formatter,
                "failed to initialize Stage History database at {}: {source}",
                path.display()
            ),
            Self::UnsupportedDatabaseSchema { found, supported } => write!(
                formatter,
                "Stage History database schema version {found} is newer than supported version {supported}"
            ),
        }
    }
}

impl Error for StageHistoryError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::DatabaseOpen { source, .. } | Self::DatabaseInitialization { source, .. } => {
                Some(source)
            }
            Self::UnsupportedDatabaseSchema { .. } => None,
        }
    }
}

pub struct StageHistoryStore {
    connection: Mutex<Connection>,
}

impl StageHistoryStore {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, StageHistoryError> {
        let path = path.as_ref().to_path_buf();
        let mut connection =
            Connection::open(&path).map_err(|source| StageHistoryError::DatabaseOpen {
                path: path.clone(),
                source,
            })?;
        connection.busy_timeout(BUSY_TIMEOUT).map_err(|source| {
            StageHistoryError::DatabaseInitialization {
                path: path.clone(),
                source,
            }
        })?;
        migrate(&mut connection, &path)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }
}

fn migrate(connection: &mut Connection, path: &Path) -> Result<(), StageHistoryError> {
    let version: i32 = connection
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(|source| StageHistoryError::DatabaseInitialization {
            path: path.to_path_buf(),
            source,
        })?;

    if version > DATABASE_SCHEMA_VERSION {
        return Err(StageHistoryError::UnsupportedDatabaseSchema {
            found: version,
            supported: DATABASE_SCHEMA_VERSION,
        });
    }

    if version == 0 {
        let transaction = connection.transaction().map_err(|source| {
            StageHistoryError::DatabaseInitialization {
                path: path.to_path_buf(),
                source,
            }
        })?;
        transaction
            .execute_batch(MIGRATION_0_TO_1)
            .map_err(|source| StageHistoryError::DatabaseInitialization {
                path: path.to_path_buf(),
                source,
            })?;
        transaction
            .pragma_update(None, "user_version", DATABASE_SCHEMA_VERSION)
            .map_err(|source| StageHistoryError::DatabaseInitialization {
                path: path.to_path_buf(),
                source,
            })?;
        transaction
            .commit()
            .map_err(|source| StageHistoryError::DatabaseInitialization {
                path: path.to_path_buf(),
                source,
            })?;
    }

    Ok(())
}

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
    use std::path::PathBuf;

    use rusqlite::Connection;
    use serde_json::{json, Value};
    use tempfile::TempDir;

    use super::{
        ArtifactSchemaVersion, RecommendationDecision, ReportGenerationMode, ReportStatus,
        SafetyGateStatus, StageHistoryArtifactsV1, StageHistoryError, StageHistoryStore,
        DATABASE_SCHEMA_VERSION,
    };

    fn temporary_database_path() -> (TempDir, PathBuf) {
        let directory = tempfile::tempdir().expect("temporary directory");
        let path = directory.path().join("stage-history.sqlite3");
        (directory, path)
    }

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

    #[test]
    fn opening_a_new_database_initializes_schema_version_one() {
        let (_directory, path) = temporary_database_path();

        let store = StageHistoryStore::open(&path).expect("database initializes");
        assert!(path.exists());
        drop(store);

        let connection = Connection::open(path).expect("database reopens");
        let version: i32 = connection
            .pragma_query_value(None, "user_version", |row| row.get(0))
            .expect("reads user_version");
        assert_eq!(version, DATABASE_SCHEMA_VERSION);
    }

    #[test]
    fn migration_creates_the_expected_stage_history_columns() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(&path).expect("database initializes");
        drop(store);
        let connection = Connection::open(path).expect("database reopens");

        let mut statement = connection
            .prepare("PRAGMA table_info(stage_history)")
            .expect("prepares table_info");
        let columns = statement
            .query_map([], |row| row.get::<_, String>(1))
            .expect("queries columns")
            .collect::<Result<Vec<_>, _>>()
            .expect("reads columns");

        assert_eq!(
            columns,
            vec![
                "scan_id",
                "repo_path",
                "repo_name",
                "branch",
                "diff_hash",
                "created_at",
                "changed_file_count",
                "selected_file_path",
                "safety_gate_status",
                "estimated_tokens",
                "report_generation_mode",
                "report_status",
                "recommendation_decision",
                "artifact_schema_version",
                "artifacts_json",
            ]
        );
    }

    #[test]
    fn migration_creates_the_expected_indexes() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(&path).expect("database initializes");
        drop(store);
        let connection = Connection::open(path).expect("database reopens");

        let mut statement = connection
            .prepare("PRAGMA index_list(stage_history)")
            .expect("prepares index_list");
        let indexes = statement
            .query_map([], |row| row.get::<_, String>(1))
            .expect("queries indexes")
            .collect::<Result<Vec<_>, _>>()
            .expect("reads indexes");

        assert!(indexes.contains(&"idx_stage_history_created_at".to_string()));
        assert!(indexes.contains(&"idx_stage_history_repo_path".to_string()));
        assert!(indexes.contains(&"idx_stage_history_diff_hash".to_string()));

        let listing_index_sql: String = connection
            .query_row(
                "SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?1",
                ["idx_stage_history_created_at"],
                |row| row.get(0),
            )
            .expect("reads listing index SQL");
        assert!(listing_index_sql.contains("created_at DESC, scan_id DESC"));
    }

    #[test]
    fn reopening_a_version_one_database_is_idempotent() {
        let (_directory, path) = temporary_database_path();

        drop(StageHistoryStore::open(&path).expect("first open succeeds"));
        drop(StageHistoryStore::open(&path).expect("second open succeeds"));

        let connection = Connection::open(path).expect("database reopens");
        let table_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'stage_history'",
                [],
                |row| row.get(0),
            )
            .expect("counts table");
        assert_eq!(table_count, 1);
    }

    #[test]
    fn opening_a_future_database_version_returns_a_controlled_error() {
        let (_directory, path) = temporary_database_path();
        let connection = Connection::open(&path).expect("creates database");
        connection
            .pragma_update(None, "user_version", DATABASE_SCHEMA_VERSION + 1)
            .expect("sets future version");
        drop(connection);

        let error = match StageHistoryStore::open(&path) {
            Ok(_) => panic!("future schema must be rejected"),
            Err(error) => error,
        };

        assert!(matches!(
            error,
            StageHistoryError::UnsupportedDatabaseSchema {
                found,
                supported
            } if found == DATABASE_SCHEMA_VERSION + 1 && supported == DATABASE_SCHEMA_VERSION
        ));
    }
}
