# Docker deployment

This serves the complete frontend and API at one origin with PostgreSQL persistence. Caddy obtains and renews HTTPS certificates for the configured domain. Only the web service publishes ports; the API and database stay on the Docker network.

Requirements: a Linux server with Docker Engine and Compose v2, a domain pointing to its public IP, and inbound TCP 80/443 (optional UDP 443). Sites hosts the separate static preview; it does not execute these Docker images.

From the application directory:

```sh
cp deploy/.env.example .env.production
```

Fill in `SITE_ADDRESS` (domain only), `PUBLIC_ORIGIN` (https origin), and independent random `POSTGRES_PASSWORD` and `JWT_SECRET` values. Generate each secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep the database password hexadecimal to avoid URL encoding problems. Optionally set the initial admin email and password; the seed never resets existing passwords. The ignored environment file must stay on the host.

```sh
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml run --rm seed
node scripts/smoke-deployment.mjs https://your-domain
```

The migration job must succeed before the API starts. The web service waits for API/database readiness. Run a single API instance because reminders run in that process. Certificates and PostgreSQL data use named volumes. Do not run `down -v` on a deployment whose data you want to retain.

For a local check, use `SITE_ADDRESS=http://localhost` and `PUBLIC_ORIGIN=http://localhost`, then run the same commands and smoke test with `http://localhost`.

## Updating and backups

The GitHub Actions workflow builds all three Docker images and boots a disposable database, runs migrations and seed, and checks the HTTP routes before publishing revision-tagged images to GitHub Container Registry on branch pushes. Pull requests test without publishing. Package visibility is controlled separately in GitHub; a first publication may be private. GitHub Actions is a build service, not a permanent application server. GitHub Pages cannot run this API or PostgreSQL.

On a server, set `IMAGE_PREFIX=ghcr.io/OWNER/unichase` (lowercase owner) and `IMAGE_TAG` to a successful workflow's full commit SHA in `.env.production`, authenticate to GHCR if required, then use `docker compose --env-file .env.production -f compose.production.yml pull` and `up -d --no-build`. The registry web image is built for localhost during the smoke test; rebuild the web target with your production origin for correct sitemap URLs. The default local build commands above already do that.

Back up the database before updating. This creates the backup in the database container, copies it out, then removes only that temporary file:

```sh
docker compose --env-file .env.production -f compose.production.yml exec -T db pg_dump -U unichase -d unichase -Fc -f /tmp/unichase.dump
docker compose --env-file .env.production -f compose.production.yml cp db:/tmp/unichase.dump ./unichase-backup.dump
docker compose --env-file .env.production -f compose.production.yml exec -T db rm /tmp/unichase.dump
```

Keep backups private and move them to secure off-host storage. Test restores on a separate database. After pulling reviewed code, rerun `up -d --build` and the smoke test. Review migration compatibility before rolling code back; rolling back an image does not reverse database migrations.

Inspect failures with `docker compose --env-file .env.production -f compose.production.yml logs --tail=100 api migrate web`. `/api/health` checks the process; `/api/ready` checks its database connection. The smoke test detects missing catalog seed, broken deep links, and API requests incorrectly falling through to HTML.

Email sending remains disabled until SMTP is configured. Document uploads still require private object storage; this deployment does not add that integration. Production container startup and HTTPS must be verified on the target Docker host.
