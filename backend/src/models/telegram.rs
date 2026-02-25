use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TelegramSubscription {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub chat_id: i64,
    pub created_at: DateTime<Utc>,
}

impl TelegramSubscription {
    pub async fn create(pool: &PgPool, patient_id: Uuid, chat_id: i64) -> sqlx::Result<Self> {
        if let Some(existing) = Self::find_by_patient(pool, patient_id).await? {
            return Ok(existing);
        }
        sqlx::query_as::<_, Self>(
            "INSERT INTO telegram_subscriptions (patient_id, chat_id) VALUES ($1, $2) RETURNING *",
        )
        .bind(patient_id)
        .bind(chat_id)
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_patient(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM telegram_subscriptions WHERE patient_id = $1")
            .bind(patient_id)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_chat_id(pool: &PgPool, chat_id: i64) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM telegram_subscriptions WHERE chat_id = $1")
            .bind(chat_id)
            .fetch_optional(pool)
            .await
    }
}
