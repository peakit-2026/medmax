use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IolCalculation {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub eye: String,
    pub k1: f64,
    pub k2: f64,
    pub axial_length: f64,
    pub acd: f64,
    pub target_refraction: f64,
    pub formula: String,
    pub recommended_iol: f64,
    pub created_at: DateTime<Utc>,
}

impl IolCalculation {
    pub async fn create(
        pool: &PgPool,
        patient_id: Uuid,
        eye: &str,
        k1: f64,
        k2: f64,
        axial_length: f64,
        acd: f64,
        target_refraction: f64,
        formula: &str,
        recommended_iol: f64,
    ) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO iol_calculations (patient_id, eye, k1, k2, axial_length, acd, target_refraction, formula, recommended_iol) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        )
        .bind(patient_id)
        .bind(eye)
        .bind(k1)
        .bind(k2)
        .bind(axial_length)
        .bind(acd)
        .bind(target_refraction)
        .bind(formula)
        .bind(recommended_iol)
        .fetch_one(pool)
        .await
    }

    pub async fn list_by_patient(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<Vec<Self>> {
        sqlx::query_as::<_, Self>(
            "SELECT * FROM iol_calculations WHERE patient_id = $1 ORDER BY created_at DESC",
        )
        .bind(patient_id)
        .fetch_all(pool)
        .await
    }
}
