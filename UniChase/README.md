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
- Light/dark theme toggle with localStorage persistence and first-visit system preference support
- University image metadata for campus photos, logos, alt text, source URLs, image verification dates, and generated fallbacks
- Equal-height university cards with fixed image ratio, lazy image loading, broken-image fallback handling, result count, sorting, share links, breadcrumbs, recently viewed universities, and back-to-top navigation
- Student account register/login/logout with hashed passwords and JWTs
- Student dashboard with saved universities, comparisons, checklist, deadlines, recommendations link, and profile
- Guided onboarding preferences that can generate dashboard checklist and deadline items
- Application deadline tracking inside university data and dashboard reminders
- Application status tracker with per-university status, deadline, notes, and calendar integration
- File/document vault metadata for application documents
- Student calendar events with `.ics` export for external calendar apps
- Real student community posts, comments, likes, saves, reports, and official answers
- Notification center with unread counts, notification dropdown, full notification page, and announcements
- Moderator operations queue for community content, reports, verification, broken image/link review, role management, internal notes, announcements, and activity logs
- Analytics event tracking plus moderator analytics overview, top universities, search terms, user metrics, and CSV export
- Rule-based "Find My Best University Match" recommendations
- Expanded university detail pages with tuition, programs, requirements, documents, steps, housing, student life, deadlines, official links, and contact data
- Improved search across names, Korean names, city, majors, programs, tags, language, and descriptions
- SEO metadata, Open Graph/Twitter tags, canonical URLs, structured data, `sitemap.xml`, and `robots.txt`
- Interface language switcher for English, Korean, Russian, and Uzbek labels
- Contact/support form stored in the database
- Moderator tools for backend admins to add, edit, verify, and delete student council records and council roles
- Moderator image tools for campus image URL, logo URL, alt text, image source URL, and verification dates

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

Private binary document storage is not configured. The document vault stores secure metadata and returns `501` from the upload endpoint until an S3/R2/GCS-style storage provider is added.

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
- `CommunityPost`
- `CommunityComment`
- `CommunityLike`
- `CommunitySavedPost`
- `CommunityReport`
- `Notification`
- `ModeratorActivityLog`
- `ModeratorInternalNote`
- `AnalyticsEvent`
- `UserOnboardingPreference`
- `UserApplication`
- `UserDocument`
- `CalendarEvent`

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

University image data uses official university pages where available and reliable public Wikimedia/Wikipedia source pages for some logos or campus images. When a verified image is missing or a URL fails to load, the frontend falls back to a generated UniChase campus/logo placeholder so cards and detail pages do not shift or break.

New `University` image fields:

- `campusImageUrl`
- `logoUrl`
- `imageAlt`
- `imageSourceUrl`
- `imageLastVerifiedAt`

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
- `sort`: `qsRank`, `name`, `city`, `tuition`, or `recent`

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
- `GET /api/user/onboarding`
- `POST /api/user/onboarding`
- `PATCH /api/user/onboarding`
- `POST /api/user/onboarding/generate-dashboard`
- `GET /api/user/applications`
- `POST /api/user/applications`
- `GET /api/user/applications/:id`
- `PATCH /api/user/applications/:id`
- `DELETE /api/user/applications/:id`
- `GET /api/user/documents`
- `POST /api/user/documents`
- `GET /api/user/documents/:id`
- `PATCH /api/user/documents/:id`
- `DELETE /api/user/documents/:id`
- `POST /api/user/documents/:id/upload`
- `GET /api/user/calendar/events`
- `POST /api/user/calendar/events`
- `PATCH /api/user/calendar/events/:id`
- `DELETE /api/user/calendar/events/:id`
- `GET /api/user/calendar/export.ics`
- `GET /api/user/calendar/events/:id/export.ics`

Community:

- `GET /api/community/categories`
- `GET /api/community/posts`
- `GET /api/community/posts/:id`
- `POST /api/community/posts`
- `PATCH /api/community/posts/:id`
- `DELETE /api/community/posts/:id`
- `POST /api/community/posts/:id/comments`
- `PATCH /api/community/comments/:id`
- `DELETE /api/community/comments/:id`
- `POST /api/community/posts/:id/like`
- `POST /api/community/posts/:id/save`
- `POST /api/community/posts/:id/report`

Notifications:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

Analytics:

- `POST /api/analytics/event`

Admin:

- `POST /api/admin/login`
- `GET /api/admin/universities`
- `POST /api/admin/universities`
- `PUT /api/admin/universities/:id`
- `DELETE /api/admin/universities/:id`

Moderator:

- `POST /api/moderator/universities`
- `PATCH /api/moderator/universities/:id`
- `PATCH /api/moderator/universities/:id/images`
- `POST /api/moderator/student-councils`
- `PATCH /api/moderator/student-councils/:id`
- `DELETE /api/moderator/student-councils/:id`
- `POST /api/moderator/student-council-roles`
- `PATCH /api/moderator/student-council-roles/:id`
- `DELETE /api/moderator/student-council-roles/:id`
- `POST /api/moderator/profile`
- `PATCH /api/moderator/profile`
- `GET /api/moderator/queue`
- `GET /api/moderator/reports`
- `PATCH /api/moderator/posts/:id/status`
- `PATCH /api/moderator/comments/:id/status`
- `PATCH /api/moderator/reviews/:id/status`
- `GET /api/moderator/activity-logs`
- `GET /api/moderator/broken-links`
- `GET /api/moderator/broken-images`
- `PATCH /api/moderator/users/:id/role`
- `POST /api/moderator/internal-notes`
- `POST /api/moderator/notifications/announcement`
- `GET /api/moderator/analytics/overview`
- `GET /api/moderator/analytics/top-universities`
- `GET /api/moderator/analytics/searches`
- `GET /api/moderator/analytics/users`
- `GET /api/moderator/analytics/export`

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

## Theme System

The navbar includes an accessible light/dark mode toggle. The selected theme is stored in localStorage under `unichase.theme`; if no theme is saved, the app uses the operating system preference. Theme colors are driven by CSS variables so light mode stays close to the original UniChase design while dark mode adjusts surfaces, text, borders, form controls, cards, dropdowns, and moderator/dashboard pages.

## Image Management

Moderators can update university image data from the Student Councils moderator tab after selecting a university. Editable fields include campus image URL, logo URL, image alt text, image source URL, image verification date, and university verification date. URL and date fields are validated by the API, and public image rendering falls back automatically if a URL is missing or broken.

## Platform Expansion

The community system is database-backed and supports category/search filters, university-linked posts, comments, likes, saved posts, edit/delete ownership checks, official answers, and student reporting.

Notifications are generated for student-facing workflow updates and can also be sent by moderators as platform announcements. The navbar shows an unread badge and preview dropdown, while `/notifications` provides the full notification center.

Student workflows now include onboarding preferences, application tracking, document vault records, and calendar events. Creating an application with a deadline can create a linked calendar event, and students can export all events or a single event as `.ics`.

Moderator Platform Ops extends the existing moderator area with content queues, report review, verification queues, broken asset/link review, internal notes, announcements, role changes, activity logs, and analytics dashboards. Admin role claims include the moderator role so sensitive operations can be permission-gated.

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
- Moderator university image edit flow
- University sorting and result counts
- Equal-height card rendering with image fallbacks
- Light/dark theme toggle persistence
- Contact form storage
- Language switcher
- Mobile layout
- Backend health and all new API endpoint categories
