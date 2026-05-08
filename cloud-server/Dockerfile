# Optimized for Node.js 20 LTS (Alpine for Small Footprint)
FROM node:20-alpine

# Install build dependencies for better-sqlite3 and pg_dump
RUN apk add --no-cache python3 make g++ sqlite-dev postgresql-client

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Create volume for local SQLite and Backups
VOLUME ["/app/data", "/app/backups"]

# Default Environment Variables
ENV PORT=3000
ENV DB_TYPE=sqlite
ENV DB_PATH=/app/data/cloud_pos.db

EXPOSE 3000

# Start server
CMD ["node", "index.js"]
