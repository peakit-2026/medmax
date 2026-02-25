use actix_multipart::Multipart;
use actix_web::{web, HttpResponse};
use futures_util::StreamExt;
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::models::media::MediaFile;
use crate::AppState;

pub async fn upload(
    state: web::Data<AppState>,
    auth: AuthUser,
    mut payload: Multipart,
) -> HttpResponse {
    let mut patient_id: Option<Uuid> = None;
    let mut checklist_item_id: Option<Uuid> = None;
    let mut file_data: Option<(String, String, Vec<u8>)> = None;

    while let Some(Ok(mut field)) = payload.next().await {
        let name = field
            .content_disposition()
            .and_then(|cd| cd.get_name().map(|s| s.to_string()))
            .unwrap_or_default();

        match name.as_str() {
            "patient_id" => {
                let mut buf = Vec::new();
                while let Some(Ok(chunk)) = field.next().await {
                    buf.extend_from_slice(&chunk);
                }
                let val = String::from_utf8_lossy(&buf).to_string();
                patient_id = Uuid::parse_str(val.trim()).ok();
            }
            "checklist_item_id" => {
                let mut buf = Vec::new();
                while let Some(Ok(chunk)) = field.next().await {
                    buf.extend_from_slice(&chunk);
                }
                let val = String::from_utf8_lossy(&buf).to_string();
                checklist_item_id = Uuid::parse_str(val.trim()).ok();
            }
            "file" => {
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
                file_data = Some((filename, content_type, bytes));
            }
            _ => {
                while let Some(Ok(_)) = field.next().await {}
            }
        }
    }

    let patient_id = match patient_id {
        Some(id) => id,
        None => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "patient_id is required"}))
        }
    };

    let (filename, content_type, bytes) = match file_data {
        Some(data) => data,
        None => {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "file is required"}))
        }
    };

    let file_size = bytes.len() as i64;
    let file_uuid = Uuid::new_v4();
    let stored_name = format!("{}_{}", file_uuid, filename);
    let dir = format!("{}/media/{}", state.upload_dir, patient_id);

    if std::fs::create_dir_all(&dir).is_err() {
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to create directory"}));
    }

    let full_path = format!("{}/{}", dir, stored_name);
    if std::fs::write(&full_path, &bytes).is_err() {
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to write file"}));
    }

    if content_type.starts_with("image/") {
        if let Ok(img) = image::load_from_memory(&bytes) {
            let (w, h) = (img.width(), img.height());
            let (new_w, new_h) = if w > 400 {
                (400, (h as f64 * 400.0 / w as f64) as u32)
            } else {
                (w, h)
            };
            let thumb = image::imageops::resize(
                &img,
                new_w,
                new_h,
                image::imageops::FilterType::Lanczos3,
            );
            let thumb_path = format!("{}/thumb_{}", dir, stored_name);
            let _ = thumb.save(&thumb_path);
        }
    }

    let relative_path = format!("media/{}/{}", patient_id, stored_name);

    match MediaFile::create(
        &state.db,
        patient_id,
        checklist_item_id,
        &filename,
        &relative_path,
        &content_type,
        file_size,
        auth.user_id,
    )
    .await
    {
        Ok(media) => HttpResponse::Ok().json(media),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to create media record"})),
    }
}

pub async fn list_by_patient(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    _auth: AuthUser,
) -> HttpResponse {
    let patient_id = path.into_inner();
    match MediaFile::list_by_patient(&state.db, patient_id).await {
        Ok(files) => HttpResponse::Ok().json(files),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to list media"})),
    }
}

pub async fn serve_file(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let id = path.into_inner();
    let media = match MediaFile::find_by_id(&state.db, id).await {
        Ok(Some(m)) => m,
        _ => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "File not found"}))
        }
    };

    let full_path = format!("{}/{}", state.upload_dir, media.file_path);
    match std::fs::read(&full_path) {
        Ok(bytes) => HttpResponse::Ok()
            .content_type(media.file_type)
            .body(bytes),
        Err(_) => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "File not found on disk"})),
    }
}

pub async fn serve_thumb(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let id = path.into_inner();
    let media = match MediaFile::find_by_id(&state.db, id).await {
        Ok(Some(m)) => m,
        _ => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "File not found"}))
        }
    };

    let parts: Vec<&str> = media.file_path.rsplitn(2, '/').collect();
    let thumb_path = if parts.len() == 2 {
        format!("{}/{}/thumb_{}", state.upload_dir, parts[1], parts[0])
    } else {
        format!("{}/thumb_{}", state.upload_dir, media.file_path)
    };

    match std::fs::read(&thumb_path) {
        Ok(bytes) => HttpResponse::Ok()
            .content_type(media.file_type.clone())
            .body(bytes),
        Err(_) => {
            let full_path = format!("{}/{}", state.upload_dir, media.file_path);
            match std::fs::read(&full_path) {
                Ok(bytes) => HttpResponse::Ok()
                    .content_type(media.file_type)
                    .body(bytes),
                Err(_) => HttpResponse::NotFound()
                    .json(serde_json::json!({"error": "Thumbnail not found"})),
            }
        }
    }
}

pub async fn delete(
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    _auth: AuthUser,
) -> HttpResponse {
    let id = path.into_inner();
    let media = match MediaFile::find_by_id(&state.db, id).await {
        Ok(Some(m)) => m,
        _ => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "File not found"}))
        }
    };

    let full_path = format!("{}/{}", state.upload_dir, media.file_path);
    let _ = std::fs::remove_file(&full_path);

    let parts: Vec<&str> = media.file_path.rsplitn(2, '/').collect();
    let thumb_path = if parts.len() == 2 {
        format!("{}/{}/thumb_{}", state.upload_dir, parts[1], parts[0])
    } else {
        format!("{}/thumb_{}", state.upload_dir, media.file_path)
    };
    let _ = std::fs::remove_file(&thumb_path);

    match MediaFile::delete(&state.db, id).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(_) => HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "Failed to delete media record"})),
    }
}
