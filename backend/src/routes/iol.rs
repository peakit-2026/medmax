use actix_web::{HttpResponse, web};
use serde::Deserialize;
use uuid::Uuid;

use crate::AppState;
use crate::middleware::auth::AuthUser;
use crate::models::iol::{CreateIolParams, IolCalculation};
use crate::services::iol;

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
        CreateIolParams {
            patient_id: body.patient_id,
            eye: &body.eye,
            k1: body.k1,
            k2: body.k2,
            axial_length: body.axial_length,
            acd: body.acd,
            target_refraction: body.target_refraction,
            formula: &body.formula,
            recommended_iol,
        },
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
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}
