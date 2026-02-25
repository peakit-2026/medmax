use actix_web::{web, HttpResponse};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};

use crate::middleware::auth::AuthUser;
use crate::models::user::{User, UserResponse};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub role: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub district: Option<String>,
    pub organization: Option<String>,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

fn create_token(user: &User, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = (Utc::now() + chrono::Duration::hours(24)).timestamp() as usize;
    let claims = Claims {
        sub: user.id.to_string(),
        role: user.role.clone(),
        exp,
    };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
}

pub async fn login(
    state: web::Data<AppState>,
    body: web::Json<LoginRequest>,
) -> HttpResponse {
    let user = match User::find_by_email(&state.db, &body.email).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return HttpResponse::Unauthorized()
                .json(serde_json::json!({"error": "Invalid credentials"}));
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    match verify(&body.password, &user.password_hash) {
        Ok(true) => {}
        _ => {
            return HttpResponse::Unauthorized()
                .json(serde_json::json!({"error": "Invalid credentials"}));
        }
    }

    let token = match create_token(&user, &state.jwt_secret) {
        Ok(t) => t,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Token generation failed"}));
        }
    };

    HttpResponse::Ok().json(AuthResponse {
        token,
        user: user.into(),
    })
}

pub async fn register(
    state: web::Data<AppState>,
    body: web::Json<RegisterRequest>,
) -> HttpResponse {
    let password_hash = match hash(&body.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Password hashing failed"}));
        }
    };

    let user = match User::create(
        &state.db,
        &body.email,
        &password_hash,
        &body.role,
        &body.full_name,
        body.phone.as_deref(),
        body.district.as_deref(),
        body.organization.as_deref(),
    )
    .await
    {
        Ok(u) => u,
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("duplicate key") || msg.contains("unique") {
                return HttpResponse::Conflict()
                    .json(serde_json::json!({"error": "Email already registered"}));
            }
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    let token = match create_token(&user, &state.jwt_secret) {
        Ok(t) => t,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Token generation failed"}));
        }
    };

    HttpResponse::Created().json(AuthResponse {
        token,
        user: user.into(),
    })
}

pub async fn me(
    state: web::Data<AppState>,
    auth: AuthUser,
) -> HttpResponse {
    match User::find_by_id(&state.db, auth.user_id).await {
        Ok(Some(user)) => HttpResponse::Ok().json(UserResponse::from(user)),
        Ok(None) => {
            HttpResponse::NotFound().json(serde_json::json!({"error": "User not found"}))
        }
        Err(_) => {
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}))
        }
    }
}
