use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IolCalculation {
    pub id: Uuid,
    pub patient_id: Option<Uuid>,
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

pub struct CreateIolParams<'a> {
    pub patient_id: Option<Uuid>,
    pub eye: &'a str,
    pub k1: f64,
    pub k2: f64,
    pub axial_length: f64,
    pub acd: f64,
    pub target_refraction: f64,
    pub formula: &'a str,
    pub recommended_iol: f64,
}

impl IolCalculation {
    pub async fn create(pool: &PgPool, params: CreateIolParams<'_>) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO iol_calculations (patient_id, eye, k1, k2, axial_length, acd, target_refraction, formula, recommended_iol) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        )
        .bind(params.patient_id)
        .bind(params.eye)
        .bind(params.k1)
        .bind(params.k2)
        .bind(params.axial_length)
        .bind(params.acd)
        .bind(params.target_refraction)
        .bind(params.formula)
        .bind(params.recommended_iol)
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
