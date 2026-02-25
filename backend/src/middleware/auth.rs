use std::future::{ready, Ready};

use actix_web::dev::Payload;
use actix_web::{web, FromRequest, HttpRequest};
use jsonwebtoken::{decode, DecodingKey, Validation};
use uuid::Uuid;

use crate::routes::auth::Claims;
use crate::AppState;

pub struct AuthUser {
    pub user_id: Uuid,
    pub role: String,
}

impl FromRequest for AuthUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let result = (|| {
            let state = req.app_data::<web::Data<AppState>>()?;

            let auth_header = req.headers().get("Authorization")?.to_str().ok()?;
            let token = auth_header.strip_prefix("Bearer ")?;

            let token_data = decode::<Claims>(
                token,
                &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
                &Validation::default(),
            )
            .ok()?;

            let user_id = Uuid::parse_str(&token_data.claims.sub).ok()?;

            Some(AuthUser {
                user_id,
                role: token_data.claims.role,
            })
        })();

        match result {
            Some(auth_user) => ready(Ok(auth_user)),
            None => ready(Err(actix_web::error::ErrorUnauthorized("Unauthorized"))),
        }
    }
}
