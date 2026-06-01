# UniChase

UniChase is a React/Vite university discovery website with an Express, PostgreSQL, and Prisma backend.

The public visual design is intentionally preserved. New functionality reuses the existing card, form, button, spacing, color, and typography language.

## Features

- Backend-loaded university list and detail pages
- QS 2026 seed coverage for the 28 South Korean institutions listed in the QS global top 1000
- Advanced university filters: city, QS ranking range, tuition range, major, language, dormitory, public/private type, deadline status, and study level
- University comparison for 2 to 4 universities
- Save/favorite universities with localStorage and optional account sync
- Student council profiles and role/member placeholders with source URLs and verification status
- Student account register/login/logout with hashed passwords and JWTs
- Student dashboard with saved universities, comparisons, checklist, deadlines, recommendations link, and profile
- Application deadline tracking inside university data and dashboard reminders
- Rule-based "Find My Best University Match" recommendations
- Expanded university detail pages with tuition, programs, requirements, documents, steps, housing, student life, deadlines, official links, and contact data
- Improved search across names, Korean names, city, majors, programs, tags, language, and descriptions
- SEO metadata, Open Graph/Twitter tags, canonical URLs, structured data, `sitemap.xml`, and `robots.txt`
- Interface language switcher for English, Korean, Russian, and Uzbek labels
- Contact/support form stored in the database
- Moderator tools for backend admins to add, edit, verify, and delete student council records and council roles

Excluded by design:

- No user-submitted corrections
- No separate scholarship database section
- No interactive map
- No admin dashboard redesign

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: Node.js, Express
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT with bcrypt password hashing
- Validation: Zod

## Environment Variables

Create `.env` from `.env.example` and replace placeholder secrets.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:55432/unichase?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-strong-password"
PORT=3001
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
VITE_API_BASE_URL="http://localhost:3001/api"
```

Email sending is not configured. Contact messages are stored in `ContactMessage`; add an email provider later if notifications are needed.

## Local Setup

```bash
npm install
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run db:seed
```

`npm run seed:universities` is an alias for the same seed command.

Run the backend:

```bash
npm run server:dev
```

Run the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Database

Prisma schema and migrations live in `prisma/`.

Main models:

- `University`
- `StudentCouncil`
- `StudentCouncilRole`
- `ModeratorProfile`
- `AdminUser`
- `StudentUser`
- `SavedUniversity`
- `ComparisonSet`
- `ComparisonUniversity`
- `UserDeadline`
- `ChecklistItem`
- `RecommendationPreference`
- `ContactMessage`

Useful commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run seed:universities
```

Seed data includes every South Korean institution in the QS World University Rankings 2026 global top 1000, based on:

- [QS World University Rankings](https://www.topuniversities.com/qs-top-uni-wur)
- [Truescho country ranking mirror for Korea](https://truescho.com/en/rankings/country/kr)

The seed stores QS rank labels, source URLs, verification timestamps, and student council placeholders. It intentionally does not invent real student council people; role/member records start as placeholders marked `needs verification` until a moderator verifies public sources or adds known information.

## API Endpoints

Public:

- `GET /api/health`
- `GET /api/universities`
- `GET /api/universities/:idOrSlug`
- `GET /api/universities/:idOrSlug/student-council`
- `GET /api/universities/search`
- `GET /api/universities/filter`
- `GET /api/universities/compare?ids=1,2`
- `POST /api/universities/recommendations`
- `GET /api/student-councils`
- `GET /api/student-councils/:id`
- `POST /api/contact`

University query parameters:

- `q`, `search`, `name`
- `city`
- `rankingMin`, `rankingMax`, `ranking`, `maxRanking`
- `tuitionMin`, `tuitionMax`, `tuition`, `maxTuition`
- `major`
- `language`
- `english`
- `dormitory`
- `type`
- `deadline`
- `level`
- `scholarship`, `hasScholarships`

Student auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Student dashboard:

- `GET /api/user/profile`
- `PATCH /api/user/profile`
- `GET /api/user/saved-universities`
- `POST /api/user/saved-universities`
- `DELETE /api/user/saved-universities/:id`
- `GET /api/user/deadlines`
- `POST /api/user/deadlines`
- `GET /api/user/checklist`
- `PATCH /api/user/checklist`

Admin:

- `POST /api/admin/login`
- `GET /api/admin/universities`
- `POST /api/admin/universities`
- `PUT /api/admin/universities/:id`
- `DELETE /api/admin/universities/:id`

Moderator:

- `POST /api/moderator/universities`
- `PATCH /api/moderator/universities/:id`
- `POST /api/moderator/student-councils`
- `PATCH /api/moderator/student-councils/:id`
- `DELETE /api/moderator/student-councils/:id`
- `POST /api/moderator/student-council-roles`
- `PATCH /api/moderator/student-council-roles/:id`
- `DELETE /api/moderator/student-council-roles/:id`
- `POST /api/moderator/profile`
- `PATCH /api/moderator/profile`

Protected routes require:

```http
Authorization: Bearer <token>
```

## SEO

The app updates page titles, descriptions, canonical links, Open Graph/Twitter tags, and university structured data client-side. Static crawler hints live in:

- `public/sitemap.xml`
- `public/robots.txt`

Clean university URLs are available at `/universities/:slug`, while legacy `/university/:id` still works.

## Language System

The language switcher stores the selected language in localStorage and translates interface labels for English, Korean, Russian, and Uzbek. University content remains English unless translated university fields are added later.

## Deployment

Frontend:

1. Set `VITE_API_BASE_URL` to the production API URL.
2. Run `npm run build`.
3. Deploy `dist/` to a static host.

Backend:

1. Provision PostgreSQL.
2. Set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`, and `CORS_ORIGIN`.
3. Run `npm run db:deploy`.
4. Run `npm run db:seed` once to load the QS 2026 Korea dataset and create the backend admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
5. Start with `npm run server:start`.

For Vercel-only hosting, deploy the Express backend separately or adapt it into serverless functions. This project is Vite, not Next.js.

## Testing

Automated checks:

```bash
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

Manual checks used during development:

- Advanced filters and search
- Compare selection and comparison page
- Saved universities and dashboard display
- Student registration and protected profile endpoint
- Checklist updates
- Deadline saving
- Recommendation form and scored results
- Expanded university detail pages
- Student council detail sections and role verification badges
- Moderator backend login plus student council create, update, and delete flows
- Contact form storage
- Language switcher
- Mobile layout
- Backend health and all new API endpoint categories
