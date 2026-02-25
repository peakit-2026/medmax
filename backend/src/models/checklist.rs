use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ChecklistItem {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub item_type: String,
    pub is_completed: bool,
    pub completed_at: Option<DateTime<Utc>>,
    pub file_path: Option<String>,
    pub value_json: Option<serde_json::Value>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

impl ChecklistItem {
    pub async fn list_by_patient(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>(
            "SELECT * FROM checklist_items WHERE patient_id = $1 ORDER BY sort_order",
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM checklist_items WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn mark_completed(pool: &PgPool, id: Uuid) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "UPDATE checklist_items SET is_completed = true, completed_at = NOW() WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn mark_uncompleted(pool: &PgPool, id: Uuid) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "UPDATE checklist_items SET is_completed = false, completed_at = NULL WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .fetch_one(pool)
        .await
    }

    pub async fn set_file_path(pool: &PgPool, id: Uuid, path: &str) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "UPDATE checklist_items SET file_path = $2 WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .bind(path)
        .fetch_one(pool)
        .await
    }

    pub async fn create_default_checklist(
        pool: &PgPool,
        patient_id: Uuid,
        operation_type: &str,
    ) -> sqlx::Result<Vec<Self>> {
        let items: Vec<(&str, &str, i32)> = match operation_type {
            "facoemulsification" | "Факоэмульсификация" => vec![
                ("Анализ крови (глюкоза, гемоглобин)", "file_upload", 0),
                ("ЭКГ (расшифровка)", "file_upload", 1),
                ("Флюорография", "file_upload", 2),
                ("Осмотр терапевта", "file_upload", 3),
                ("Бакпосев из конъюнктивальной полости", "file_upload", 4),
                ("Расчет ИОЛ", "calculator", 5),
            ],
            "antiglaucoma" | "Антиглаукоматозная операция" => vec![
                ("Анализ крови (глюкоза, гемоглобин)", "file_upload", 0),
                ("ЭКГ (расшифровка)", "file_upload", 1),
                ("Флюорография", "file_upload", 2),
                ("Осмотр терапевта", "file_upload", 3),
                ("Бакпосев из конъюнктивальной полости", "file_upload", 4),
                ("Измерение ВГД (тонометрия)", "file_upload", 5),
                ("Поля зрения (периметрия)", "file_upload", 6),
            ],
            _ => vec![
                ("Анализ крови (глюкоза, гемоглобин)", "file_upload", 0),
                ("ЭКГ (расшифровка)", "file_upload", 1),
                ("Флюорография", "file_upload", 2),
                ("Осмотр терапевта", "file_upload", 3),
                ("Бакпосев из конъюнктивальной полости", "file_upload", 4),
            ],
        };

        let mut result = Vec::new();
        for (title, item_type, sort_order) in items {
            let item = sqlx::query_as::<_, Self>(
                "INSERT INTO checklist_items (patient_id, title, item_type, sort_order) VALUES ($1, $2, $3, $4) RETURNING *",
            )
            .bind(patient_id)
            .bind(title)
            .bind(item_type)
            .bind(sort_order)
            .fetch_one(pool)
            .await?;
            result.push(item);
        }
        Ok(result)
    }
}
