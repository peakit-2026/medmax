use actix_web::{rt, web, HttpRequest, HttpResponse};
use actix_ws::Message;
use futures_util::StreamExt;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};

pub type Rooms = Arc<Mutex<HashMap<String, broadcast::Sender<(u64, Vec<u8>)>>>>;

static NEXT_ID: AtomicU64 = AtomicU64::new(1);

pub fn create_rooms() -> Rooms {
    Arc::new(Mutex::new(HashMap::new()))
}

pub async fn ws_handler(
    req: HttpRequest,
    stream: web::Payload,
    rooms: web::Data<Rooms>,
    path: web::Path<String>,
) -> Result<HttpResponse, actix_web::Error> {
    let room_id = path.into_inner();
    let (response, session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    let my_id = NEXT_ID.fetch_add(1, Ordering::Relaxed);

    let tx = {
        let mut rooms = rooms.lock().await;
        let tx = rooms
            .entry(room_id.clone())
            .or_insert_with(|| {
                let (tx, _) = broadcast::channel(16);
                tx
            })
            .clone();
        tx
    };

    let mut rx = tx.subscribe();

    let mut send_session = session.clone();
    rt::spawn(async move {
        while let Ok((sender_id, data)) = rx.recv().await {
            if sender_id == my_id {
                continue;
            }
            if data.starts_with(b"{") {
                let _ = send_session
                    .text(String::from_utf8_lossy(&data).to_string())
                    .await;
            } else {
                let _ = send_session.binary(data).await;
            }
        }
    });

    let rooms_clone = rooms.clone();
    let room_id_clone = room_id.clone();
    let close_session = session.clone();
    rt::spawn(async move {
        while let Some(Ok(msg)) = msg_stream.next().await {
            match msg {
                Message::Binary(data) => {
                    let _ = tx.send((my_id, data.to_vec()));
                }
                Message::Text(text) => {
                    let _ = tx.send((my_id, text.as_bytes().to_vec()));
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
        let mut rooms = rooms_clone.lock().await;
        if let Some(sender) = rooms.get(&room_id_clone) {
            if sender.receiver_count() == 0 {
                rooms.remove(&room_id_clone);
            }
        }
        let _ = close_session.close(None).await;
    });

    Ok(response)
}
