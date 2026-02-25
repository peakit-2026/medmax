use bytes::Bytes;
use std::sync::Arc;
use tokio::sync::mpsc;
use wtransport::Connection;

use crate::packet::{MAX_PACKET_SIZE, PacketType, encode_datagram_forward, encode_stream_forward};
use crate::room::{ClientHandle, RoomCommand, RoomHandle};

pub struct Client {
    pub id: Arc<String>,
    pub connection: Connection,
    pub room: RoomHandle,
}

impl Client {
    pub fn spawn(self) {
        let id = self.id;
        let connection = self.connection;
        let room = self.room;

        let (video_tx, video_rx) = mpsc::channel::<Bytes>(64);
        let (audio_tx, audio_rx) = mpsc::channel::<Bytes>(64);

        let handle = ClientHandle { video_tx, audio_tx };

        let id_clone = id.clone();
        tokio::spawn(async move {
            room.send(RoomCommand::AddClient {
                id: id.clone(),
                handle,
            })
            .await;

            tokio::select! {
                _ = video_loop(id.clone(), connection.clone(), room.clone(), video_rx) => {}
                _ = audio_recv_loop(id.clone(), connection.clone(), room.clone()) => {}
                _ = audio_send_loop(connection.clone(), audio_rx) => {}
                _ = connection.closed() => {}
            }

            room.send(RoomCommand::RemoveClient { id: id.clone() }).await;
            tracing::info!(client = %id, "client actor stopped");
        });

        let _ = id_clone;
    }
}

async fn video_loop(
    id: Arc<String>,
    connection: Connection,
    room: RoomHandle,
    mut video_rx: mpsc::Receiver<Bytes>,
) {
    let bi_result = connection.accept_bi().await;
    let (mut send, mut recv) = match bi_result {
        Ok(stream) => stream,
        Err(e) => {
            tracing::warn!(client = %id, "bi-stream error: {e}");
            return;
        }
    };

    let id_read = id.clone();
    let room_read = room.clone();
    let read_task = tokio::spawn(async move {
        let mut len_buf = [0u8; 4];
        loop {
            if read_exact(&mut recv, &mut len_buf).await.is_err() {
                break;
            }
            let len = u32::from_be_bytes(len_buf) as usize;
            if len == 0 || len > MAX_PACKET_SIZE {
                tracing::warn!(client = %id_read, "invalid packet length: {len}");
                break;
            }
            let mut data = vec![0u8; len];
            if read_exact(&mut recv, &mut data).await.is_err() {
                break;
            }

            if data.is_empty() {
                continue;
            }

            let pkt_type = data[0];
            if pkt_type != PacketType::Video as u8 {
                continue;
            }

            let video_data = &data[1..];
            let forward = encode_stream_forward(&id_read, pkt_type, video_data);

            room_read
                .send(RoomCommand::BroadcastVideo {
                    sender_id: id_read.clone(),
                    data: forward,
                })
                .await;
        }
    });

    let id_write = id.clone();
    let write_task = tokio::spawn(async move {
        while let Some(data) = video_rx.recv().await {
            if send.write_all(&data).await.is_err() {
                tracing::debug!(client = %id_write, "video write ended");
                break;
            }
        }
    });

    tokio::select! {
        _ = read_task => {}
        _ = write_task => {}
    }
}

async fn audio_recv_loop(
    id: Arc<String>,
    connection: Connection,
    room: RoomHandle,
) {
    loop {
        match connection.receive_datagram().await {
            Ok(dgram) => {
                let data = dgram.to_vec();
                if data.is_empty() {
                    continue;
                }
                if data[0] != PacketType::Audio as u8 {
                    continue;
                }
                let audio_data = &data[1..];
                let forward = encode_datagram_forward(&id, audio_data);

                room.send(RoomCommand::BroadcastAudio {
                    sender_id: id.clone(),
                    data: forward,
                })
                .await;
            }
            Err(e) => {
                tracing::debug!(client = %id, "datagram recv ended: {e}");
                break;
            }
        }
    }
}

async fn audio_send_loop(
    connection: Connection,
    mut audio_rx: mpsc::Receiver<Bytes>,
) {
    while let Some(data) = audio_rx.recv().await {
        if connection.send_datagram(data).is_err() {
            break;
        }
    }
}

async fn read_exact(
    recv: &mut wtransport::RecvStream,
    buf: &mut [u8],
) -> anyhow::Result<()> {
    let mut offset = 0;
    while offset < buf.len() {
        match recv.read(&mut buf[offset..]).await? {
            Some(n) => offset += n,
            None => anyhow::bail!("stream closed"),
        }
    }
    Ok(())
}
