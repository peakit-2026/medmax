mod auth;
mod client;
mod config;
mod packet;
mod room;
mod server;

use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse()?))
        .init();

    let config = config::Config::from_env()?;
    let server = server::SfuServer::new(config).await?;

    tracing::info!("medmax-sfu listening on {}", server.local_addr());

    server.run().await
}
