use actix_web::{web, HttpResponse};
use serde::Deserialize;
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::models::iol::IolCalculation;
use crate::services::iol;
use crate::AppState;

#[derive(Deserialize)]
pub struct CalculateRequest {
    pub patient_id: Uuid,
    pub eye: String,
    pub k1: f64,
    pub k2: f64,
    pub axial_length: f64,
    pub acd: f64,
    pub target_refraction: f64,
    pub formula: String,
}

pub async fn calculate(
    state: web::Data<AppState>,
    _auth: AuthUser,
    body: web::Json<CalculateRequest>,
) -> HttpResponse {
    let k_avg = (body.k1 + body.k2) / 2.0;

    let recommended_iol = match body.formula.as_str() {
        "srk_t" => iol::srk_t(body.axial_length, k_avg, 118.4, body.target_refraction),
        "haigis" => iol::haigis(
            body.axial_length,
            k_avg,
            body.acd,
            1.277,
            0.400,
            0.100,
            body.target_refraction,
        ),
        _ => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Unknown formula"}));
        }
    };

    match IolCalculation::create(
        &state.db,
        body.patient_id,
        &body.eye,
        body.k1,
        body.k2,
        body.axial_length,
        body.acd,
        body.target_refraction,
        &body.formula,
        recommended_iol,
    )
    .await
    {
        Ok(calc) => HttpResponse::Ok().json(calc),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to save calculation"})),
    }
}

pub async fn list_by_patient(
    state: web::Data<AppState>,
    _auth: AuthUser,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let patient_id = path.into_inner();

    match IolCalculation::list_by_patient(&state.db, patient_id).await {
        Ok(calcs) => HttpResponse::Ok().json(calcs),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Database error"})),
    }
}
