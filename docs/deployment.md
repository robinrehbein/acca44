# Development deployment runbook

This repository targets a development-only Docker Compose resource in Coolify. It does not authorize a production launch. The server and worker use the same image; the storefront uses a separate Vite/React static application with an Express BFF. Database and asset volumes persist independently of containers.

## Configuration

Use the existing Coolify application `zanlm9c121xyyoq6nda6tzh8` in the Carina Rehbein development environment; switch its build strategy to Docker Compose on branch `dev` rather than creating a duplicate.

Coolify automatically generates four independent 64-character secrets from the Compose references `SERVICE_PASSWORD_64_POSTGRES`, `SERVICE_PASSWORD_64_ADMIN`, `SERVICE_PASSWORD_64_COOKIE`, and `SERVICE_PASSWORD_64_OPERATOR`. The PostgreSQL secret is reused by the database container and Vendure. Retrieve credentials only through Coolify's environment settings; do not copy a developer's local `.env` into the remote resource. The local `.env.example` supplies placeholder values under those same keys solely for local Compose use.

The administrator identifier defaults to `admin@acca44.example`; the seeded operator is `operator@acca44.example`. Generated values must persist across deployments. Changing the administrator or operator environment value does not prove that an existing account password changed. Cookie-secret rotation invalidates existing sessions. Database password rotation requires coordinated database-role and application changes.

Coolify derives `SERVICE_URL_SERVER_3001` and `SERVICE_URL_STOREFRONT_3000` from the respective domain settings. Verify HTTPS origins before testing browser sessions. `COOKIE_SECURE` defaults to true in Compose; the example sets false only for local HTTP. Do not copy this local override to Coolify.

Only the storefront and server receive reverse-proxy routes. The browser needs the server origin for assets and the Dashboard; the BFF uses `http://server:3001/shop-api` internally. Configure HTTPS origins before testing browser sessions. Avoid public PostgreSQL host ports. The migration container receives the same configuration and persistent asset mount as the server.

## First installation and updates

```sh
docker compose build
docker compose up -d postgres
docker compose run --rm migrate
docker compose run --rm --no-deps server npm run seed -w @acca44/server
docker compose up -d server worker storefront
docker compose ps
```

The `migrate` service runs as a one-shot dependency before the server and worker, gated by `service_completed_successfully`. Its expected exit may appear as `Exited` in Coolify; inspect its exit code separately from the running services. The repository uses standard Compose without Coolify-only fields. No Compose profiles are required. For a deployed first installation, wait for server startup and run `npm run seed -w @acca44/server` once in its Coolify terminal.

Run the seed only for the initial synthetic fixture. For subsequent updates: back up both volumes, build the reviewed commit, run migrations once, then recreate services. Do not run concurrent migrations. Do not assume reverting an image reverses a database migration; restore a tested backup if a schema change is incompatible.

Health checks exercise the Shop API and storefront HTTP response. They do not prove correct authorization, inventory semantics, checkout, job execution, or persistence. Monitor worker logs separately and verify that queued jobs complete. No HTTP listener is expected from the worker.

## Backup and restore

Store backups outside the deployment server, using restricted access. A minimal logical database backup can be taken with:

```sh
mkdir -p backups
chmod 700 backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/database.dump
```

Also back up the complete `assets` volume using the hosting platform or a controlled volume archive. Quiesce writes for a consistent database/assets pair. Do not commit backups; even a test environment can acquire sensitive information if misused.

Restore into a separate Compose project with separate volumes and domains. Start PostgreSQL, restore the dump using `pg_restore` into an empty database, restore asset files with node-user read/write access, then start the matching application commit. Verify login, products, images, orders and stock movements before declaring the backup usable. Keep the old deployment intact until the restore is validated.

## Acceptance evidence

Record commit, timestamp, URLs and outcome for each check:

- Unauthenticated administration rejected; configured administration login succeeds.
- Twelve synthetic products visible with correct variants, prices and images.
- Independent Lindau and Friedrichshafen quantities; allocation follows the configured priority and cannot oversell.
- Cart and simulated checkout work; insufficient stock is rejected.
- Reservation, fulfillment sale movement and cancellation/restock behavior verified using before/after quantities and movement history.
- Worker jobs complete; restarting containers preserves database and assets.
- Public HTTPS works with browser sessions and no database exposure.

Local builds and API checks are separate evidence from deployed browser checks. Do not label a partially checked prototype production-ready.

Coolify configuration reference: [Docker Compose applications](https://coolify.io/docs/applications/builds/docker-compose).

## Runtime resource limits

Server and migration each have 1 GiB memory and 1 CPU; the worker has 768 MiB and 0.5 CPU; storefront 256 MiB and 0.5 CPU; PostgreSQL 768 MiB and 1 CPU. These limits constrain runtime services, not Docker builds. Verify actual usage during deployment and checkout/job tests. Investigate out-of-memory exits before increasing limits, and recheck server capacity when adjusting them.
