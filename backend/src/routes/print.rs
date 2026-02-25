use actix_web::{web, HttpResponse};
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::models::checklist::ChecklistItem;
use crate::models::patient::Patient;
use crate::services::pdf;
use crate::AppState;

pub async fn route_sheet(
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

    let checklist_titles: Vec<String> = checklist.iter().map(|c| c.title.clone()).collect();

    let diagnosis = format!("{} {}", patient.diagnosis_code, patient.diagnosis_text);
    let generation_date = chrono::Utc::now().format("%d.%m.%Y").to_string();

    let pdf_bytes = pdf::generate_route_sheet(
        &patient.full_name,
        &patient.birth_date.format("%d.%m.%Y").to_string(),
        patient.snils.as_deref().unwrap_or("\u{2014}"),
        patient.insurance_policy.as_deref().unwrap_or("\u{2014}"),
        &diagnosis,
        &patient.operation_type,
        &checklist_titles,
        &patient.access_code,
        &generation_date,
    );

    HttpResponse::Ok()
        .content_type("application/pdf")
        .insert_header((
            "Content-Disposition",
            "attachment; filename=\"route-sheet.pdf\"",
        ))
        .body(pdf_bytes)
}
