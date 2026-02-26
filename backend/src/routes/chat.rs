use std::collections::HashMap;
use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use actix_ws::Message as WsMessage;
use aws_sdk_s3::primitives::ByteStream;
use chrono::{DateTime, Utc};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::models::chat::{Conversation, Message, MessageAttachment, MessageResponse};
use crate::routes::auth::Claims;
use crate::AppState;

// ── WebSocket state ─────────────────────────────────────────────────────

pub type WsState = Arc<RwLock<WsConnections>>;

pub struct WsConnections {
    connections: HashMap<Uuid, broadcast::Sender<String>>,
}

impl WsConnections {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
        }
    }

    pub fn register(&mut self, user_id: Uuid) -> broadcast::Receiver<String> {
        let entry = self
            .connections
            .entry(user_id)
            .or_insert_with(|| broadcast::channel(64).0);
        entry.subscribe()
    }

    pub fn unregister(&mut self, user_id: Uuid) {
        if let Some(sender) = self.connections.get(&user_id) {
            if sender.receiver_count() <= 1 {
                self.connections.remove(&user_id);
            }
        }
    }

    pub fn send_to_user(&self, user_id: Uuid, msg: &str) {
        if let Some(sender) = self.connections.get(&user_id) {
            let _ = sender.send(msg.to_string());
        }
    }
}

// ── WebSocket protocol types ────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
enum WsIncoming {
    SendMessage {
        conversation_id: Uuid,
        content: Option<String>,
        reply_to_id: Option<Uuid>,
    },
    Typing {
        conversation_id: Uuid,
    },
    MarkRead {
        conversation_id: Uuid,
    },
    CallStarted {
        conversation_id: Uuid,
        room_id: Uuid,
    },
    CallEnded {
        conversation_id: Uuid,
    },
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
enum WsOutgoing {
    NewMessage {
        message: MessageResponse,
    },
    Typing {
        conversation_id: Uuid,
        user_id: Uuid,
    },
    MessagesRead {
        conversation_id: Uuid,
        user_id: Uuid,
    },
    CallStarted {
        conversation_id: Uuid,
        room_id: Uuid,
        caller_id: Uuid,
        caller_name: String,
    },
    CallEnded {
        conversation_id: Uuid,
        user_id: Uuid,
    },
}

// ── Helper: get the "other" user in a conversation ──────────────────────

async fn get_other_user_id(
    pool: &sqlx::PgPool,
    conversation_id: Uuid,
    my_user_id: Uuid,
) -> Option<Uuid> {
    #[derive(sqlx::FromRow)]
    struct ConvRow {
        doctor_id: Uuid,
        surgeon_id: Uuid,
    }
    let row = sqlx::query_as::<_, ConvRow>(
        "SELECT doctor_id, surgeon_id FROM conversations WHERE id = $1",
    )
    .bind(conversation_id)
    .fetch_optional(pool)
    .await
    .ok()??;

    if row.doctor_id == my_user_id {
        Some(row.surgeon_id)
    } else {
        Some(row.doctor_id)
    }
}

// ── WebSocket handler ───────────────────────────────────────────────────

pub async fn ws_handler(
    req: HttpRequest,
    body: web::Payload,
    state: web::Data<AppState>,
    ws_state: web::Data<WsState>,
) -> Result<HttpResponse, actix_web::Error> {
    // Auth from query param: ?token=xxx
    let token = web::Query::<HashMap<String, String>>::from_query(req.query_string())
        .ok()
        .and_then(|q| q.get("token").cloned())
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("Missing token"))?;

    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &jsonwebtoken::Validation::default(),
    )
    .map_err(|_| actix_web::error::ErrorUnauthorized("Invalid token"))?;

    let user_id = Uuid::parse_str(&token_data.claims.sub)
        .map_err(|_| actix_web::error::ErrorUnauthorized("Invalid token sub"))?;

    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, body)?;

    // Register user
    let mut rx = {
        let mut conns = ws_state.write().await;
        conns.register(user_id)
    };

    let state_clone = state.clone();
    let ws_state_clone = ws_state.clone();

    // Spawn async task to handle this WS connection
    actix_web::rt::spawn(async move {
        let pool = &state_clone.db;

        loop {
            tokio::select! {
                // Incoming WS message from the client
                incoming = msg_stream.next() => {
                    match incoming {
                        Some(Ok(WsMessage::Text(text))) => {
                            if let Ok(msg) = serde_json::from_str::<WsIncoming>(&text) {
                                handle_ws_message(
                                    pool,
                                    &ws_state_clone,
                                    user_id,
                                    msg,
                                )
                                .await;
                            }
                        }
                        Some(Ok(WsMessage::Ping(bytes))) => {
                            let _ = session.pong(&bytes).await;
                        }
                        Some(Ok(WsMessage::Close(_))) | None => {
                            break;
                        }
                        _ => {}
                    }
                }
                // Outgoing broadcast message to this user
                outgoing = rx.recv() => {
                    match outgoing {
                        Ok(text) => {
                            if session.text(text).await.is_err() {
                                break;
                            }
                        }
                        Err(broadcast::error::RecvError::Lagged(_)) => {
                            continue;
                        }
                        Err(_) => {
                            break;
                        }
                    }
                }
            }
        }

        // Cleanup on disconnect
        let _ = session.close(None).await;
        let mut conns = ws_state_clone.write().await;
        conns.unregister(user_id);
    });

    Ok(response)
}

async fn handle_ws_message(
    pool: &sqlx::PgPool,
    ws_state: &web::Data<WsState>,
    user_id: Uuid,
    msg: WsIncoming,
) {
    match msg {
        WsIncoming::SendMessage {
            conversation_id,
            content,
            reply_to_id,
        } => {
            let created = Message::create(
                pool,
                conversation_id,
                user_id,
                content.as_deref(),
                reply_to_id,
            )
            .await;

            if let Ok(msg_row) = created {
                if let Ok(response) = Message::to_response(pool, &msg_row).await {
                    let outgoing = WsOutgoing::NewMessage { message: response };
                    if let Ok(json) = serde_json::to_string(&outgoing) {
                        let conns = ws_state.read().await;
                        // Send to sender
                        conns.send_to_user(user_id, &json);
                        // Send to other user
                        if let Some(other) =
                            get_other_user_id(pool, conversation_id, user_id).await
                        {
                            conns.send_to_user(other, &json);
                        }
                    }
                }
            }
        }
        WsIncoming::Typing { conversation_id } => {
            let outgoing = WsOutgoing::Typing {
                conversation_id,
                user_id,
            };
            if let Ok(json) = serde_json::to_string(&outgoing) {
                if let Some(other) = get_other_user_id(pool, conversation_id, user_id).await {
                    let conns = ws_state.read().await;
                    conns.send_to_user(other, &json);
                }
            }
        }
        WsIncoming::MarkRead { conversation_id } => {
            let _ = Message::mark_read(pool, conversation_id, user_id).await;
            let outgoing = WsOutgoing::MessagesRead {
                conversation_id,
                user_id,
            };
            if let Ok(json) = serde_json::to_string(&outgoing) {
                if let Some(other) = get_other_user_id(pool, conversation_id, user_id).await {
                    let conns = ws_state.read().await;
                    conns.send_to_user(other, &json);
                }
            }
        }
        WsIncoming::CallStarted {
            conversation_id,
            room_id,
        } => {
            #[derive(sqlx::FromRow)]
            struct NameRow {
                full_name: String,
            }
            let caller_name = sqlx::query_as::<_, NameRow>(
                "SELECT full_name FROM users WHERE id = $1",
            )
            .bind(user_id)
            .fetch_optional(pool)
            .await
            .ok()
            .flatten()
            .map(|r| r.full_name)
            .unwrap_or_default();

            let outgoing = WsOutgoing::CallStarted {
                conversation_id,
                room_id,
                caller_id: user_id,
                caller_name,
            };
            if let Ok(json) = serde_json::to_string(&outgoing) {
                if let Some(other) = get_other_user_id(pool, conversation_id, user_id).await {
                    let conns = ws_state.read().await;
                    conns.send_to_user(other, &json);
                }
            }
        }
        WsIncoming::CallEnded { conversation_id } => {
            let outgoing = WsOutgoing::CallEnded {
                conversation_id,
                user_id,
            };
            if let Ok(json) = serde_json::to_string(&outgoing) {
                if let Some(other) = get_other_user_id(pool, conversation_id, user_id).await {
                    let conns = ws_state.read().await;
                    conns.send_to_user(other, &json);
                }
            }
        }
    }
}

// ── REST Endpoints ──────────────────────────────────────────────────────

/// GET /api/conversations
pub async fn list_conversations(
    state: web::Data<AppState>,
    auth: AuthUser,
) -> HttpResponse {
    // Only doctors and surgeons have conversations
    if auth.role != "doctor" && auth.role != "surgeon" {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Only doctors and surgeons can use chat"}));
    }

    if let Err(e) = Conversation::ensure_all_for_user(&state.db, auth.user_id, &auth.role).await {
        log::error!("Failed to ensure conversations: {:?}", e);
    }

    match Conversation::list_for_user(&state.db, auth.user_id, &auth.role).await {
        Ok(items) => HttpResponse::Ok().json(items),
        Err(e) => {
            log::error!("Failed to list conversations: {:?}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to list conversations"}))
        }
    }
}

/// GET /api/conversations/{id}/messages?before=...&limit=...
#[derive(Deserialize)]
pub struct ListMessagesQuery {
    pub before: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
}

pub async fn list_messages(
    state: web::Data<AppState>,
    _auth: AuthUser,
    path: web::Path<Uuid>,
    query: web::Query<ListMessagesQuery>,
) -> HttpResponse {
    let conversation_id = path.into_inner();
    let limit = query.limit.unwrap_or(50).min(100);

    match Message::list_for_conversation(&state.db, conversation_id, query.before, limit).await {
        Ok(messages) => HttpResponse::Ok().json(messages),
        Err(e) => {
            log::error!("Failed to list messages: {:?}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to list messages"}))
        }
    }
}

/// POST /api/conversations/{id}/messages
/// Multipart: content (text), reply_to_id (text), files[] (files)
pub async fn send_message_rest(
    state: web::Data<AppState>,
    auth: AuthUser,
    path: web::Path<Uuid>,
    ws_state: web::Data<WsState>,
    mut payload: actix_multipart::Multipart,
) -> HttpResponse {
    let conversation_id = path.into_inner();

    let mut content: Option<String> = None;
    let mut reply_to_id: Option<Uuid> = None;
    let mut files: Vec<(String, String, Vec<u8>)> = Vec::new(); // (filename, content_type, bytes)

    while let Some(Ok(mut field)) = payload.next().await {
        let name = field
            .content_disposition()
            .and_then(|cd| cd.get_name().map(|s| s.to_string()))
            .unwrap_or_default();

        match name.as_str() {
            "content" => {
                let mut buf = Vec::new();
                while let Some(Ok(chunk)) = field.next().await {
                    buf.extend_from_slice(&chunk);
                }
                let val = String::from_utf8_lossy(&buf).to_string();
                if !val.is_empty() {
                    content = Some(val);
                }
            }
            "reply_to_id" => {
                let mut buf = Vec::new();
                while let Some(Ok(chunk)) = field.next().await {
                    buf.extend_from_slice(&chunk);
                }
                let val = String::from_utf8_lossy(&buf).to_string();
                reply_to_id = Uuid::parse_str(val.trim()).ok();
            }
            "files" | "file" => {
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
                files.push((filename, content_type, bytes));
            }
            _ => {
                while let Some(Ok(_)) = field.next().await {}
            }
        }
    }

    // Must have content or files
    if content.is_none() && files.is_empty() {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Message must have content or files"}));
    }

    // Create message
    let msg = match Message::create(
        &state.db,
        conversation_id,
        auth.user_id,
        content.as_deref(),
        reply_to_id,
    )
    .await
    {
        Ok(m) => m,
        Err(e) => {
            log::error!("Failed to create message: {:?}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to create message"}));
        }
    };

    // Upload files to S3 and create attachment records
    for (filename, mime_type, bytes) in &files {
        let file_size = bytes.len() as i64;
        let s3_key = format!("chat/{}/{}/{}", conversation_id, msg.id, filename);

        let put_result = state
            .s3_client
            .put_object()
            .bucket(&state.s3_bucket)
            .key(&s3_key)
            .body(ByteStream::from(bytes.clone()))
            .content_type(mime_type)
            .send()
            .await;

        if let Err(e) = put_result {
            log::error!("S3 upload failed for chat attachment: {:?}", e);
            continue;
        }

        if let Err(e) = MessageAttachment::create(
            &state.db,
            msg.id,
            filename,
            file_size,
            mime_type,
            &s3_key,
        )
        .await
        {
            log::error!("Failed to create attachment record: {:?}", e);
        }
    }

    // Build response
    let response = match Message::to_response(&state.db, &msg).await {
        Ok(r) => r,
        Err(e) => {
            log::error!("Failed to build message response: {:?}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "Failed to build message response"}));
        }
    };

    // Notify via WebSocket
    let outgoing = WsOutgoing::NewMessage {
        message: response.clone(),
    };
    if let Ok(json) = serde_json::to_string(&outgoing) {
        let conns = ws_state.read().await;
        conns.send_to_user(auth.user_id, &json);
        if let Some(other) = get_other_user_id(&state.db, conversation_id, auth.user_id).await {
            conns.send_to_user(other, &json);
        }
    }

    HttpResponse::Ok().json(response)
}

/// GET /api/conversations/attachments/{id}/file
pub async fn serve_chat_file(
    state: web::Data<AppState>,
    _auth: AuthUser,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let attachment_id = path.into_inner();

    let attachment = match MessageAttachment::find_by_id(&state.db, attachment_id).await {
        Ok(Some(a)) => a,
        _ => {
            return HttpResponse::NotFound()
                .json(serde_json::json!({"error": "Attachment not found"}))
        }
    };

    let result = state
        .s3_client
        .get_object()
        .bucket(&state.s3_bucket)
        .key(&attachment.s3_key)
        .send()
        .await;

    match result {
        Ok(output) => {
            let bytes = output
                .body
                .collect()
                .await
                .map(|data| data.into_bytes())
                .unwrap_or_default();
            HttpResponse::Ok()
                .content_type(attachment.mime_type)
                .body(bytes.to_vec())
        }
        Err(_) => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "File not found in storage"})),
    }
}
