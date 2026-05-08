#!/bin/bash

# [SPEC] POS MANDIRI CLOUD SETUP WIZARD (SPRINT 12)
# Target: Ubuntu 22.04 LTS / Debian
# Filosofi: Zero-Friction for UMKM Owner.

echo "=========================================="
echo "   POS MANDIRI - CLOUD SERVER SETUP    "
echo "=========================================="

# 1. Cek Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker belum terinstall. Silakan install docker terlebih dahulu."
  exit 1
fi

# 2. Generate Random Admin Secret
if [ ! -f .env ]; then
  SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
  echo "Generating new .env file..."
  echo "PORT=3000" > .env
  echo "ADMIN_SECRET=$SECRET" >> .env
  echo "DB_TYPE=sqlite" >> .env
  echo "DB_PATH=/app/data/cloud_pos.db" >> .env
  echo "------------------------------------------"
  echo "PENTING: Simpan Admin Secret Anda!"
  echo "SECRET: $SECRET"
  echo "------------------------------------------"
else
  echo ".env file detected. Skipping generation."
fi

# 3. Create Data Directories
mkdir -p data backups

# 4. Pull and Start
echo "Memulai Docker Container..."
docker build -t pos-cloud-server .
docker run -d \
  --name pos-cloud \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/backups:/app/backups \
  --restart always \
  pos-cloud-server

echo "Selesai! Cloud Server aktif di port 3000."
echo "Endpoint Push: http://$(curl -s ifconfig.me):3000/api/sync/push"
