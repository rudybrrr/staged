use std::error::Error;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};
use std::time::Duration;

use rusqlite::{params, Connection, ErrorCode, OptionalExtension, Row};
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
    ConnectionMutexPoisoned,
    DatabaseOperation {
        operation: &'static str,
        source: rusqlite::Error,
    },
    ArtifactSerialization {
        source: serde_json::Error,
    },
    DuplicateScanId {
        scan_id: String,
    },
    InvalidStoredRecord {
        scan_id: String,
        field: &'static str,
    },
    MalformedArtifactJson {
        scan_id: String,
        source: serde_json::Error,
    },
    UnsupportedArtifactSchemaVersion {
        scan_id: String,
        found: i32,
        supported: i32,
    },
    ArtifactSchemaVersionMismatch {
        scan_id: String,
        database_version: i32,
        embedded_version: i32,
    },
    UnsupportedEmbeddedArtifactSchema {
        scan_id: String,
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
            Self::ConnectionMutexPoisoned => {
                write!(formatter, "Stage History database connection is unavailable")
            }
            Self::DatabaseOperation { operation, source } => {
                write!(formatter, "Stage History {operation} failed: {source}")
            }
            Self::ArtifactSerialization { source } => {
                write!(formatter, "failed to serialize Stage History artifacts: {source}")
            }
            Self::DuplicateScanId { scan_id } => {
                write!(formatter, "Stage History scan ID already exists: {scan_id}")
            }
            Self::InvalidStoredRecord { scan_id, field } => write!(
                formatter,
                "Stage History record {scan_id} has an invalid {field} field"
            ),
            Self::MalformedArtifactJson { scan_id, .. } => write!(
                formatter,
                "Stage History record {scan_id} has malformed artifact JSON"
            ),
            Self::UnsupportedArtifactSchemaVersion {
                scan_id,
                found,
                supported,
            } => write!(
                formatter,
                "Stage History record {scan_id} uses artifact schema version {found}, but this backend supports version {supported}"
            ),
            Self::ArtifactSchemaVersionMismatch {
                scan_id,
                database_version,
                embedded_version,
            } => write!(
                formatter,
                "Stage History record {scan_id} has mismatched artifact schema versions: database {database_version}, envelope {embedded_version}"
            ),
            Self::UnsupportedEmbeddedArtifactSchema { scan_id } => write!(
                formatter,
                "Stage History record {scan_id} uses an unsupported embedded artifact schema"
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
            Self::DatabaseOperation { source, .. } => Some(source),
            Self::ArtifactSerialization { source } => Some(source),
            Self::MalformedArtifactJson { source, .. } => Some(source),
            Self::UnsupportedDatabaseSchema { .. }
            | Self::ConnectionMutexPoisoned
            | Self::DuplicateScanId { .. }
            | Self::InvalidStoredRecord { .. }
            | Self::UnsupportedArtifactSchemaVersion { .. }
            | Self::ArtifactSchemaVersionMismatch { .. }
            | Self::UnsupportedEmbeddedArtifactSchema { .. } => None,
        }
    }
}

#[derive(Debug)]
pub enum StageHistoryInitializationError {
    ApplicationDataDirectoryResolution {
        source: tauri::Error,
    },
    ApplicationDataDirectoryCreation {
        path: PathBuf,
        source: io::Error,
    },
    Database {
        path: PathBuf,
        source: StageHistoryError,
    },
    ManagedStateAlreadyRegistered,
}

impl fmt::Display for StageHistoryInitializationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ApplicationDataDirectoryResolution { source } => {
                write!(
                    formatter,
                    "failed to resolve the application data directory: {source}"
                )
            }
            Self::ApplicationDataDirectoryCreation { path, source } => write!(
                formatter,
                "failed to create the application data directory at {}: {source}",
                path.display()
            ),
            Self::Database { path, source } => write!(
                formatter,
                "failed to initialize the Stage History database at {}: {source}",
                path.display()
            ),
            Self::ManagedStateAlreadyRegistered => {
                write!(
                    formatter,
                    "Stage History managed state is already registered"
                )
            }
        }
    }
}

impl Error for StageHistoryInitializationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ApplicationDataDirectoryResolution { source } => Some(source),
            Self::ApplicationDataDirectoryCreation { source, .. } => Some(source),
            Self::Database { source, .. } => Some(source),
            Self::ManagedStateAlreadyRegistered => None,
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

    pub fn save_scan(&self, record: &NewStageHistoryRecord) -> Result<(), StageHistoryError> {
        let artifacts_json = serde_json::to_string(&record.artifacts)
            .map_err(|source| StageHistoryError::ArtifactSerialization { source })?;
        let connection = self.lock_connection()?;
        let result = connection.execute(
            "INSERT INTO stage_history (
                scan_id, repo_path, repo_name, branch, diff_hash, created_at,
                changed_file_count, selected_file_path, safety_gate_status,
                estimated_tokens, report_generation_mode, report_status,
                recommendation_decision, artifact_schema_version, artifacts_json
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15
            )",
            params![
                record.scan_id,
                record.repo_path,
                record.repo_name,
                record.branch,
                record.diff_hash,
                record.created_at,
                record.changed_file_count,
                record.selected_file_path,
                record.safety_gate_status.as_str(),
                record.estimated_tokens,
                record.report_generation_mode.as_str(),
                record.report_status.as_str(),
                record.recommendation_decision.as_str(),
                ArtifactSchemaVersion::V1.database_version(),
                artifacts_json,
            ],
        );

        match result {
            Ok(_) => Ok(()),
            Err(rusqlite::Error::SqliteFailure(error, _))
                if error.code == ErrorCode::ConstraintViolation
                    && error.extended_code == rusqlite::ffi::SQLITE_CONSTRAINT_PRIMARYKEY =>
            {
                Err(StageHistoryError::DuplicateScanId {
                    scan_id: record.scan_id.clone(),
                })
            }
            Err(source) => Err(StageHistoryError::DatabaseOperation {
                operation: "save",
                source,
            }),
        }
    }

    pub fn list_scans(&self) -> Result<Vec<StageHistorySummary>, StageHistoryError> {
        let connection = self.lock_connection()?;
        let mut statement = connection
            .prepare(
                "SELECT
                    scan_id, repo_path, repo_name, branch, diff_hash, created_at,
                    changed_file_count, selected_file_path, safety_gate_status,
                    estimated_tokens, report_generation_mode, report_status,
                    recommendation_decision, artifact_schema_version
                 FROM stage_history
                 ORDER BY created_at DESC, scan_id DESC",
            )
            .map_err(|source| StageHistoryError::DatabaseOperation {
                operation: "list preparation",
                source,
            })?;
        let rows = statement
            .query_map([], read_summary_row)
            .map_err(|source| StageHistoryError::DatabaseOperation {
                operation: "list query",
                source,
            })?;

        rows.map(|row| {
            row.map_err(|source| StageHistoryError::DatabaseOperation {
                operation: "list row decoding",
                source,
            })
            .and_then(StageHistorySummary::try_from_raw)
        })
        .collect()
    }

    pub fn read_scan(
        &self,
        scan_id: &str,
    ) -> Result<Option<StageHistoryRecord>, StageHistoryError> {
        let connection = self.lock_connection()?;
        let raw = connection
            .query_row(
                "SELECT
                    scan_id, repo_path, repo_name, branch, diff_hash, created_at,
                    changed_file_count, selected_file_path, safety_gate_status,
                    estimated_tokens, report_generation_mode, report_status,
                    recommendation_decision, artifact_schema_version, artifacts_json
                 FROM stage_history
                 WHERE scan_id = ?1",
                [scan_id],
                read_record_row,
            )
            .optional()
            .map_err(|source| StageHistoryError::DatabaseOperation {
                operation: "read",
                source,
            })?;

        raw.map(StageHistoryRecord::try_from_raw).transpose()
    }

    pub fn delete_scan(&self, scan_id: &str) -> Result<bool, StageHistoryError> {
        let deleted = self
            .lock_connection()?
            .execute("DELETE FROM stage_history WHERE scan_id = ?1", [scan_id])
            .map_err(|source| StageHistoryError::DatabaseOperation {
                operation: "delete",
                source,
            })?;
        Ok(deleted > 0)
    }

    pub fn clear_history(&self) -> Result<usize, StageHistoryError> {
        self.lock_connection()?
            .execute("DELETE FROM stage_history", [])
            .map_err(|source| StageHistoryError::DatabaseOperation {
                operation: "clear",
                source,
            })
    }

    fn lock_connection(&self) -> Result<MutexGuard<'_, Connection>, StageHistoryError> {
        self.connection
            .lock()
            .map_err(|_| StageHistoryError::ConnectionMutexPoisoned)
    }
}

fn stage_history_database_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("stage-history.sqlite3")
}

fn initialize_store_in_app_data_dir(
    app_data_dir: &Path,
) -> Result<StageHistoryStore, StageHistoryInitializationError> {
    fs::create_dir_all(app_data_dir).map_err(|source| {
        StageHistoryInitializationError::ApplicationDataDirectoryCreation {
            path: app_data_dir.to_path_buf(),
            source,
        }
    })?;
    let database_path = stage_history_database_path(app_data_dir);

    StageHistoryStore::open(&database_path).map_err(|source| {
        StageHistoryInitializationError::Database {
            path: database_path,
            source,
        }
    })
}

pub fn initialize_stage_history<R: tauri::Runtime>(
    app: &mut tauri::App<R>,
) -> Result<(), Box<dyn Error>> {
    use tauri::Manager;

    let result = (|| {
        let app_data_dir = app.path().app_data_dir().map_err(|source| {
            StageHistoryInitializationError::ApplicationDataDirectoryResolution { source }
        })?;
        let store = initialize_store_in_app_data_dir(&app_data_dir)?;

        if !app.manage(store) {
            return Err(StageHistoryInitializationError::ManagedStateAlreadyRegistered);
        }

        Ok(())
    })();

    result.map_err(|error| Box::new(error) as Box<dyn Error>)
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

impl ArtifactSchemaVersion {
    fn database_version(self) -> i32 {
        match self {
            Self::V1 => 1,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SafetyGateStatus {
    Pass,
    Warning,
    Blocked,
}

impl SafetyGateStatus {
    fn as_str(self) -> &'static str {
        match self {
            Self::Pass => "pass",
            Self::Warning => "warning",
            Self::Blocked => "blocked",
        }
    }

    fn from_str(value: &str) -> Option<Self> {
        match value {
            "pass" => Some(Self::Pass),
            "warning" => Some(Self::Warning),
            "blocked" => Some(Self::Blocked),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReportGenerationMode {
    LocalPreview,
    AiGenerated,
}

impl ReportGenerationMode {
    fn as_str(self) -> &'static str {
        match self {
            Self::LocalPreview => "local_preview",
            Self::AiGenerated => "ai_generated",
        }
    }

    fn from_str(value: &str) -> Option<Self> {
        match value {
            "local_preview" => Some(Self::LocalPreview),
            "ai_generated" => Some(Self::AiGenerated),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReportStatus {
    PreviewOnly,
    Complete,
}

impl ReportStatus {
    fn as_str(self) -> &'static str {
        match self {
            Self::PreviewOnly => "preview_only",
            Self::Complete => "complete",
        }
    }

    fn from_str(value: &str) -> Option<Self> {
        match value {
            "preview_only" => Some(Self::PreviewOnly),
            "complete" => Some(Self::Complete),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RecommendationDecision {
    ReviewManually,
    DoNotSubmit,
    ReadyForFutureAiReview,
}

impl RecommendationDecision {
    fn as_str(self) -> &'static str {
        match self {
            Self::ReviewManually => "review_manually",
            Self::DoNotSubmit => "do_not_submit",
            Self::ReadyForFutureAiReview => "ready_for_future_ai_review",
        }
    }

    fn from_str(value: &str) -> Option<Self> {
        match value {
            "review_manually" => Some(Self::ReviewManually),
            "do_not_submit" => Some(Self::DoNotSubmit),
            "ready_for_future_ai_review" => Some(Self::ReadyForFutureAiReview),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StageHistoryArtifactsV1 {
    // Callers must supply persistence-safe snapshots; this storage layer does not detect secrets.
    pub schema_version: ArtifactSchemaVersion,
    pub redacted_stage_payload: Value,
    pub token_budget: Value,
    pub pre_stage_screening_findings: Vec<Value>,
    pub safety_gate_result: Value,
    pub local_stage_report: Value,
    pub markdown_export: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct NewStageHistoryRecord {
    pub scan_id: String,
    pub repo_path: String,
    pub repo_name: String,
    pub branch: Option<String>,
    pub diff_hash: String,
    pub created_at: String,
    pub changed_file_count: i64,
    pub selected_file_path: Option<String>,
    pub safety_gate_status: SafetyGateStatus,
    pub estimated_tokens: Option<i64>,
    pub report_generation_mode: ReportGenerationMode,
    pub report_status: ReportStatus,
    pub recommendation_decision: RecommendationDecision,
    pub artifacts: StageHistoryArtifactsV1,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StageHistorySummary {
    pub scan_id: String,
    pub repo_path: String,
    pub repo_name: String,
    pub branch: Option<String>,
    pub diff_hash: String,
    pub created_at: String,
    pub changed_file_count: i64,
    pub selected_file_path: Option<String>,
    pub safety_gate_status: SafetyGateStatus,
    pub estimated_tokens: Option<i64>,
    pub report_generation_mode: ReportGenerationMode,
    pub report_status: ReportStatus,
    pub recommendation_decision: RecommendationDecision,
    pub artifact_schema_version: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct StageHistoryRecord {
    pub scan_id: String,
    pub repo_path: String,
    pub repo_name: String,
    pub branch: Option<String>,
    pub diff_hash: String,
    pub created_at: String,
    pub changed_file_count: i64,
    pub selected_file_path: Option<String>,
    pub safety_gate_status: SafetyGateStatus,
    pub estimated_tokens: Option<i64>,
    pub report_generation_mode: ReportGenerationMode,
    pub report_status: ReportStatus,
    pub recommendation_decision: RecommendationDecision,
    pub artifact_schema_version: i32,
    pub artifacts: StageHistoryArtifactsV1,
}

struct RawStageHistorySummary {
    scan_id: String,
    repo_path: String,
    repo_name: String,
    branch: Option<String>,
    diff_hash: String,
    created_at: String,
    changed_file_count: i64,
    selected_file_path: Option<String>,
    safety_gate_status: String,
    estimated_tokens: Option<i64>,
    report_generation_mode: String,
    report_status: String,
    recommendation_decision: String,
    artifact_schema_version: i32,
}

struct RawStageHistoryRecord {
    summary: RawStageHistorySummary,
    artifacts_json: String,
}

impl StageHistorySummary {
    fn try_from_raw(raw: RawStageHistorySummary) -> Result<Self, StageHistoryError> {
        let scan_id = raw.scan_id;
        let safety_gate_status =
            SafetyGateStatus::from_str(&raw.safety_gate_status).ok_or_else(|| {
                StageHistoryError::InvalidStoredRecord {
                    scan_id: scan_id.clone(),
                    field: "safety_gate_status",
                }
            })?;
        let report_generation_mode = ReportGenerationMode::from_str(&raw.report_generation_mode)
            .ok_or_else(|| StageHistoryError::InvalidStoredRecord {
                scan_id: scan_id.clone(),
                field: "report_generation_mode",
            })?;
        let report_status = ReportStatus::from_str(&raw.report_status).ok_or_else(|| {
            StageHistoryError::InvalidStoredRecord {
                scan_id: scan_id.clone(),
                field: "report_status",
            }
        })?;
        let recommendation_decision =
            RecommendationDecision::from_str(&raw.recommendation_decision).ok_or_else(|| {
                StageHistoryError::InvalidStoredRecord {
                    scan_id: scan_id.clone(),
                    field: "recommendation_decision",
                }
            })?;

        Ok(Self {
            scan_id,
            repo_path: raw.repo_path,
            repo_name: raw.repo_name,
            branch: raw.branch,
            diff_hash: raw.diff_hash,
            created_at: raw.created_at,
            changed_file_count: raw.changed_file_count,
            selected_file_path: raw.selected_file_path,
            safety_gate_status,
            estimated_tokens: raw.estimated_tokens,
            report_generation_mode,
            report_status,
            recommendation_decision,
            artifact_schema_version: raw.artifact_schema_version,
        })
    }
}

impl StageHistoryRecord {
    fn try_from_raw(raw: RawStageHistoryRecord) -> Result<Self, StageHistoryError> {
        let scan_id = raw.summary.scan_id.clone();
        let artifact_value: Value =
            serde_json::from_str(&raw.artifacts_json).map_err(|source| {
                StageHistoryError::MalformedArtifactJson {
                    scan_id: scan_id.clone(),
                    source,
                }
            })?;
        let embedded_version = embedded_artifact_version(&artifact_value).ok_or_else(|| {
            StageHistoryError::UnsupportedEmbeddedArtifactSchema {
                scan_id: scan_id.clone(),
            }
        })?;
        let database_version = raw.summary.artifact_schema_version;

        if database_version != embedded_version {
            return Err(StageHistoryError::ArtifactSchemaVersionMismatch {
                scan_id,
                database_version,
                embedded_version,
            });
        }

        let supported_version = ArtifactSchemaVersion::V1.database_version();
        if database_version != supported_version {
            return Err(StageHistoryError::UnsupportedArtifactSchemaVersion {
                scan_id,
                found: database_version,
                supported: supported_version,
            });
        }

        let artifacts = serde_json::from_value(artifact_value).map_err(|source| {
            StageHistoryError::MalformedArtifactJson {
                scan_id: raw.summary.scan_id.clone(),
                source,
            }
        })?;
        let summary = StageHistorySummary::try_from_raw(raw.summary)?;

        Ok(Self {
            scan_id: summary.scan_id,
            repo_path: summary.repo_path,
            repo_name: summary.repo_name,
            branch: summary.branch,
            diff_hash: summary.diff_hash,
            created_at: summary.created_at,
            changed_file_count: summary.changed_file_count,
            selected_file_path: summary.selected_file_path,
            safety_gate_status: summary.safety_gate_status,
            estimated_tokens: summary.estimated_tokens,
            report_generation_mode: summary.report_generation_mode,
            report_status: summary.report_status,
            recommendation_decision: summary.recommendation_decision,
            artifact_schema_version: summary.artifact_schema_version,
            artifacts,
        })
    }
}

fn embedded_artifact_version(value: &Value) -> Option<i32> {
    value
        .get("schema_version")?
        .as_str()?
        .strip_prefix("stage-history-artifacts.v")?
        .parse()
        .ok()
}

fn read_summary_row(row: &Row<'_>) -> rusqlite::Result<RawStageHistorySummary> {
    Ok(RawStageHistorySummary {
        scan_id: row.get(0)?,
        repo_path: row.get(1)?,
        repo_name: row.get(2)?,
        branch: row.get(3)?,
        diff_hash: row.get(4)?,
        created_at: row.get(5)?,
        changed_file_count: row.get(6)?,
        selected_file_path: row.get(7)?,
        safety_gate_status: row.get(8)?,
        estimated_tokens: row.get(9)?,
        report_generation_mode: row.get(10)?,
        report_status: row.get(11)?,
        recommendation_decision: row.get(12)?,
        artifact_schema_version: row.get(13)?,
    })
}

fn read_record_row(row: &Row<'_>) -> rusqlite::Result<RawStageHistoryRecord> {
    Ok(RawStageHistoryRecord {
        summary: read_summary_row(row)?,
        artifacts_json: row.get(14)?,
    })
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use rusqlite::{params, Connection};
    use serde_json::{json, Value};
    use tempfile::TempDir;

    use super::{
        initialize_store_in_app_data_dir, stage_history_database_path, ArtifactSchemaVersion,
        NewStageHistoryRecord, RecommendationDecision, ReportGenerationMode, ReportStatus,
        SafetyGateStatus, StageHistoryArtifactsV1, StageHistoryError,
        StageHistoryInitializationError, StageHistoryStore, DATABASE_SCHEMA_VERSION,
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

    fn record_fixture(scan_id: &str, created_at: &str) -> NewStageHistoryRecord {
        NewStageHistoryRecord {
            scan_id: scan_id.to_string(),
            repo_path: "C:/work/example".to_string(),
            repo_name: "example".to_string(),
            branch: Some("main".to_string()),
            diff_hash: "sha256:shared-diff".to_string(),
            created_at: created_at.to_string(),
            changed_file_count: 3,
            selected_file_path: Some("src/main.rs".to_string()),
            safety_gate_status: SafetyGateStatus::Pass,
            estimated_tokens: Some(42),
            report_generation_mode: ReportGenerationMode::LocalPreview,
            report_status: ReportStatus::PreviewOnly,
            recommendation_decision: RecommendationDecision::ReviewManually,
            artifacts: artifact_fixture(Some("# Stage Report")),
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

    #[test]
    fn saves_and_reads_a_complete_record() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        let record = record_fixture("scan-complete", "2026-07-15T10:00:00.000Z");

        store.save_scan(&record).expect("record saves");
        let stored = store
            .read_scan("scan-complete")
            .expect("record reads")
            .expect("record exists");

        assert_eq!(stored.scan_id, record.scan_id);
        assert_eq!(stored.repo_path, record.repo_path);
        assert_eq!(stored.repo_name, record.repo_name);
        assert_eq!(stored.branch, record.branch);
        assert_eq!(stored.diff_hash, record.diff_hash);
        assert_eq!(stored.created_at, record.created_at);
        assert_eq!(stored.changed_file_count, record.changed_file_count);
        assert_eq!(stored.selected_file_path, record.selected_file_path);
        assert_eq!(stored.safety_gate_status, record.safety_gate_status);
        assert_eq!(stored.estimated_tokens, record.estimated_tokens);
        assert_eq!(stored.report_generation_mode, record.report_generation_mode);
        assert_eq!(stored.report_status, record.report_status);
        assert_eq!(
            stored.recommendation_decision,
            record.recommendation_decision
        );
        assert_eq!(stored.artifact_schema_version, 1);
        assert_eq!(stored.artifacts, record.artifacts);
    }

    #[test]
    fn nullable_record_fields_round_trip_as_none() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        let mut record = record_fixture("scan-nullable", "2026-07-15T10:00:00.000Z");
        record.branch = None;
        record.selected_file_path = None;
        record.estimated_tokens = None;
        record.artifacts.markdown_export = None;

        store.save_scan(&record).expect("record saves");
        let stored = store
            .read_scan("scan-nullable")
            .expect("record reads")
            .expect("record exists");

        assert_eq!(stored.branch, None);
        assert_eq!(stored.selected_file_path, None);
        assert_eq!(stored.estimated_tokens, None);
        assert_eq!(stored.artifacts.markdown_export, None);
    }

    #[test]
    fn lists_newest_first_with_scan_id_as_the_stable_tiebreaker() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture("scan-a", "2026-07-15T10:00:00.000Z"))
            .expect("first record saves");
        store
            .save_scan(&record_fixture("scan-b", "2026-07-15T10:00:00.000Z"))
            .expect("second record saves");
        store
            .save_scan(&record_fixture("scan-new", "2026-07-15T11:00:00.000Z"))
            .expect("newest record saves");

        let scan_ids = store
            .list_scans()
            .expect("records list")
            .into_iter()
            .map(|record| record.scan_id)
            .collect::<Vec<_>>();

        assert_eq!(scan_ids, vec!["scan-new", "scan-b", "scan-a"]);
    }

    #[test]
    fn summary_listing_does_not_deserialize_artifact_json() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture(
                "scan-malformed",
                "2026-07-15T10:00:00.000Z",
            ))
            .expect("record saves");
        store
            .connection
            .lock()
            .expect("connection lock")
            .execute(
                "UPDATE stage_history SET artifacts_json = 'not-json' WHERE scan_id = ?1",
                ["scan-malformed"],
            )
            .expect("corrupts test fixture");

        let summaries = store.list_scans().expect("summary list succeeds");

        assert_eq!(summaries.len(), 1);
        assert_eq!(summaries[0].scan_id, "scan-malformed");
        assert_eq!(summaries[0].artifact_schema_version, 1);
    }

    #[test]
    fn duplicate_scan_id_returns_a_controlled_error_without_replacing_the_record() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        let original = record_fixture("scan-duplicate", "2026-07-15T10:00:00.000Z");
        let mut duplicate = record_fixture("scan-duplicate", "2026-07-15T11:00:00.000Z");
        duplicate.repo_name = "replacement-must-not-win".to_string();
        store.save_scan(&original).expect("original saves");

        let error = store
            .save_scan(&duplicate)
            .expect_err("duplicate must be rejected");

        assert!(matches!(
            error,
            StageHistoryError::DuplicateScanId { ref scan_id } if scan_id == "scan-duplicate"
        ));
        let stored = store
            .read_scan("scan-duplicate")
            .expect("record reads")
            .expect("record exists");
        assert_eq!(stored.repo_name, original.repo_name);
        assert_eq!(stored.created_at, original.created_at);
    }

    #[test]
    fn reading_a_missing_scan_returns_none() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");

        assert_eq!(store.read_scan("missing").expect("read succeeds"), None);
    }

    #[test]
    fn deleting_an_existing_scan_returns_true() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture("scan-delete", "2026-07-15T10:00:00.000Z"))
            .expect("record saves");

        assert!(store.delete_scan("scan-delete").expect("delete succeeds"));
        assert_eq!(store.read_scan("scan-delete").expect("read succeeds"), None);
    }

    #[test]
    fn deleting_a_missing_scan_returns_false() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");

        assert!(!store.delete_scan("missing").expect("delete succeeds"));
    }

    #[test]
    fn clearing_history_returns_the_number_of_deleted_records() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture("scan-1", "2026-07-15T10:00:00.000Z"))
            .expect("first record saves");
        store
            .save_scan(&record_fixture("scan-2", "2026-07-15T11:00:00.000Z"))
            .expect("second record saves");

        assert_eq!(store.clear_history().expect("clear succeeds"), 2);
        assert!(store.list_scans().expect("list succeeds").is_empty());
        assert_eq!(store.clear_history().expect("second clear succeeds"), 0);
    }

    #[test]
    fn repeated_diff_hash_values_are_allowed() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        let first = record_fixture("scan-first", "2026-07-15T10:00:00.000Z");
        let second = record_fixture("scan-second", "2026-07-15T11:00:00.000Z");
        assert_eq!(first.diff_hash, second.diff_hash);

        store.save_scan(&first).expect("first record saves");
        store.save_scan(&second).expect("second record saves");

        assert_eq!(store.list_scans().expect("list succeeds").len(), 2);
    }

    #[test]
    fn malformed_artifact_json_returns_a_controlled_error() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture(
                "scan-malformed-read",
                "2026-07-15T10:00:00.000Z",
            ))
            .expect("record saves");
        store
            .connection
            .lock()
            .expect("connection lock")
            .execute(
                "UPDATE stage_history SET artifacts_json = 'not-json' WHERE scan_id = ?1",
                ["scan-malformed-read"],
            )
            .expect("corrupts test fixture");

        let error = store
            .read_scan("scan-malformed-read")
            .expect_err("malformed JSON must fail");

        assert!(matches!(
            error,
            StageHistoryError::MalformedArtifactJson { ref scan_id, .. }
                if scan_id == "scan-malformed-read"
        ));
    }

    #[test]
    fn unsupported_database_artifact_version_returns_a_controlled_error() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture(
                "scan-artifact-v2",
                "2026-07-15T10:00:00.000Z",
            ))
            .expect("record saves");
        let mut artifacts = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        artifacts["schema_version"] = json!("stage-history-artifacts.v2");
        store
            .connection
            .lock()
            .expect("connection lock")
            .execute(
                "UPDATE stage_history
                 SET artifact_schema_version = 2, artifacts_json = ?1
                 WHERE scan_id = ?2",
                params![artifacts.to_string(), "scan-artifact-v2"],
            )
            .expect("updates test fixture");

        let error = store
            .read_scan("scan-artifact-v2")
            .expect_err("unsupported artifact version must fail");

        assert!(matches!(
            error,
            StageHistoryError::UnsupportedArtifactSchemaVersion {
                ref scan_id,
                found: 2,
                supported: 1
            } if scan_id == "scan-artifact-v2"
        ));
    }

    #[test]
    fn database_and_embedded_artifact_versions_must_agree() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture(
                "scan-version-mismatch",
                "2026-07-15T10:00:00.000Z",
            ))
            .expect("record saves");
        store
            .connection
            .lock()
            .expect("connection lock")
            .execute(
                "UPDATE stage_history SET artifact_schema_version = 2 WHERE scan_id = ?1",
                ["scan-version-mismatch"],
            )
            .expect("updates test fixture");

        let error = store
            .read_scan("scan-version-mismatch")
            .expect_err("mismatched versions must fail");

        assert!(matches!(
            error,
            StageHistoryError::ArtifactSchemaVersionMismatch {
                ref scan_id,
                database_version: 2,
                embedded_version: 1
            } if scan_id == "scan-version-mismatch"
        ));
    }

    #[test]
    fn unsupported_embedded_artifact_schema_returns_a_controlled_error() {
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        store
            .save_scan(&record_fixture(
                "scan-unknown-schema",
                "2026-07-15T10:00:00.000Z",
            ))
            .expect("record saves");
        let mut artifacts = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        artifacts["schema_version"] = json!("unknown-artifact-schema");
        store
            .connection
            .lock()
            .expect("connection lock")
            .execute(
                "UPDATE stage_history SET artifacts_json = ?1 WHERE scan_id = ?2",
                params![artifacts.to_string(), "scan-unknown-schema"],
            )
            .expect("updates test fixture");

        let error = store
            .read_scan("scan-unknown-schema")
            .expect_err("unsupported embedded schema must fail");

        assert!(matches!(
            error,
            StageHistoryError::UnsupportedEmbeddedArtifactSchema { ref scan_id }
                if scan_id == "scan-unknown-schema"
        ));
    }

    #[test]
    fn explicitly_redacted_fixture_round_trips_without_the_original_secret() {
        const ORIGINAL_SECRET: &str = "sk-original-secret-fixture";
        let (_directory, path) = temporary_database_path();
        let store = StageHistoryStore::open(path).expect("database initializes");
        let record = record_fixture("scan-redacted", "2026-07-15T10:00:00.000Z");
        assert!(!record
            .artifacts
            .redacted_stage_payload
            .to_string()
            .contains(ORIGINAL_SECRET));

        store.save_scan(&record).expect("record saves");
        let raw_artifacts: String = store
            .connection
            .lock()
            .expect("connection lock")
            .query_row(
                "SELECT artifacts_json FROM stage_history WHERE scan_id = ?1",
                ["scan-redacted"],
                |row| row.get(0),
            )
            .expect("reads raw artifacts");
        let stored = store
            .read_scan("scan-redacted")
            .expect("record reads")
            .expect("record exists");

        assert_eq!(stored.artifacts, record.artifacts);
        assert!(raw_artifacts.contains("[REDACTED]"));
        assert!(!raw_artifacts.contains(ORIGINAL_SECRET));
    }

    #[test]
    fn artifact_envelope_has_no_dedicated_disallowed_storage_fields() {
        let serialized = serde_json::to_value(artifact_fixture(None)).expect("serializes");
        let keys = serialized.as_object().expect("artifact is an object");

        for disallowed in [
            "original_stage_payload",
            "unredacted_stage_payload",
            "api_keys",
            "provider_secret_values",
            "environment_variable_values",
            "repository_contents",
            "raw_secret_values",
        ] {
            assert!(!keys.contains_key(disallowed));
        }
    }

    #[test]
    fn database_path_uses_the_stage_history_filename() {
        let app_data_dir = PathBuf::from("C:/app-data/staged");

        assert_eq!(
            stage_history_database_path(&app_data_dir),
            app_data_dir.join("stage-history.sqlite3")
        );
    }

    #[test]
    fn app_data_initialization_creates_the_directory_and_database() {
        let root = tempfile::tempdir().expect("temporary directory");
        let app_data_dir = root.path().join("nested").join("staged");

        let store = initialize_store_in_app_data_dir(&app_data_dir)
            .expect("app data initialization succeeds");

        assert!(app_data_dir.is_dir());
        assert!(stage_history_database_path(&app_data_dir).is_file());
        drop(store);
    }

    #[test]
    fn app_data_directory_creation_failure_is_contextual() {
        let root = tempfile::tempdir().expect("temporary directory");
        let app_data_dir = root.path().join("not-a-directory");
        std::fs::write(&app_data_dir, "file blocks directory creation")
            .expect("creates blocking file");

        let error = match initialize_store_in_app_data_dir(&app_data_dir) {
            Ok(_) => panic!("directory creation must fail"),
            Err(error) => error,
        };

        assert!(matches!(
            error,
            StageHistoryInitializationError::ApplicationDataDirectoryCreation {
                ref path,
                ..
            } if path == &app_data_dir
        ));
    }

    #[test]
    fn database_open_failure_includes_the_database_path() {
        let root = tempfile::tempdir().expect("temporary directory");
        let app_data_dir = root.path().join("staged");
        std::fs::create_dir_all(&app_data_dir).expect("creates app data directory");
        let database_path = stage_history_database_path(&app_data_dir);
        std::fs::create_dir(&database_path).expect("creates blocking database directory");

        let error = match initialize_store_in_app_data_dir(&app_data_dir) {
            Ok(_) => panic!("database open must fail"),
            Err(error) => error,
        };

        assert!(matches!(
            error,
            StageHistoryInitializationError::Database {
                ref path,
                ..
            } if path == &database_path
        ));
    }
}
