use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MediaFile {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub checklist_item_id: Option<Uuid>,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
}

pub struct CreateMediaParams<'a> {
    pub patient_id: Uuid,
    pub checklist_item_id: Option<Uuid>,
    pub file_name: &'a str,
    pub file_path: &'a str,
    pub file_type: &'a str,
    pub file_size: i64,
    pub uploaded_by: Uuid,
}

impl MediaFile {
    pub async fn create(pool: &PgPool, params: CreateMediaParams<'_>) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO media_files (patient_id, checklist_item_id, file_name, file_path, file_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"
        )
        .bind(params.patient_id)
        .bind(params.checklist_item_id)
        .bind(params.file_name)
        .bind(params.file_path)
        .bind(params.file_type)
        .bind(params.file_size)
        .bind(params.uploaded_by)
        .fetch_one(pool)
        .await
    }

    pub async fn list_by_patient(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>(
            "SELECT * FROM media_files WHERE patient_id = $1 ORDER BY created_at DESC",
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM media_files WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, id: Uuid) -> sqlx::Result<()> {
        sqlx::query("DELETE FROM media_files WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(())
    }
}
