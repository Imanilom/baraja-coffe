#!/usr/bin/env bash
set -Eeuo pipefail

# Migrates one MongoDB database from Atlas to the local MongoDB VPS service.
# Required environment variables: ATLAS_URI, VPS_URI
# Optional: SOURCE_DB, TARGET_DB, BACKUP_DIR, COMPOSE_FILES

SOURCE_DB="${SOURCE_DB:-prod}"
TARGET_DB="${TARGET_DB:-prod_clone}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
ARCHIVE_NAME="${ARCHIVE_NAME:-baraja-${SOURCE_DB}-$(date +%Y%m%d-%H%M%S).archive.gz}"
COMPOSE_FILES="${COMPOSE_FILES:--f docker-compose.yml -f docker-compose.vps.yml}"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Command not found: $1"
}

require_env() {
  [[ -n "${!1:-}" ]] || fail "Environment variable is required: $1"
}

require_command docker
require_env ATLAS_URI
require_env VPS_URI
[[ "$TARGET_DB" != "prod" ]] || fail "TARGET_DB=prod is blocked; use a clone database such as prod_clone"

mkdir -p "$BACKUP_DIR"

log "Checking Docker Compose configuration"
# shellcheck disable=SC2086
 docker compose $COMPOSE_FILES config --quiet

log "Starting local MongoDB VPS service"
# shellcheck disable=SC2086
 docker compose $COMPOSE_FILES up -d mongodb

log "Waiting for local MongoDB healthcheck"
for attempt in $(seq 1 60); do
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' baraja_mongodb_vps 2>/dev/null || true)"
  if [[ "$health" == "healthy" ]]; then
    break
  fi
  if [[ "$health" == "unhealthy" ]]; then
    docker logs --tail=80 baraja_mongodb_vps >&2 || true
    fail "MongoDB VPS became unhealthy"
  fi
  [[ "$attempt" -lt 60 ]] || fail "MongoDB VPS did not become healthy within 10 minutes"
  sleep 10
done

log "Dumping Atlas database '${SOURCE_DB}' to ${ARCHIVE_PATH}"
docker run --rm \
  -e ATLAS_URI \
  -v "$(cd "$BACKUP_DIR" && pwd):/backup" \
  mongo:7 \
  mongodump --uri "$ATLAS_URI" --db "$SOURCE_DB" \
  --archive="/backup/${ARCHIVE_NAME}" --gzip

[[ -s "$ARCHIVE_PATH" ]] || fail "Dump archive was not created: ${ARCHIVE_PATH}"
log "Dump created: $(du -h "$ARCHIVE_PATH" | awk '{print $1}')"

restore_args=(
  mongorestore
  --uri "$VPS_URI"
  --archive="/backup/${ARCHIVE_NAME}"
  --gzip
  --nsFrom="${SOURCE_DB}.*"
  --nsTo="${TARGET_DB}.*"
)
log "Restoring all collections and indexes into '${TARGET_DB}'"
# shellcheck disable=SC2086
 docker compose $COMPOSE_FILES run --rm --no-deps mongodb "${restore_args[@]}"

log "Verifying restored collection counts"
docker run --rm \
  -e VPS_URI \
  mongo:7 \
  mongosh "$VPS_URI" --quiet --eval \
  "const clone = db.getSiblingDB('${TARGET_DB}'); const names = clone.getCollectionNames().filter((name) => !name.startsWith('system.')); printjson(names.map((name) => ({ collection: name, count: clone.getCollection(name).countDocuments() })));"

log "Migration completed. Archive retained at ${ARCHIVE_PATH}"
