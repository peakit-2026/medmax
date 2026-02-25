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

pub struct CreateUserParams<'a> {
    pub email: &'a str,
    pub password_hash: &'a str,
    pub role: &'a str,
    pub full_name: &'a str,
    pub phone: Option<&'a str>,
    pub district: Option<&'a str>,
    pub organization: Option<&'a str>,
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

    pub async fn create(pool: &PgPool, params: CreateUserParams<'_>) -> sqlx::Result<Self> {
        sqlx::query_as::<_, Self>(
            "INSERT INTO users (email, password_hash, role, full_name, phone, district, organization) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        )
        .bind(params.email)
        .bind(params.password_hash)
        .bind(params.role)
        .bind(params.full_name)
        .bind(params.phone)
        .bind(params.district)
        .bind(params.organization)
        .fetch_one(pool)
        .await
    }
}
