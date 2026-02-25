use bytes::Bytes;
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::mpsc;

pub enum RoomCommand {
    AddClient {
        id: Arc<String>,
        handle: ClientHandle,
    },
    RemoveClient {
        id: Arc<String>,
    },
    BroadcastVideo {
        sender_id: Arc<String>,
        data: Bytes,
    },
    BroadcastAudio {
        sender_id: Arc<String>,
        data: Bytes,
    },
}

#[derive(Clone)]
pub struct ClientHandle {
    pub video_tx: mpsc::Sender<Bytes>,
    pub audio_tx: mpsc::Sender<Bytes>,
}

#[derive(Clone)]
pub struct RoomHandle {
    cmd_tx: mpsc::Sender<RoomCommand>,
}

impl RoomHandle {
    pub async fn send(&self, cmd: RoomCommand) {
        let _ = self.cmd_tx.send(cmd).await;
    }
}

pub struct Room;

impl Room {
    pub fn spawn(
        id: String,
        rooms: Arc<DashMap<String, RoomHandle>>,
    ) -> RoomHandle {
        let (cmd_tx, cmd_rx) = mpsc::channel(256);
        let handle = RoomHandle { cmd_tx };
        rooms.insert(id.clone(), handle.clone());

        let room_id = Arc::new(id);
        let rooms_ref = rooms;

        tokio::spawn(Self::run(room_id, rooms_ref, cmd_rx));
        handle
    }

    async fn run(
        id: Arc<String>,
        rooms: Arc<DashMap<String, RoomHandle>>,
        mut cmd_rx: mpsc::Receiver<RoomCommand>,
    ) {
        let clients: DashMap<Arc<String>, ClientHandle> = DashMap::new();

        while let Some(cmd) = cmd_rx.recv().await {
            match cmd {
                RoomCommand::AddClient { id: cid, handle } => {
                    tracing::info!(room = %id, client = %cid, "client joined");
                    clients.insert(cid, handle);
                }
                RoomCommand::RemoveClient { id: cid } => {
                    clients.remove(&cid);
                    tracing::info!(room = %id, client = %cid, "client left");
                    if clients.is_empty() {
                        tracing::info!(room = %id, "room empty, destroying");
                        rooms.remove(id.as_str());
                        return;
                    }
                }
                RoomCommand::BroadcastVideo { sender_id, data } => {
                    for entry in clients.iter() {
                        if *entry.key() != sender_id {
                            let _ = entry.value().video_tx.try_send(data.clone());
                        }
                    }
                }
                RoomCommand::BroadcastAudio { sender_id, data } => {
                    for entry in clients.iter() {
                        if *entry.key() != sender_id {
                            let _ = entry.value().audio_tx.try_send(data.clone());
                        }
                    }
                }
            }
        }
    }
}
