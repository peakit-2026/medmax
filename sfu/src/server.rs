use dashmap::DashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use wtransport::endpoint::IncomingSession;
use wtransport::{Endpoint, Identity, ServerConfig};

use crate::auth::JwtValidator;
use crate::client::Client;
use crate::config::Config;
use crate::room::{Room, RoomHandle};

pub struct SfuServer {
    endpoint: Endpoint<wtransport::endpoint::endpoint_side::Server>,
    rooms: Arc<DashMap<String, RoomHandle>>,
    jwt_validator: Arc<JwtValidator>,
}

impl SfuServer {
    pub async fn new(config: Config) -> anyhow::Result<Self> {
        let identity = Identity::load_pemfiles(&config.cert_path, &config.key_path).await?;

        let server_config = ServerConfig::builder()
            .with_bind_address(config.bind_addr)
            .with_identity(identity)
            .keep_alive_interval(Some(Duration::from_secs(3)))
            .max_idle_timeout(Some(Duration::from_secs(30)))
            .unwrap()
            .build();

        let endpoint = Endpoint::server(server_config)?;

        Ok(Self {
            endpoint,
            rooms: Arc::new(DashMap::new()),
            jwt_validator: Arc::new(JwtValidator::new(&config.jwt_secret)),
        })
    }

    pub fn local_addr(&self) -> SocketAddr {
        self.endpoint.local_addr().unwrap()
    }

    pub async fn run(self) -> anyhow::Result<()> {
        loop {
            let incoming = self.endpoint.accept().await;
            let rooms = self.rooms.clone();
            let validator = self.jwt_validator.clone();

            tokio::spawn(async move {
                if let Err(e) = handle_session(incoming, rooms, validator).await {
                    tracing::warn!("session error: {e}");
                }
            });
        }
    }
}

async fn handle_session(
    incoming: IncomingSession,
    rooms: Arc<DashMap<String, RoomHandle>>,
    validator: Arc<JwtValidator>,
) -> anyhow::Result<()> {
    let session_request = incoming.await?;
    let path = session_request.path().to_string();

    let ticket = extract_ticket(&path).ok_or_else(|| anyhow::anyhow!("missing ticket param"))?;

    let claims = validator
        .validate(ticket)
        .map_err(|e| anyhow::anyhow!("auth failed: {e}"))?;

    tracing::info!(
        user = %claims.sub,
        room = %claims.room_id,
        name = %claims.name,
        "session authenticated"
    );

    let connection = session_request.accept().await?;

    let room_handle = rooms
        .get(&claims.room_id)
        .map(|r| r.value().clone())
        .unwrap_or_else(|| Room::spawn(claims.room_id.clone(), rooms.clone()));

    let client = Client {
        id: Arc::new(claims.sub),
        connection,
        room: room_handle,
    };

    client.spawn();

    Ok(())
}

fn extract_ticket(path: &str) -> Option<&str> {
    let query = path.split_once('?')?.1;
    for pair in query.split('&') {
        if let Some(value) = pair.strip_prefix("ticket=") {
            if !value.is_empty() {
                return Some(value);
            }
        }
    }
    None
}
