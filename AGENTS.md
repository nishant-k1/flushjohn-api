# AGENTS.md — flushjohn-api

Backend API for Flush John — portable restroom rental brokerage (not a direct service provider). This API powers both the public website (`flushjohn-web`) and the staff CRM (`flushjohn-crm`).

## Commands

```bash
npm run dev                 # tsx watch app.ts (port 8080)
npm run build               # tsc -> dist/
npm start                   # node ./dist/app.js
npm run type-check          # tsc --noEmit
npm run lint                # eslint . --ext .ts
npm run lint:fix            # eslint . --ext .ts --fix
```

Build MUST pass with `tsc --noEmit` before push. There is zero tolerance for type errors.

## Architecture

- **Express 4 + TypeScript 5 (ESM) + Mongoose 8**, deployed on **Render** as a single web service
- **MongoDB Atlas** — `flushjohnDB` database. Connection string in `MONGO_DB_URI`
- **File storage**: AWS S3 (`@aws-sdk/client-s3`) + CloudFront CDN (`cdn.flushjohn.com`)
- **PDF generation**: Playwright (headless Chromium) — pooled browser, pre-warmed on startup
- **Email**: Zoho SMTP via nodemailer with connection pooling. Templates as JS functions returning HTML strings
- **Payments**: Stripe — payment links, payment intents, webhook handler
- **Real-time**: Socket.io (3 namespaces: leads, salesOrders, speechRecognition)
- **WebSocket auth**: re-queries DB on every connection — no caching

### Route Mounting

Routes are mounted at BOTH `/api/v1/*` and root `/*` for backward compatibility:
- Public: `/leads` (POST, no auth), `/contact`, `/business-info`, `/blogs`, `/sales-assist`
- Auth required: `/quotes`, `/salesOrders`, `/jobOrders`, `/customers`, `/vendors`, `/payments`, `/dashboard`, `/notes`, `/contacts`, `/file-upload`
- Admin only: `/users`, `/blog-automation`
- Special: `/payments/webhook` (raw body, no JSON parsing)

### Business Data Flow

```
Public lead form → Lead → Quote (PDF + email) → Sales Order → Payment (Stripe) → Job Order → Vendor
```

- Lead numbers use **atomic MongoDB Counter** (`$inc` on `findOneAndUpdate`)
- Quote/SalesOrder/JobOrder numbers also use atomic Counters
- Products are server-validated (quantity × rate = amount recalculated server-side)
- Payment total recalculated on every webhook

### Key Files

```
app.ts                          Express app setup, middleware chain, public lead creation
features/leads/                 Lead management (public + authenticated)
features/quotes/                Quote CRUD + PDF generation + email
features/salesOrders/           Sales orders + Stripe payment integration
features/jobOrders/             Job orders + vendor assignment
features/customers/             Customer CRUD
features/vendors/               Vendor CRUD + representatives
features/payments/              Stripe integration + webhook + receipt emails
features/auth/                  JWT auth (jsonwebtoken + bcrypt)
features/blogs/                 Blog CRUD + OpenAI-powered automation
features/common/                Shared services (email, S3, revenue)
features/fileManagement/        S3 uploads + PDF generation (Playwright)
features/contacts/              Contact form submissions
features/notifications/         Lead notifications + socket emission
features/salesAssist/           Voice AI sales assistant (Google Speech-to-Text)
middleware/                     CSRF protection, audit logging, product validation
```

## Auth

- **JWT**: jsonwebtoken, HS256, 24h expiry, `SECRET_KEY` as secret
- **Password hashing**: bcrypt
- **RBAC**: admin, manager, user roles
- **CSRF**: MongoDB-backed token store with 24h TTL + in-memory fallback
- **Token verification**: `authenticateToken` middleware sets `req.user`

## Env Variables

Key variables (see `.env` for full list):
- `PORT`, `MONGO_DB_URI`, `SECRET_KEY`, `ORIGINS`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `CLOUDFRONT_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`, `UNSPLASH_ACCESS_KEY`
- `FLUSH_JOHN_EMAIL_ID`, `FLUSH_JOHN_EMAIL_PASSWORD`
- `SITEWAY_SERVICES_EMAIL_ID`, `SITEWAY_SERVICES_EMAIL_PASSWORD`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `GOOGLE_CREDENTIALS_JSON`

## Conventions

- Files: kebab-case, layer suffixes (`*-routes.ts`, `*-service.ts`, `*-model.ts`, `*Repository.ts`)
- Response envelope: `{ success, message?, ...data }` — 200 for success, 201 for creates
- Controllers: `async (req, res)` with full try/catch → 500 JSON; never throw to Express
- All imports relative (no `@/` alias)
- `any` type used pervasively — `strict: false` in tsconfig
- No tests anywhere
- No semicolons, single quotes, 2-space indent

## Critical Rules

1. **Never commit `.env` or `.env.backup` to git** — credentials were exposed in git history. All credentials must be rotated.
2. **Email is fire-and-forget** — `sendEmail().catch(err => console.error(...))`, never `await sendEmail()` in route handlers
3. **Webhook must always return 200** — even on processing errors. Stripe retries 500s.
4. **Webhook event deduplication** — check `WebhookEvent` collection before processing
5. **Use `$facet` for list endpoints** — single aggregation pipeline for data + count, not two separate pipelines
6. **PDF cache by `lastPdfGeneratedAt`** — skip regeneration if doc hasn't changed
7. **Revenue calculation capped** — `MAX_PAGES = 50` to prevent runaway queries
8. **Cache-Control: public, max-age=60** on all GET responses
9. **Request IDs** — every request gets `X-Request-ID` header for tracing
10. **Audit logging** — all POST/PUT/PATCH/DELETE are logged to `AuditLog` collection

## Gotchas

- **SMTP TLS**: Uses Zoho's proper TLS. Do NOT add `rejectUnauthorized: false`
- **Stripe idempotency**: `createPaymentIntent` and `processRefund` have idempotency keys
- **CSRF survives deploys**: Stored in MongoDB, not in-memory Map
- **Product sub-schema**: Products use `productSubSchema` with typed fields (id, item, desc, quantity, rate, amount, usageType). `_id: false` to prevent auto-IDs on subdocuments
- **SalesOrders/JobOrders**: `deliveryDate` and `pickupDate` are `Date` type
- **Leads**: `deliveryDate` and `pickupDate` are `Date` type too
- **Quotes**: Already use `Date` for dates (was correct from start)
- **Billing cycles**: `cycleStartDate`/`cycleEndDate` are still `String` (not changed — affects existing data)
- **Blog automation**: `POST /blog-automation/generate-blog` returns immediately, processes async
- **Health check**: `GET /health` checks MongoDB ping, S3 config, Stripe config
- **API v1**: All routes available at both `/api/v1/*` and root `/*`

## Business Context

Flush John is a **brokerage** for portable restroom rentals:
- Customers request quotes on flushjohn.com
- Staff in CRM coordinate with local vendors for pricing
- FlushJohn adds ~$50 margin on top of vendor price
- Vendors (primarily Siteway Services) fulfill the actual rental
- Pricing varies by vendor, region, and unit type — never hardcoded
- The business model should NOT be revealed to customers on the website
