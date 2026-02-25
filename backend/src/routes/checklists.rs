use actix_multipart::Multipart;
use actix_web::{web, HttpResponse};
use futures_util::StreamExt;
use sqlx::PgPool;
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::models::checklist::ChecklistItem;
use crate::models::patient::Patient;
use crate::AppState;

pub async fn recalculate_patient_status(pool: &PgPool, patient_id: Uuid) -> sqlx::Result<String> {
    let items = ChecklistItem::list_by_patient(pool, patient_id).await?;
    if items.is_empty() {
        return Ok("red".to_string());
    }
    let completed = items.iter().filter(|i| i.is_completed).count();
    let new_status = if completed == 0 { "red" } else { "yellow" };
    Patient::update_status(pool, patient_id, new_status).await?;
    Ok(new_status.to_string())
}

pub async fn complete(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    _auth: AuthUser,
) -> HttpResponse {
    let id = path.into_inner();
    let item = match ChecklistItem::mark_completed(&state.db, id).await {
        Ok(item) => item,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Item not found"})),
    };
    let _ = recalculate_patient_status(&state.db, item.patient_id).await;
    HttpResponse::Ok().json(item)
}

pub async fn uncomplete(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    _auth: AuthUser,
) -> HttpResponse {
    let id = path.into_inner();
    let item = match ChecklistItem::mark_uncompleted(&state.db, id).await {
        Ok(item) => item,
        Err(_) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Item not found"})),
    };
    let _ = recalculate_patient_status(&state.db, item.patient_id).await;
    HttpResponse::Ok().json(item)
}

pub async fn upload(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    _auth: AuthUser,
    mut payload: Multipart,
) -> HttpResponse {
    let id = path.into_inner();

    let item = match ChecklistItem::find_by_id(&state.db, id).await {
        Ok(Some(item)) => item,
        _ => return HttpResponse::NotFound().json(serde_json::json!({"error": "Item not found"})),
    };

    while let Some(Ok(mut field)) = payload.next().await {
        let filename = field
            .content_disposition()
            .and_then(|cd| cd.get_filename().map(|s| s.to_string()))
            .unwrap_or_else(|| "file".to_string());

        let dir = format!("{}/{}", state.upload_dir, item.patient_id);
        if let Err(_) = std::fs::create_dir_all(&dir) {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to create upload directory"}));
        }

        let filepath = format!("{}/{}", dir, filename);
        let mut bytes = Vec::new();
        while let Some(Ok(chunk)) = field.next().await {
            bytes.extend_from_slice(&chunk);
        }

        if let Err(_) = std::fs::write(&filepath, &bytes) {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to write file"}));
        }

        let relative_path = format!("{}/{}", item.patient_id, filename);
        let _ = ChecklistItem::set_file_path(&state.db, id, &relative_path).await;
        let updated = match ChecklistItem::mark_completed(&state.db, id).await {
            Ok(item) => item,
            Err(_) => return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to update item"})),
        };
        let _ = recalculate_patient_status(&state.db, updated.patient_id).await;
        return HttpResponse::Ok().json(updated);
    }

    HttpResponse::BadRequest().json(serde_json::json!({"error": "No file provided"}))
}
