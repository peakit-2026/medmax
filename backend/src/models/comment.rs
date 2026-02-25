use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Comment {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub author_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

impl Comment {
    pub async fn create(
        pool: &PgPool,
        patient_id: Uuid,
        author_id: Uuid,
        content: &str,
    ) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO comments (patient_id, author_id, content) VALUES ($1, $2, $3) RETURNING *",
        )
        .bind(patient_id)
        .bind(author_id)
        .bind(content)
        .fetch_one(pool)
        .await
    }

    pub async fn list_by_patient(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>(
            "SELECT * FROM comments WHERE patient_id = $1 ORDER BY created_at ASC",
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await
    }
}
