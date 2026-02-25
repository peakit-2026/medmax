use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid token: {0}")]
    InvalidToken(String),
    #[error("Invalid token type")]
    InvalidTokenType,
    #[error("Token expired")]
    TokenExpired,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RoomTicketClaims {
    pub sub: String,
    pub room_id: String,
    pub name: String,
    pub typ: String,
    pub iat: i64,
    pub exp: i64,
}

pub struct JwtValidator {
    decoding_key: DecodingKey,
}

impl JwtValidator {
    pub fn new(secret: &str) -> Self {
        Self {
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
        }
    }

    pub fn validate(&self, token: &str) -> Result<RoomTicketClaims, AuthError> {
        let claims = decode::<RoomTicketClaims>(
            token,
            &self.decoding_key,
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|e| {
            if e.to_string().contains("ExpiredSignature") {
                AuthError::TokenExpired
            } else {
                AuthError::InvalidToken(e.to_string())
            }
        })?
        .claims;

        if claims.typ != "roomticket" {
            return Err(AuthError::InvalidTokenType);
        }

        Ok(claims)
    }
}
