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

impl MediaFile {
    pub async fn create(
        pool: &PgPool,
        patient_id: Uuid,
        checklist_item_id: Option<Uuid>,
        file_name: &str,
        file_path: &str,
        file_type: &str,
        file_size: i64,
        uploaded_by: Uuid,
    ) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO media_files (patient_id, checklist_item_id, file_name, file_path, file_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"
        )
        .bind(patient_id)
        .bind(checklist_item_id)
        .bind(file_name)
        .bind(file_path)
        .bind(file_type)
        .bind(file_size)
        .bind(uploaded_by)
        .fetch_one(pool)
        .await
    }

    pub async fn list_by_patient(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>(
            "SELECT * FROM media_files WHERE patient_id = $1 ORDER BY created_at DESC"
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
