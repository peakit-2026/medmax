use actix_web::{HttpResponse, web};
use chrono::NaiveDate;
use serde::Deserialize;
use uuid::Uuid;

use crate::AppState;
use crate::middleware::auth::AuthUser;
use crate::models::comment::Comment;
use crate::models::patient::{Patient, UpdatePatientParams};
use crate::services::telegram::notify_patient;

#[derive(Deserialize)]
pub struct ApproveRequest {
    pub operation_date: Option<NaiveDate>,
}

#[derive(Deserialize)]
pub struct RejectRequest {
    pub comment: String,
}

#[derive(Deserialize)]
pub struct CreateCommentRequest {
    pub patient_id: Uuid,
    pub content: String,
}

pub async fn approve(
    state: web::Data<AppState>,
    auth: AuthUser,
    path: web::Path<Uuid>,
    body: web::Json<ApproveRequest>,
) -> HttpResponse {
    if auth.role != "surgeon" {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Only surgeons can approve patients"}));
    }

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

    if let Some(op_date) = body.operation_date {
        let _ = Patient::update(
            &state.db,
            UpdatePatientParams {
                id,
                full_name: &patient.full_name,
                birth_date: patient.birth_date,
                snils: patient.snils.as_deref(),
                insurance_policy: patient.insurance_policy.as_deref(),
                diagnosis_code: &patient.diagnosis_code,
                diagnosis_text: &patient.diagnosis_text,
                operation_type: &patient.operation_type,
                notes: patient.notes.as_deref(),
                operation_date: Some(op_date),
            },
        )
        .await;
    }

    match sqlx::query_as::<_, Patient>(
        "UPDATE patients SET status = 'green', surgeon_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await
    {
        Ok(p) => {
            let date_str = body
                .operation_date
                .map(|d| d.to_string())
                .unwrap_or_else(|| "не назначена".to_string());
            notify_patient(
                &state.db,
                id,
                &format!(
                    "Ваша подготовка подтверждена хирургом! Дата операции: {}",
                    date_str
                ),
            )
            .await;
            HttpResponse::Ok().json(p)
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to approve patient"})),
    }
}

pub async fn reject(
    state: web::Data<AppState>,
    auth: AuthUser,
    path: web::Path<Uuid>,
    body: web::Json<RejectRequest>,
) -> HttpResponse {
    if auth.role != "surgeon" {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Only surgeons can reject patients"}));
    }

    let id = path.into_inner();

    match Patient::find_by_id(&state.db, id).await {
        Ok(Some(_)) => {}
        Ok(None) => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "Patient not found"}));
        }
        Err(_) => {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Database error"}));
        }
    }

    let _ = Comment::create(&state.db, id, auth.user_id, &body.comment).await;

    match Patient::update_status(&state.db, id, "red").await {
        Ok(p) => {
            notify_patient(
                &state.db,
                id,
                "Хирург оставил комментарий к вашей подготовке. Проверьте статус.",
            )
            .await;
            HttpResponse::Ok().json(p)
        }
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to reject patient"})),
    }
}

pub async fn create_comment(
    state: web::Data<AppState>,
    auth: AuthUser,
    body: web::Json<CreateCommentRequest>,
) -> HttpResponse {
    match Comment::create(&state.db, body.patient_id, auth.user_id, &body.content).await {
        Ok(comment) => HttpResponse::Created().json(comment),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to create comment"})),
    }
}

pub async fn list_comments(
    state: web::Data<AppState>,
    _auth: AuthUser,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let patient_id = path.into_inner();

    match Comment::list_with_author(&state.db, patient_id).await {
        Ok(comments) => HttpResponse::Ok().json(comments),
        Err(_) => {
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Database error"}))
        }
    }
}
