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

    pub async fn list_with_author(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Vec<CommentWithAuthor>> {
        sqlx::query_as::<_, CommentWithAuthor>(
            "SELECT c.id, c.patient_id, c.author_id, c.content, c.created_at, u.full_name AS author_name \
             FROM comments c JOIN users u ON c.author_id = u.id \
             WHERE c.patient_id = $1 ORDER BY c.created_at ASC",
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CommentWithAuthor {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub author_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub author_name: String,
}
