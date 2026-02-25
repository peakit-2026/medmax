use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub district: Option<String>,
    pub organization: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub role: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub district: Option<String>,
    pub organization: Option<String>,
}

impl From<User> for UserResponse {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            role: u.role,
            full_name: u.full_name,
            phone: u.phone,
            district: u.district,
            organization: u.organization,
        }
    }
}

impl User {
    pub async fn find_by_email(pool: &PgPool, email: &str) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(pool)
            .await
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn create(
        pool: &PgPool,
        email: &str,
        password_hash: &str,
        role: &str,
        full_name: &str,
        phone: Option<&str>,
        district: Option<&str>,
        organization: Option<&str>,
    ) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO users (email, password_hash, role, full_name, phone, district, organization) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        )
        .bind(email)
        .bind(password_hash)
        .bind(role)
        .bind(full_name)
        .bind(phone)
        .bind(district)
        .bind(organization)
        .fetch_one(pool)
        .await
    }
}
