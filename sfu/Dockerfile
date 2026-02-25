FROM rust:1.92-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
RUN touch src/main.rs
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/medmax-sfu /app/medmax-sfu

RUN mkdir -p /app/certs

ENV RUST_LOG=info
ENV BIND_ADDR=0.0.0.0:4433
ENV CERT_PATH=certs/cert.pem
ENV KEY_PATH=certs/key.pem

EXPOSE 4433/udp

CMD ["./medmax-sfu"]
