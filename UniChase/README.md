# UniChase

UniChase is a university discovery and application-planning platform for international students interested in South Korea. This repository contains the React application, Express API, PostgreSQL schema, data seed, moderator workspace, and student tools.

The current UI keeps the established UniChase logo, navy/teal palette, card system, navigation, typography, animations, and page structure. It supports light mode plus a soft navy dark mode, responsive layouts, keyboard focus, reduced motion, and English, Korean, Russian, and Uzbek navigation labels.

## What is included

- Searchable and paginated South Korean university directory with combined queries, filters, sorting, recent searches, stable cards, fallbacks, and clean detail URLs
- Backend-synced saves and follows for signed-in users; account-scoped guest saves and device-local comparison for 2–4 universities
- Rule-based matching with scored reasons and disadvantages; results are guidance and never an admission guarantee
- Verified program pages for the small set of programs for which official sources were recorded
- Student councils with role placeholders, verification metadata, and moderator editing without invented people
- Student authentication, profile, onboarding, dashboard, applications, document tracking, roadmaps, document checklists, essay drafts and rule-based feedback
- Eligibility history, cost estimates, visa checklist and official visa-source links, searchable FAQ, reminders, notifications, and calendar with single/all-event ICS exports
- Community posts, replies, nested comments, likes, saves, reports, ownership controls, review moderation, and moderator announcements
- RBAC moderator roles, queues, university/program/image/council management, activity logs, support messages, analytics, and CSV export
- Page-level metadata, canonicals, Open Graph/Twitter metadata, structured data, route splitting, and environment-aware sitemap generation
- PDF exports for comparison, shortlist, recommendations, roadmaps, document checklists, costs, and eligibility. Non-Latin content uses the browser print dialog so the installed system fonts can render it accurately.

## Architecture

| Layer | Technology | Location |
| --- | --- | --- |
| Web client | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion | `src/` |
| API | Node.js, Express 5, Zod validation | `server/src/` |
| Database | PostgreSQL, Prisma 6 | `prisma/` |
| Shared curated data | JSON university/program catalogs | `data/` |
| API regression tests | Vitest with HTTP route harnesses | `server/tests/` |

The Vite development server proxies `/api` to `http://127.0.0.1:3001`. In a split deployment, set `VITE_API_BASE_URL` to the public API path. The backend allows only configured `CORS_ORIGIN` values.

## Local setup

Requirements: Node.js 24 LTS and PostgreSQL.

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:deploy
npm run db:seed
```

Start the API and frontend in separate terminals:

```bash
npm run server:dev
npm run dev
```

Open `http://localhost:5173`. Health check: `GET http://localhost:3001/api/health`.

For a new admin, set `ADMIN_EMAIL` and a unique 12–72 byte `ADMIN_PASSWORD` before the first seed. The seed creates that admin only when it does not exist; it never resets an existing password. Do not use the example values in production.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Long random secret for signed student/admin tokens |
| `JWT_EXPIRES_IN` | no | Token lifetime; defaults to `8h` |
| `ADMIN_EMAIL` | seed only | Initial admin email |
| `ADMIN_PASSWORD` | seed only | Initial admin password; minimum 12 characters/maximum 72 UTF-8 bytes |
| `PORT` | no | API port; defaults to `3001` |
| `CORS_ORIGIN` | production | Comma-separated allowed web origins |
| `VITE_API_BASE_URL` | split deploy | Public API prefix; browser default is `/api` |
| `VITE_SITE_URL` | production SEO | Public origin used to create absolute sitemap URLs |
| `EMAIL_REMINDERS_ENABLED` | no | Set `true` only after SMTP is configured |
| `SMTP_HOST`, `SMTP_PORT` | email | SMTP server and port |
| `SMTP_USER`, `SMTP_PASSWORD` | email | SMTP credentials, when required |
| `EMAIL_FROM` | email | Verified sender identity |

Reminder transport requires TLS on ports other than 465, rejects remote/file content loading, and sends only to the account email. With email disabled, schedules remain visible in the app and no message is sent.

## Database and migrations

Use `npm run db:deploy` in staging and production. Migrations are additive; the seed does not truncate tables, replace editorial content, remove users, or reset credentials.

```bash
npm run db:generate
npm run db:migrate   # local migration development only
npm run db:deploy    # apply committed migrations
npm run db:seed      # idempotent catalog seed
```

Core models cover universities/programs, accounts/RBAC, saves/follows/comparisons, councils, applications/documents/calendar, community/moderation, notifications/analytics, and every student planning tool. `ManagedContent` stores moderator-controlled news, legacy Q&A, community, and society panels in PostgreSQL. Calendar source keys connect roadmap, visa, document, application, deadline, and reminder dates without duplicating events.

The document vault currently stores private tracking metadata, status, notes, associations, and expiry. The upload endpoint intentionally returns `501` until a private object-store integration with MIME/size checks and signed URLs is configured; public file URLs are not accepted or exposed.

## University and program data

`data/universities.json` contains 31 South Korean institutions listed within the QS World University Rankings 2027 top 1000. Ranking labels, year, source, and verification date come from the official [QS South Korea guide](https://www.topuniversities.com/where-to-study/asia/south-korea/guide). Unknown admission rates, tuition, housing, deadlines, translations, and contacts remain `null`, empty, or marked `needs verification` rather than being guessed.

`data/programs.json` includes three undergraduate computer-science catalog records backed by official curriculum pages:

- [Seoul National University](https://cse.snu.ac.kr/en/academics/undergraduate/degree-requirements)
- [Korea University](https://cs.korea.edu/en_cs/under/computer_Curriculum.do)
- [Yonsei University](https://cais.yonsei.ac.kr/csai_en/educate/facultyCurri.do)

The seed updates verified ranking fields for existing universities while preserving existing IDs and editorial fields. It inserts missing universities, programs, council containers, and unnamed role titles. Images use stored official/reliable source metadata where present, fixed aspect ratios, lazy loading, and generated visual fallbacks. Moderators can edit image URLs, alt text, source URLs, and verification dates.

## Authentication and authorization

Passwords are hashed with bcrypt. JWT verification allows only HS256, checks the database account on every protected request, and enforces a configurable expiry. Student records are owner-scoped on the server. Admin tokens are checked against one of these stored roles:

- `admin`
- `moderator`
- `university_editor`
- `content_editor`
- `community_moderator`

Permissions are enforced by API route, not by client-side controls. Validation rejects unsupported URL protocols, overlong values, invalid IDs/dates, and unknown moderation status transitions. API errors are normalized without exposing secrets or database details. General, login, registration, and contact rate limits are applied separately.

## Major API groups

- Public: `/api/universities`, `/api/programs`, `/api/reviews`, `/api/student-councils`, `/api/content`, `/api/community`, `/api/contact`
- Student auth/workspace: `/api/auth`, `/api/user`, `/api/student-tools`, `/api/notifications`
- Administration: `/api/admin`, `/api/admin/universities`, `/api/moderator`, `/api/analytics`

University list responses include `data` and pagination `meta` (`total`, `page`, `limit`, `pages`). List filters accept search, city, ranking, tuition, program/major, language, English instruction, dormitory, type, level, scholarship, deadline status, and sort parameters.

## Moderation and analytics

The moderator page supports catalog/image/council/role edits, managed content, pending and reported community items, pending reviews, report resolution, verification queues, announcements, support messages, and activity history. Catalog changes require source-aware manual judgment. Activity records store the moderator, action, entity, previous/new state or status, and timestamp where relevant.

Analytics captures bounded event types and necessary metadata for views, search/filter, save/follow/compare/recommendation, planning, application, document, community, contact, and registration reporting. It avoids storing passwords, documents, message contents, or other unnecessary private fields.

## Calendar, reminders, and PDF

Opening/exporting the calendar syncs dated applications, roadmaps, checklist items, document expiry, visa tasks, followed/saved university deadlines, results, and scheduled reminders into owned events. Completing connected roadmap/checklist/visa events updates their source records. Cancelled generated events remain cancelled until their source changes; custom events can be deleted.

PDFs contain UniChase branding and a creation date. Export runs in the browser and should be used only on a trusted device for private student records.

## SEO and deployment

For the full application with HTTPS, API, and PostgreSQL on a Docker server, follow [Docker deployment](deploy/README.md). The production Compose stack provides migration ordering, persistent volumes, database readiness checks, and a private API/database network. The existing `docker-compose.yml` remains a local development database only.

`npm run build` type-checks, creates split production assets, and runs the sitemap generator. Set `VITE_SITE_URL` to the exact public origin (for example, `https://your-domain.example/`) during the production build. If it is unset, the build removes a stale sitemap instead of publishing incorrect URLs and writes a conservative `robots.txt`.

The included `vercel.json` provides SPA rewrites for the frontend. Deploy the API to a persistent Node service with PostgreSQL, set the environment variables there, run `npm run db:deploy`, then run `npm run db:seed` once. Point the frontend at that API or proxy `/api` to it. The reminder worker runs inside the API process; use one worker instance or separate it before horizontally scaling the API.

## Verification

Run the project gates before deployment:

```bash
npm run lint
npm run test
npm run build
npm audit
npm run db:deploy
npm run db:seed
```

The repository regression suites cover validation, authentication/RBAC, ownership, follow/save behavior, moderation persistence, calendar exports, nullable dates, cost bounds, eligibility scoring, and reminder claiming. A deployment still needs its own smoke test with the production database, SMTP provider, public origin, CORS setting, and object storage choice.

## Deliberate product boundaries

UniChase does not include counselor/mentor mode, agency multi-student management, an interactive map, a separate scholarship marketplace, or uncontrolled user editing of university facts. Scholarship information remains attached to university/program data and matching preferences.
