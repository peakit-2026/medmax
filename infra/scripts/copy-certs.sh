#!/usr/bin/env bash
set -euo pipefail

CADDY_CERT_DIR="/caddy-data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/sfu.yarokb.ru"
SFU_CERT_DIR="/sfu-certs"

echo "==> Waiting for Caddy to obtain sfu.yarokb.ru certificate..."
for i in $(seq 1 120); do
    if [ -f "$CADDY_CERT_DIR/sfu.yarokb.ru.crt" ] && [ -f "$CADDY_CERT_DIR/sfu.yarokb.ru.key" ]; then
        echo "==> Certificate found!"
        break
    fi
    if [ "$i" -eq 120 ]; then
        echo "==> ERROR: Certificate not found after 120s"
        exit 1
    fi
    sleep 1
done

cp "$CADDY_CERT_DIR/sfu.yarokb.ru.crt" "$SFU_CERT_DIR/cert.pem"
cp "$CADDY_CERT_DIR/sfu.yarokb.ru.key" "$SFU_CERT_DIR/key.pem"
chmod 644 "$SFU_CERT_DIR/cert.pem"
chmod 600 "$SFU_CERT_DIR/key.pem"

echo "==> Certificates copied to SFU volume"
