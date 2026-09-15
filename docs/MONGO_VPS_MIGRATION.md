# MongoDB Atlas to VPS Migration

## 0. Full VPS command sequence

The following sequence assumes a fresh Ubuntu 22.04/24.04 VPS and Docker Compose. Run these commands on the VPS after pushing the repository:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker

git clone <YOUR_GIT_REPOSITORY_URL> baraja-coffe
cd baraja-coffe
mkdir -p backups
install -m 600 /dev/null .env
nano .env
```

At minimum, `.env` on the VPS must contain the following values. Add the existing application secrets required by the API as well:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
MONGO_ROOT_USERNAME=baraja_admin
MONGO_ROOT_PASSWORD=<long-random-password>
MONGO_URI=mongodb://baraja_admin:<url-encoded-password>@127.0.0.1:27017/prod?authSource=admin
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_URL=redis://127.0.0.1:6379
```

After saving `.env`, load the migration variables in the current shell and verify the Compose files:

```bash
export ATLAS_URI='mongodb+srv://<atlas-user>:<atlas-password>@<cluster>/prod'
export VPS_URI='mongodb://baraja_admin:<url-encoded-password>@127.0.0.1:27017/prod?authSource=admin'
export DROP_TARGET=1

bash -n scripts/migrate-atlas-to-vps.sh
docker compose -f docker-compose.yml -f docker-compose.vps.yml config --quiet
```

Run the migration and then start the application:

```bash
bash scripts/migrate-atlas-to-vps.sh
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build mongodb app
docker compose -f docker-compose.yml -f docker-compose.vps.yml ps
docker compose -f docker-compose.yml -f docker-compose.vps.yml logs --tail=200 mongodb app
```

Do not paste real passwords into shell history or commit `.env`. The migration script requires typing `MIGRATE-DROP` before replacing existing target data.

## 1. Prepare the VPS

- Install Docker Engine and Docker Compose on the VPS.
- Use the repository's `docker-compose.vps.yml` overlay to run MongoDB locally.
- MongoDB is bound to `127.0.0.1` and is not exposed to the public network.
- Confirm disk space is at least 2x the current Atlas data size before restoring.

Example application URI:

```env
MONGO_URI=mongodb://<user>:<password>@127.0.0.1:27017/prod?authSource=admin
```

Create a server-only `.env` beside the Compose files:

```env
MONGO_ROOT_USERNAME=baraja_admin
MONGO_ROOT_PASSWORD=<long-random-password>
MONGO_URI=mongodb://baraja_admin:<url-encoded-password>@127.0.0.1:27017/prod?authSource=admin
```

The root user is used by the local container and is also sufficient for the initial restore. Create a restricted application user after the restore if required by your security policy.

## 2. Export from Atlas

Run from a machine that can reach Atlas. Keep the dump outside the repository.

```bash
mongodump --uri "$ATLAS_URI" --db prod --archive=baraja-prod.archive.gz --gzip
```

Record the dump timestamp and verify the archive can be listed:

```bash
mongorestore --archive=baraja-prod.archive.gz --gzip --dryRun
```

## 3. Restore to the VPS

For the complete automated migration, use `scripts/migrate-atlas-to-vps.sh` from the VPS. It starts MongoDB, waits for its healthcheck, creates a compressed Atlas dump, restores all collections and indexes, and verifies collection counts.

```bash
export ATLAS_URI='mongodb+srv://<atlas-user>:<atlas-password>@<cluster>/prod'
export VPS_URI='mongodb://baraja_admin:<url-encoded-password>@127.0.0.1:27017/prod?authSource=admin'
export DROP_TARGET=1

bash scripts/migrate-atlas-to-vps.sh
```

The script requires typing `MIGRATE-DROP` before replacing existing target data. Leave `DROP_TARGET=0` to preserve existing VPS data and merge the restored documents.

Copy the archive securely, then restore into the VPS MongoDB instance:

```bash
mongorestore --uri "$VPS_URI" --archive=baraja-prod.archive.gz --gzip --drop
```

Verify the important collections and counts before cutover:

```bash
mongosh "$VPS_URI" --eval 'db.orders.countDocuments()'
mongosh "$VPS_URI" --eval 'db.payments.countDocuments()'
mongosh "$VPS_URI" --eval 'db.orders.getIndexes()'
```

When using the Docker MongoDB service, place the archive in `./backups` and run the restore with the MongoDB image:

```bash
mkdir -p backups
cp baraja-prod.archive.gz backups/
docker compose -f docker-compose.yml -f docker-compose.vps.yml run --rm --no-deps mongodb \
	mongorestore --uri "$VPS_URI" --archive=/backup/baraja-prod.archive.gz --gzip --drop
```

Do not use `--drop` after production writes begin.

## 4. Application cutover

Set `MONGO_URI` in the VPS runtime environment. Do not put credentials in the Docker image or committed files.

For Docker Compose, create a server-only `.env` file beside `docker-compose.yml`:

```env
MONGO_URI=mongodb://<user>:<password>@127.0.0.1:27017/prod?authSource=admin
```

Start MongoDB and the API with the VPS overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build mongodb app
```

The API now uses `MONGO_URI`; `MONGO_PROD` and `MONGO` remain fallbacks for older scripts during the transition.

## 5. Smoke test

Check startup and application health immediately after cutover:

```bash
docker compose logs --tail=200 app
curl -f http://127.0.0.1:3000/
```

Also verify login, order read/create, payment webhook handling, reports, and background jobs. Monitor Mongo CPU, RAM, disk, connections, and replication/backup status if replication is enabled.

## 6. Rollback

Keep the Atlas URI available outside the repository. To roll back, change only `MONGO_URI` back to Atlas and recreate the app:

```bash
docker compose up -d app
```

Do not run bidirectional writes between Atlas and VPS during rollback. Freeze writes or choose one authoritative database first to avoid divergent orders and payments.

## 7. Backup requirement

Before enabling production writes on the VPS, schedule encrypted backups and test a restore. A VPS MongoDB instance without tested backups is not production-ready.
