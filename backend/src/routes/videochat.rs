use actix_web::{HttpResponse, web};
use chrono::Utc;
use jsonwebtoken::{EncodingKey, Header, encode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::AppState;
use crate::middleware::auth::AuthUser;
use crate::models::user::User;

#[derive(Deserialize)]
pub struct TicketRequest {
    pub room_id: Uuid,
}

#[derive(Serialize)]
struct TicketResponse {
    ticket: String,
    sfu_url: String,
}

#[derive(Serialize)]
struct RoomTicketClaims {
    sub: String,
    room_id: String,
    name: String,
    typ: String,
    iat: i64,
    exp: i64,
}

pub async fn create_ticket(
    state: web::Data<AppState>,
    auth: AuthUser,
    body: web::Json<TicketRequest>,
) -> HttpResponse {
    let user = match User::find_by_id(&state.db, auth.user_id).await {
        Ok(Some(u)) => u,
        _ => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "User not found"}));
        }
    };

    let sfu_secret = state.sfu_jwt_secret.as_deref().unwrap_or(&state.jwt_secret);

    let now = Utc::now().timestamp();
    let claims = RoomTicketClaims {
        sub: auth.user_id.to_string(),
        room_id: body.room_id.to_string(),
        name: user.full_name,
        typ: "roomticket".to_string(),
        iat: now,
        exp: now + 3600,
    };

    let token = match encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(sfu_secret.as_bytes()),
    ) {
        Ok(t) => t,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Token generation failed"}));
        }
    };

    let sfu_url = state
        .sfu_url
        .clone()
        .unwrap_or_else(|| "https://localhost:4433".to_string());

    HttpResponse::Ok().json(TicketResponse {
        ticket: token,
        sfu_url,
    })
}
