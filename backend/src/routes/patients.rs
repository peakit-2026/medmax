use actix_web::{web, HttpResponse};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::models::checklist::ChecklistItem;
use crate::models::patient::{generate_access_code, Patient};
use crate::AppState;

#[derive(Deserialize)]
pub struct CreatePatientRequest {
    pub full_name: String,
    pub birth_date: NaiveDate,
    pub snils: Option<String>,
    pub insurance_policy: Option<String>,
    pub diagnosis_code: String,
    pub diagnosis_text: String,
    pub operation_type: String,
    pub notes: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdatePatientRequest {
    pub full_name: String,
    pub birth_date: NaiveDate,
    pub snils: Option<String>,
    pub insurance_policy: Option<String>,
    pub diagnosis_code: String,
    pub diagnosis_text: String,
    pub operation_type: String,
    pub notes: Option<String>,
    pub operation_date: Option<NaiveDate>,
}

#[derive(Serialize)]
pub struct PatientWithChecklist {
    #[serde(flatten)]
    pub patient: Patient,
    pub checklist: Vec<ChecklistItem>,
}

pub async fn list(state: web::Data<AppState>, auth: AuthUser) -> HttpResponse {
    let result = match auth.role.as_str() {
        "doctor" => Patient::list_by_doctor(&state.db, auth.user_id).await,
        "surgeon" => Patient::list_all(&state.db).await,
        _ => {
            return HttpResponse::Forbidden()
                .json(serde_json::json!({"error": "Access denied"}));
        }
    };

    match result {
        Ok(patients) => HttpResponse::Ok().json(patients),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Database error"})),
    }
}

pub async fn create(
    state: web::Data<AppState>,
    auth: AuthUser,
    body: web::Json<CreatePatientRequest>,
) -> HttpResponse {
    if auth.role != "doctor" {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Only doctors can create patients"}));
    }

    let access_code = generate_access_code();

    let patient = match Patient::create(
        &state.db,
        auth.user_id,
        &body.full_name,
        body.birth_date,
        body.snils.as_deref(),
        body.insurance_policy.as_deref(),
        &body.diagnosis_code,
        &body.diagnosis_text,
        &body.operation_type,
        body.notes.as_deref(),
        &access_code,
    )
    .await
    {
        Ok(p) => p,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to create patient"}));
        }
    };

    let checklist =
        match ChecklistItem::create_default_checklist(&state.db, patient.id, &body.operation_type)
            .await
        {
            Ok(c) => c,
            Err(_) => {
                return HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": "Failed to create checklist"}));
            }
        };

    HttpResponse::Created().json(PatientWithChecklist { patient, checklist })
}

pub async fn get(
    state: web::Data<AppState>,
    auth: AuthUser,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let id = path.into_inner();

    let patient = match Patient::find_by_id(&state.db, id).await {
        Ok(Some(p)) => p,
        Ok(None) => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "Patient not found"}));
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    if auth.role == "doctor" && patient.doctor_id != auth.user_id {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Access denied"}));
    }

    let checklist = match ChecklistItem::list_by_patient(&state.db, patient.id).await {
        Ok(c) => c,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    HttpResponse::Ok().json(PatientWithChecklist { patient, checklist })
}

pub async fn update(
    state: web::Data<AppState>,
    auth: AuthUser,
    path: web::Path<Uuid>,
    body: web::Json<UpdatePatientRequest>,
) -> HttpResponse {
    let id = path.into_inner();

    let existing = match Patient::find_by_id(&state.db, id).await {
        Ok(Some(p)) => p,
        Ok(None) => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "Patient not found"}));
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    if auth.role == "doctor" && existing.doctor_id != auth.user_id {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Access denied"}));
    }

    match Patient::update(
        &state.db,
        id,
        &body.full_name,
        body.birth_date,
        body.snils.as_deref(),
        body.insurance_policy.as_deref(),
        &body.diagnosis_code,
        &body.diagnosis_text,
        &body.operation_type,
        body.notes.as_deref(),
        body.operation_date,
    )
    .await
    {
        Ok(patient) => HttpResponse::Ok().json(patient),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to update patient"})),
    }
}

pub async fn get_by_code(state: web::Data<AppState>, path: web::Path<String>) -> HttpResponse {
    let code = path.into_inner();

    let patient = match Patient::find_by_access_code(&state.db, &code).await {
        Ok(Some(p)) => p,
        Ok(None) => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "Patient not found"}));
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    let checklist = match ChecklistItem::list_by_patient(&state.db, patient.id).await {
        Ok(c) => c,
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    };

    HttpResponse::Ok().json(PatientWithChecklist { patient, checklist })
}
