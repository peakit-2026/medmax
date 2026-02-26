use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

// ── Core structs ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Conversation {
    pub id: Uuid,
    pub doctor_id: Uuid,
    pub surgeon_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub content: Option<String>,
    pub reply_to_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MessageAttachment {
    pub id: Uuid,
    pub message_id: Uuid,
    pub file_name: String,
    pub file_size: i64,
    pub mime_type: String,
    pub s3_key: String,
    pub created_at: DateTime<Utc>,
}

// ── Response / list-item DTOs ───────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConversationListItem {
    pub id: Uuid,
    pub other_user_id: Uuid,
    pub other_user_name: String,
    pub other_user_role: String,
    pub last_message: Option<String>,
    pub last_message_at: Option<DateTime<Utc>>,
    pub unread_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageResponse {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub sender_role: String,
    pub content: Option<String>,
    pub reply_to_id: Option<Uuid>,
    pub reply_to_content: Option<String>,
    pub reply_to_sender_name: Option<String>,
    pub attachments: Vec<AttachmentResponse>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AttachmentResponse {
    pub id: Uuid,
    pub file_name: String,
    pub file_size: i64,
    pub mime_type: String,
}

// ── Internal row types for queries ──────────────────────────────────────

#[derive(Debug, sqlx::FromRow)]
struct MessageRow {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub sender_role: String,
    pub content: Option<String>,
    pub reply_to_id: Option<Uuid>,
    pub reply_to_content: Option<String>,
    pub reply_to_sender_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

// ── Conversation impl ───────────────────────────────────────────────────

impl Conversation {
    /// Get an existing conversation between doctor and surgeon, or create one.
    pub async fn get_or_create(
        pool: &PgPool,
        doctor_id: Uuid,
        surgeon_id: Uuid,
    ) -> sqlx::Result<Self> {
        let row = sqlx::query_as::<_, Self>(
            r#"
            INSERT INTO conversations (doctor_id, surgeon_id)
            VALUES ($1, $2)
            ON CONFLICT (doctor_id, surgeon_id) DO UPDATE SET doctor_id = conversations.doctor_id
            RETURNING *
            "#,
        )
        .bind(doctor_id)
        .bind(surgeon_id)
        .fetch_one(pool)
        .await?;
        Ok(row)
    }

    /// List conversations for a user, returning the "other side" info plus
    /// the latest message and unread count.
    pub async fn list_for_user(
        pool: &PgPool,
        user_id: Uuid,
        role: &str,
    ) -> sqlx::Result<Vec<ConversationListItem>> {
        let rows = sqlx::query_as::<_, ConversationListItem>(
            r#"
            SELECT
                c.id,
                CASE WHEN $2 = 'doctor' THEN c.surgeon_id ELSE c.doctor_id END AS other_user_id,
                u.full_name AS other_user_name,
                u.role AS other_user_role,
                last_msg.content AS last_message,
                last_msg.created_at AS last_message_at,
                COALESCE(unread.cnt, 0) AS unread_count
            FROM conversations c
            JOIN users u ON u.id = CASE WHEN $2 = 'doctor' THEN c.surgeon_id ELSE c.doctor_id END
            LEFT JOIN LATERAL (
                SELECT m.content, m.created_at
                FROM messages m
                WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC
                LIMIT 1
            ) last_msg ON true
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS cnt
                FROM messages m
                WHERE m.conversation_id = c.id
                  AND m.sender_id != $1
                  AND m.read_at IS NULL
            ) unread ON true
            WHERE CASE WHEN $2 = 'doctor' THEN c.doctor_id = $1 ELSE c.surgeon_id = $1 END
            ORDER BY last_msg.created_at DESC NULLS LAST
            "#,
        )
        .bind(user_id)
        .bind(role)
        .fetch_all(pool)
        .await?;
        Ok(rows)
    }

    /// Create conversations for the given user with every counterpart user.
    /// Doctors get a conversation with every surgeon, and vice-versa.
    pub async fn ensure_all_for_user(
        pool: &PgPool,
        user_id: Uuid,
        role: &str,
    ) -> sqlx::Result<()> {
        let counterpart_role = if role == "doctor" { "surgeon" } else { "doctor" };

        if role == "doctor" {
            sqlx::query(
                r#"
                INSERT INTO conversations (doctor_id, surgeon_id)
                SELECT $1, u.id
                FROM users u
                WHERE u.role = $2
                ON CONFLICT (doctor_id, surgeon_id) DO NOTHING
                "#,
            )
            .bind(user_id)
            .bind(counterpart_role)
            .execute(pool)
            .await?;
        } else {
            sqlx::query(
                r#"
                INSERT INTO conversations (doctor_id, surgeon_id)
                SELECT u.id, $1
                FROM users u
                WHERE u.role = $2
                ON CONFLICT (doctor_id, surgeon_id) DO NOTHING
                "#,
            )
            .bind(user_id)
            .bind(counterpart_role)
            .execute(pool)
            .await?;
        }

        Ok(())
    }
}

// ── Message impl ────────────────────────────────────────────────────────

impl Message {
    pub async fn create(
        pool: &PgPool,
        conversation_id: Uuid,
        sender_id: Uuid,
        content: Option<&str>,
        reply_to_id: Option<Uuid>,
    ) -> sqlx::Result<Self> {
        let row = sqlx::query_as::<_, Self>(
            r#"
            INSERT INTO messages (conversation_id, sender_id, content, reply_to_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(conversation_id)
        .bind(sender_id)
        .bind(content)
        .bind(reply_to_id)
        .fetch_one(pool)
        .await?;
        Ok(row)
    }

    /// Paginated message list for a conversation (cursor-based via `before`).
    /// Returns `MessageResponse` with sender name, reply info, and attachments.
    pub async fn list_for_conversation(
        pool: &PgPool,
        conversation_id: Uuid,
        before: Option<DateTime<Utc>>,
        limit: i64,
    ) -> sqlx::Result<Vec<MessageResponse>> {
        let before_ts = before.unwrap_or_else(|| Utc::now() + chrono::Duration::days(1));

        let rows = sqlx::query_as::<_, MessageRow>(
            r#"
            SELECT
                m.id,
                m.conversation_id,
                m.sender_id,
                u.full_name AS sender_name,
                u.role AS sender_role,
                m.content,
                m.reply_to_id,
                r.content AS reply_to_content,
                ru.full_name AS reply_to_sender_name,
                m.created_at,
                m.read_at
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            LEFT JOIN messages r ON r.id = m.reply_to_id
            LEFT JOIN users ru ON ru.id = r.sender_id
            WHERE m.conversation_id = $1
              AND m.created_at < $2
            ORDER BY m.created_at DESC
            LIMIT $3
            "#,
        )
        .bind(conversation_id)
        .bind(before_ts)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        let msg_ids: Vec<Uuid> = rows.iter().map(|r| r.id).collect();

        let attachments = if msg_ids.is_empty() {
            vec![]
        } else {
            sqlx::query_as::<_, AttachmentWithMessage>(
                r#"
                SELECT id, message_id, file_name, file_size, mime_type
                FROM message_attachments
                WHERE message_id = ANY($1)
                ORDER BY created_at ASC
                "#,
            )
            .bind(&msg_ids)
            .fetch_all(pool)
            .await?
        };

        let responses = rows
            .into_iter()
            .map(|row| {
                let msg_attachments: Vec<AttachmentResponse> = attachments
                    .iter()
                    .filter(|a| a.message_id == row.id)
                    .map(|a| AttachmentResponse {
                        id: a.id,
                        file_name: a.file_name.clone(),
                        file_size: a.file_size,
                        mime_type: a.mime_type.clone(),
                    })
                    .collect();

                MessageResponse {
                    id: row.id,
                    conversation_id: row.conversation_id,
                    sender_id: row.sender_id,
                    sender_name: row.sender_name,
                    sender_role: row.sender_role,
                    content: row.content,
                    reply_to_id: row.reply_to_id,
                    reply_to_content: row.reply_to_content,
                    reply_to_sender_name: row.reply_to_sender_name,
                    attachments: msg_attachments,
                    created_at: row.created_at,
                    read_at: row.read_at,
                }
            })
            .collect();

        Ok(responses)
    }

    /// Mark all messages in a conversation as read for the given reader.
    /// Only marks messages sent by *other* users.
    pub async fn mark_read(
        pool: &PgPool,
        conversation_id: Uuid,
        reader_id: Uuid,
    ) -> sqlx::Result<()> {
        sqlx::query(
            r#"
            UPDATE messages
            SET read_at = NOW()
            WHERE conversation_id = $1
              AND sender_id != $2
              AND read_at IS NULL
            "#,
        )
        .bind(conversation_id)
        .bind(reader_id)
        .execute(pool)
        .await?;
        Ok(())
    }

    /// Build a MessageResponse for a single message (used after creation).
    pub async fn to_response(
        pool: &PgPool,
        msg: &Message,
    ) -> sqlx::Result<MessageResponse> {
        #[derive(sqlx::FromRow)]
        struct SenderRow {
            full_name: String,
            role: String,
        }

        let sender = sqlx::query_as::<_, SenderRow>(
            "SELECT full_name, role FROM users WHERE id = $1",
        )
        .bind(msg.sender_id)
        .fetch_one(pool)
        .await?;

        let (reply_to_content, reply_to_sender_name) = if let Some(reply_id) = msg.reply_to_id {
            let reply_row = sqlx::query_as::<_, MessageRow>(
                r#"
                SELECT
                    m.id, m.conversation_id, m.sender_id,
                    u.full_name AS sender_name,
                    m.content, m.reply_to_id,
                    NULL::text AS reply_to_content,
                    NULL::text AS reply_to_sender_name,
                    m.created_at, m.read_at
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.id = $1
                "#,
            )
            .bind(reply_id)
            .fetch_optional(pool)
            .await?;

            match reply_row {
                Some(r) => (r.content, Some(r.sender_name)),
                None => (None, None),
            }
        } else {
            (None, None)
        };

        let attachments = sqlx::query_as::<_, AttachmentResponse>(
            r#"
            SELECT id, file_name, file_size, mime_type
            FROM message_attachments
            WHERE message_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(msg.id)
        .fetch_all(pool)
        .await?;

        Ok(MessageResponse {
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            sender_name: sender.full_name,
            sender_role: sender.role,
            content: msg.content.clone(),
            reply_to_id: msg.reply_to_id,
            reply_to_content,
            reply_to_sender_name,
            attachments,
            created_at: msg.created_at,
            read_at: msg.read_at,
        })
    }
}

// ── MessageAttachment impl ──────────────────────────────────────────────

impl MessageAttachment {
    pub async fn create(
        pool: &PgPool,
        message_id: Uuid,
        file_name: &str,
        file_size: i64,
        mime_type: &str,
        s3_key: &str,
    ) -> sqlx::Result<Self> {
        let row = sqlx::query_as::<_, Self>(
            r#"
            INSERT INTO message_attachments (message_id, file_name, file_size, mime_type, s3_key)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(message_id)
        .bind(file_name)
        .bind(file_size)
        .bind(mime_type)
        .bind(s3_key)
        .fetch_one(pool)
        .await?;
        Ok(row)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<Self>> {
        sqlx::query_as::<_, Self>("SELECT * FROM message_attachments WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }
}

// ── Helper row type ─────────────────────────────────────────────────────

#[derive(Debug, sqlx::FromRow)]
struct AttachmentWithMessage {
    id: Uuid,
    message_id: Uuid,
    file_name: String,
    file_size: i64,
    mime_type: String,
}
