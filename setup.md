# DealFlow360 — Foundation Setup Prompt (Backend + Frontend + Database Basics + Docker)

You are setting up the **project foundation** for DealFlow360, a B2B sales operations hackathon project. The `backend/` and `frontend/` folders already exist (currently empty) at the project root — set up inside them. This is a **foundation-only** task: folder structure, configuration, dependencies, and placeholders. Do NOT implement any DealFlow360 business logic (quotations, discounts, risk scoring, approvals, warehouse optimization, billing, negotiations) yet — those come in a later phase after the database design is approved.

Work in this order and confirm each phase before moving to the next: **(1) Backend foundation → (2) Database basics → (3) Frontend foundation → (4) Docker Compose to tie it all together.**

---

## Phase 1 — Backend Foundation (inside `backend/`)

Stack: Node.js + Express, **JavaScript (not TypeScript)**, PostgreSQL + Prisma ORM, RabbitMQ, Redis, JWT auth, bcrypt, Google OAuth, Brevo for transactional email. Architecture: **modular monolith**, not microservices. ES Modules (`"type": "module"` in package.json).

Build this folder structure under `backend/src/`:
```
config/          → env.js, database.js, redis.js, rabbitmq.js
modules/         → one folder per business module (auth, users, customers, products,
                    quotations, pricing, discounts, approvals, inventory, warehouses,
                    fulfillment, negotiations, subscriptions, billing, invoices,
                    payments, notifications, analytics, audit) — each with
                    controller/service/repository/routes/validation files, but only
                    the auth module gets real implementation now; the rest stay as
                    empty scaffolds with the same file pattern
middleware/      → auth, role, error, not-found, rate-limit
services/        → email/brevo.service.js, oauth/google.service.js, token/jwt.service.js
queues/          → publishers/, consumers/, queue.constants.js
events/          → event.types.js, event.publisher.js
utils/           → logger.js, response.js, errors.js
routes/          → index.js
app.js, server.js
```
Plus `prisma/` (schema.prisma, seed.js, migrations/), `tests/` (unit, integration, e2e), `.env.example`, `.gitignore`, `package.json`, `README.md`.

Install: `express cors helmet dotenv cookie-parser jsonwebtoken bcrypt @prisma/client amqplib ioredis zod pino pino-http express-rate-limit google-auth-library @getbrevo/brevo` — dev: `prisma nodemon jest supertest`. Do not install Passport, Redux, GraphQL, Mongoose, Sequelize, Socket.io, or any microservice framework.

Set up:
- Express app with Helmet, CORS (restricted to `FRONTEND_URL`, never `*`), JSON body parser, cookie parser, Pino HTTP logging, global rate limiting, centralized error handling, 404 handler.
- Health endpoints: `GET /api/health`, `/api/health/db`, `/api/health/redis`, `/api/health/rabbitmq`.
- All business routes versioned under `/api/v1`.
- Auth foundation: email/password + Google OAuth placeholders, JWT access (short-lived) + refresh (long-lived, httpOnly cookie) tokens, bcrypt hashing — do not implement the full auth workflow yet, just the architecture and services.
- RabbitMQ: reusable `publishEvent(eventName, payload)` publisher interface; declare (don't fully consume yet) queues for `quotation.approved`, `quotation.rejected`, `quotation.created`, `negotiation.created`, `approval.required`, `order.confirmed`, `payment.received`, `inventory.updated`, `backorder.created`, `subscription.created`, `email.send`, `notification.send`.
- Redis: reusable client for caching/rate limiting/temp state — never a source of truth for inventory, payments, quotations, or orders.
- Brevo: `sendEmail({ to, subject, templateId, params })` abstraction, never called directly from controllers.
- Centralized custom errors (BadRequest/Unauthorized/Forbidden/NotFound/Conflict/Validation) with a consistent `{ success, message, error: { code, details } }` response shape; no stack traces in production.
- Zod validation pattern for body/params/query.
- Pino structured logging — never log passwords, tokens, or credentials.
- RBAC groundwork for roles: `ADMIN, SALES_REP, SALES_MANAGER, FINANCE, OPERATIONS, CUSTOMER` via reusable authorization middleware, not hardcoded per-controller checks.

`.env.example` should include `NODE_ENV, PORT, DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, REDIS_URL, RABBITMQ_URL, FRONTEND_URL, COOKIE_DOMAIN`.

When done, show: folder tree, package.json, installed dependencies, `.env.example`, Prisma init status, and any assumptions made.

---

## Phase 2 — Database Basics (inside `backend/prisma/`)

At this stage, only initialize Prisma with PostgreSQL and create a **minimal** schema — just enough User/Role structure to support the auth foundation from Phase 1. Do **not** design or generate the full DealFlow360 schema (quotations, versioning, discount rules, approvals, inventory, fulfillment, billing, subscriptions) yet — that requires a separate design pass covering the quotation state machine, discount/risk model, inventory reservation strategy, and fulfillment optimization model, which will be reviewed and approved before the full `schema.prisma` is written.

Deliverable for this phase: `schema.prisma` with just `User` and `Role` (or equivalent minimal auth models), a working `prisma migrate dev`, and `prisma studio` opening cleanly.

---

## Phase 3 — Frontend Foundation (inside `frontend/`)

Stack: React + Vite, **JavaScript (not TypeScript)**, React Router, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form + Zod, Axios, Recharts, Lucide React, Sonner, date-fns.

Build this folder structure under `frontend/src/`:
```
assets/
components/      → ui/, layout/, common/, feedback/
features/        → one folder per feature (auth, dashboard, quotations, approvals,
                    customers, products, fulfillment, inventory, subscriptions,
                    billing, invoices, negotiations, analytics, deal-health, admin),
                    each self-contained: components/, hooks/, <feature>.api.js,
                    <feature>.constants.js, <feature>.schemas.js, <feature>.utils.js
pages/           → auth/, sales/, customer/, admin/
layouts/          → AuthLayout.jsx, SalesLayout.jsx, CustomerLayout.jsx, AdminLayout.jsx
routes/          → AppRoutes.jsx, ProtectedRoute.jsx, RoleRoute.jsx
hooks/
lib/             → axios.js, queryClient.js, utils.js
services/        → auth.service.js, api.service.js
schemas/, constants/, context/, config/
App.jsx, main.jsx, index.css
```
Plus `public/`, `.env.example`, `.gitignore`, `index.html`, `package.json`, `README.md`.

Set up:
- Routes for `/login /signup /forgot-password`, `/sales/*` (dashboard, quotations, quotations/:id, quotations/new, approvals, fulfillment, inventory, subscriptions, invoices, deal-health), `/admin/*` (products, customers, discount-rules, approval-rules, warehouses, subscription-plans, reports), `/customer/quotation/:id`. **The customer portal must use its own `CustomerLayout`, never the internal sales layout relabeled.**
- `ProtectedRoute` (auth check → redirect to `/login`) and `RoleRoute` (role check → unauthorized page) — reusable, not hardcoded per page.
- Centralized Axios instance (`baseURL` from env, `withCredentials: true`, response/error interceptors).
- TanStack Query configured globally for all server data (customers, products, quotations, approvals, inventory, fulfillment, invoices, subscriptions, analytics) — React state only for local UI state.
- React Hook Form + Zod patterns ready for Login, Signup, Product, Customer, Quotation, Discount, Approval, Negotiation forms.
- Reusable UI primitives via Tailwind + shadcn/ui + Lucide: Button, Input, Select, Dialog, Modal, Dropdown, Table, Badge, Card, Tabs, Toast, Tooltip, Skeleton, EmptyState, LoadingState, ErrorState.
- Semantic status components for: Draft, Pending Approval, Approved, Rejected, Under Negotiation, Confirmed, Fulfillment, Paid, Backordered, Cancelled — no scattered arbitrary Tailwind colors.
- Dashboard placeholders (KPI cards, charts via Recharts, tables, alerts) clearly marked as placeholder — no fake data presented as real.
- Sonner notification helpers: `showSuccess()`, `showError()`, `showInfo()`, `showWarning()`.
- Leave a clean abstraction point for future SSE-based real-time updates — do not install Socket.io or implement real-time behavior now.

`.env.example`: `VITE_API_BASE_URL=http://localhost:5000/api/v1`, `VITE_GOOGLE_CLIENT_ID=`.

Do not implement quotation calculations, discount/risk logic, approval logic, warehouse optimization, billing, subscriptions, or fake AI. Do not create Redux unless there's a genuine need.

When done, show: folder tree, package.json, installed dependencies, `.env.example`, routes created, commands to run, and any assumptions made.

---

## Phase 4 — Docker Compose (project root)

Add a `docker-compose.yml` at the project root (alongside `backend/` and `frontend/`) with these services:
- `postgres` — official `postgres` image, named volume for data persistence, exposes 5432, env vars matching `DATABASE_URL` in backend `.env`.
- `redis` — official `redis` image, exposes 6379.
- `rabbitmq` — `rabbitmq:3-management` image (gives the management UI on port 15672 for free — useful for demoing/debugging queues), exposes 5672 and 15672.
- `backend` — built from a `backend/Dockerfile` (Node.js base image, installs deps, runs `npm run dev` or `node src/server.js`), `depends_on` postgres/redis/rabbitmq, reads env from `backend/.env`.
- `frontend` — built from a `frontend/Dockerfile` (Node.js base image running the Vite dev server, or a multi-stage build served via nginx if you want a production-style container), exposes 5173 (or 80 if using nginx).

Write minimal `Dockerfile`s for `backend/` and `frontend/` alongside the compose file. Add a top-level `README.md` section (or update existing ones) with the single command to bring the whole stack up: `docker compose up --build`. Do not add Kubernetes manifests, Helm charts, or any cluster orchestration at this stage — Docker Compose is the full scope of the infra setup for now.

---

Confirm completion of each phase with the requested output before proceeding to the next.