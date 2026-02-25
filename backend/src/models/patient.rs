use chrono::{DateTime, NaiveDate, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Patient {
    pub id: Uuid,
    pub doctor_id: Uuid,
    pub surgeon_id: Option<Uuid>,
    pub full_name: String,
    pub birth_date: NaiveDate,
    pub snils: Option<String>,
    pub insurance_policy: Option<String>,
    pub diagnosis_code: String,
    pub diagnosis_text: String,
    pub operation_type: String,
    pub status: String,
    pub access_code: String,
    pub operation_date: Option<NaiveDate>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub fn generate_access_code() -> String {
    let mut rng = rand::thread_rng();
    let code: u32 = rng.gen_range(10000000..99999999);
    code.to_string()
}

impl Patient {
    pub async fn list_by_doctor(pool: &PgPool, doctor_id: Uuid) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>(
            "SELECT * FROM patients WHERE doctor_id = $1 ORDER BY created_at DESC",
        )
        .bind(doctor_id)
        .fetch_all(pool)
        .await
    }

    pub async fn list_all(pool: &PgPool) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM patients ORDER BY created_at DESC")
            .fetch_all(pool)
            .await
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM patients WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_access_code(pool: &PgPool, code: &str) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM patients WHERE access_code = $1")
            .bind(code)
            .fetch_optional(pool)
            .await
    }

    pub async fn create(
        pool: &PgPool,
        doctor_id: Uuid,
        full_name: &str,
        birth_date: NaiveDate,
        snils: Option<&str>,
        insurance_policy: Option<&str>,
        diagnosis_code: &str,
        diagnosis_text: &str,
        operation_type: &str,
        notes: Option<&str>,
        access_code: &str,
    ) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO patients (doctor_id, full_name, birth_date, snils, insurance_policy, diagnosis_code, diagnosis_text, operation_type, notes, access_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
        )
        .bind(doctor_id)
        .bind(full_name)
        .bind(birth_date)
        .bind(snils)
        .bind(insurance_policy)
        .bind(diagnosis_code)
        .bind(diagnosis_text)
        .bind(operation_type)
        .bind(notes)
        .bind(access_code)
        .fetch_one(pool)
        .await
    }

    pub async fn update_status(pool: &PgPool, id: Uuid, status: &str) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "UPDATE patients SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .bind(status)
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        pool: &PgPool,
        id: Uuid,
        full_name: &str,
        birth_date: NaiveDate,
        snils: Option<&str>,
        insurance_policy: Option<&str>,
        diagnosis_code: &str,
        diagnosis_text: &str,
        operation_type: &str,
        notes: Option<&str>,
        operation_date: Option<NaiveDate>,
    ) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "UPDATE patients SET full_name = $2, birth_date = $3, snils = $4, insurance_policy = $5, diagnosis_code = $6, diagnosis_text = $7, operation_type = $8, notes = $9, operation_date = $10, updated_at = NOW() WHERE id = $1 RETURNING *",
        )
        .bind(id)
        .bind(full_name)
        .bind(birth_date)
        .bind(snils)
        .bind(insurance_policy)
        .bind(diagnosis_code)
        .bind(diagnosis_text)
        .bind(operation_type)
        .bind(notes)
        .bind(operation_date)
        .fetch_one(pool)
        .await
    }
}
