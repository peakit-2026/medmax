FROM rust:1.83-bookworm AS builder

WORKDIR /app/backend

COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
COPY migrations/ /app/migrations/
RUN cargo build --release 2>/dev/null || true

COPY backend/src ./src
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 fonts-liberation curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/backend/target/release/medmax-backend .
COPY migrations/ ./migrations/

EXPOSE 8080
CMD ["./medmax-backend"]
