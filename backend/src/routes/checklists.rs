use actix_multipart::Multipart;
use actix_web::{HttpResponse, web};
use aws_sdk_s3::primitives::ByteStream;
use futures_util::StreamExt;
use sqlx::PgPool;
use uuid::Uuid;

use crate::AppState;
use crate::middleware::auth::AuthUser;
use crate::models::checklist::ChecklistItem;
use crate::models::media::{CreateMediaParams, MediaFile};
use crate::models::patient::Patient;

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
        Err(_) => {
            return HttpResponse::NotFound().json(serde_json::json!({"error": "Item not found"}));
        }
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
        Err(_) => {
            return HttpResponse::NotFound().json(serde_json::json!({"error": "Item not found"}));
        }
    };
    let _ = recalculate_patient_status(&state.db, item.patient_id).await;
    HttpResponse::Ok().json(item)
}

pub async fn upload(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    auth: AuthUser,
    mut payload: Multipart,
) -> HttpResponse {
    let id = path.into_inner();

    let item = match ChecklistItem::find_by_id(&state.db, id).await {
        Ok(Some(item)) => item,
        _ => return HttpResponse::NotFound().json(serde_json::json!({"error": "Item not found"})),
    };

    if let Some(Ok(mut field)) = payload.next().await {
        let filename = field
            .content_disposition()
            .and_then(|cd| cd.get_filename().map(|s| s.to_string()))
            .unwrap_or_else(|| "file".to_string());

        let content_type = field
            .content_type()
            .map(|ct| ct.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        let mut bytes = Vec::new();
        while let Some(Ok(chunk)) = field.next().await {
            bytes.extend_from_slice(&chunk);
        }

        let file_size = bytes.len() as i64;
        let file_uuid = Uuid::new_v4();
        let key = format!("checklists/{}/{}_{}", item.patient_id, file_uuid, filename);

        let put_result = state
            .s3_client
            .put_object()
            .bucket(&state.s3_bucket)
            .key(&key)
            .body(ByteStream::from(bytes))
            .content_type(&content_type)
            .send()
            .await;

        if put_result.is_err() {
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to upload file to S3"}));
        }

        let _ = MediaFile::create(
            &state.db,
            CreateMediaParams {
                patient_id: item.patient_id,
                checklist_item_id: Some(id),
                file_name: &filename,
                file_path: &key,
                file_type: &content_type,
                file_size,
                uploaded_by: auth.user_id,
            },
        )
        .await;

        let _ = ChecklistItem::set_file_path(&state.db, id, &key).await;
        let updated = match ChecklistItem::mark_completed(&state.db, id).await {
            Ok(item) => item,
            Err(_) => {
                return HttpResponse::InternalServerError()
                    .json(serde_json::json!({"error": "Failed to update item"}));
            }
        };
        let _ = recalculate_patient_status(&state.db, updated.patient_id).await;
        return HttpResponse::Ok().json(updated);
    }

    HttpResponse::BadRequest().json(serde_json::json!({"error": "No file provided"}))
}
