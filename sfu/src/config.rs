use std::net::SocketAddr;

pub struct Config {
    pub bind_addr: SocketAddr,
    pub cert_path: String,
    pub key_path: String,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let bind_addr: SocketAddr = std::env::var("BIND_ADDR")
            .unwrap_or_else(|_| "0.0.0.0:4433".into())
            .parse()?;

        let cert_path = std::env::var("CERT_PATH").unwrap_or_else(|_| "certs/cert.pem".into());
        let key_path = std::env::var("KEY_PATH").unwrap_or_else(|_| "certs/key.pem".into());
        let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

        Ok(Self {
            bind_addr,
            cert_path,
            key_path,
            jwt_secret,
        })
    }
}
