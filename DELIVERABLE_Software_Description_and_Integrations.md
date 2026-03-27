# Manager Equipment Collection Portal — Deliverable Description

**Document purpose:** This document describes the software delivered in response to your project outline (`src/ogProjectOutline.md`). It maps what was built to your requirements, documents all integrations, and provides the information your team needs to deploy, configure, and extend the system.

---

## 1. Executive Summary

The **Manager Equipment Collection Portal** is a lightweight, manager-facing web application that:

- Shows each manager the **equipment assigned to their direct and indirect reports** (staff list and equipment scoped by your AD/Entra-style manager hierarchy).
- Lets managers **mark items as “collected/received”** with an optional note and timestamp.
- **Alerts IT** when an item is marked collected (via Email, Teams, or webhook).
- Maintains a **collection log** with a **close-out** workflow so IT can record when the item has been physically recovered.

The application is built with **Next.js**, uses a **SQLite** database for the pilot (PostgreSQL-ready), and is designed to deploy via **GitHub → Coolify/Nixpacks** with all secrets and API endpoints supplied via **environment variables**.

---

## 2. Response to Your Project Outline

The following sections align the delivered software with your outline.

### 2.1 Goal and Strategy (Sections 1 & 3 of outline)

| Your requirement | Delivered |
|------------------|-----------|
| Manager-facing web UI for equipment assigned to direct/indirect reports | ✅ Web app with manager-scoped staff list and equipment. |
| Mark items “received/collected”; alert IT; collection log and close-out | ✅ Mark collected action, configurable IT notification, full collection log and close-out. |
| Front-end first; wire to live systems via env vars and documented APIs | ✅ UI first; ref tab, notifications, and auth are env-driven and documented. |
| Use AD/Entra manager field for who a manager can view | ✅ Manager hierarchy stored in DB (users + `managerId`); pilot uses seed data; production can sync from AD/Entra. |

### 2.2 Scope and Core Requirements (Section 2 of outline)

**A) Manager UI**

| Requirement | Delivered |
|-------------|-----------|
| Staff list scoped to authenticated manager (including indirect reports) | ✅ `/api/staff` returns only direct + indirect reports; hierarchy resolved from DB. |
| Equipment assigned per staff (from ref tab data) | ✅ Equipment from ref tab API and/or DB cache; shown per staff on dashboard and staff detail. |
| Manager action: Mark “Collected/Received” with timestamp and optional notes | ✅ “Mark collected” on staff detail and asset-centric views; timestamp and notes stored. |
| Visibility rules from AD/Entra manager hierarchy (no cross-team) | ✅ All staff, equipment, and collection APIs filter by the current manager’s report set. |

**B) Alerts to IT**

| Requirement | Delivered |
|-------------|-----------|
| Create collection event in database when item marked collected | ✅ Every “mark collected” creates a `CollectionEvent` row. |
| Notify IT via configurable channel (Email / Teams / webhook) | ✅ One channel at a time: `NOTIFICATION_PROVIDER` = `email`, `teams`, or `webhook`; see Section 5. |

**C) Data & Logging**

| Requirement | Delivered |
|-------------|-----------|
| Persist AD/Entra-derived user records (employee id, manager relationships) in DB | ✅ `User` model with `employeeId`, `managerId`, `displayName`, `email`, `lastSyncedAt`; pilot seeded, production can sync from AD/Entra. |
| Collection event history (who, when, notes) | ✅ `CollectionEvent` stores asset, assignee, manager who marked it, timestamp, notes. |
| “Close out” when IT has physically recovered item | ✅ Status `COLLECTED_PENDING_IT` → `CLOSED_OUT`; `closedOutByIt`, `closedOutAt` stored. |

**D) Integration & Deployment**

| Requirement | Delivered |
|-------------|-----------|
| Integrate with ref tab API for equipment | ✅ Reftab client (HMAC + `GET /assets`); equipment API merges Reftab with DB cache; env-based URL, keys, and field mapping. |
| Deploy via GitHub → Coolify/Nixpacks, env vars for secrets/API keys | ✅ `Dockerfile`, `nixpacks.toml`; all configuration via env (see `.env.example`). |
| Next.js | ✅ Next.js 14 with App Router, API routes, Tailwind. |

### 2.3 System Components (Section 4 of outline)

**Front-end**

- **Manager dashboard** — Staff list and equipment summaries in three views: table (fast scanning), staff cards (people-centric), asset-centric (return logistics). View choice persisted in session.
- **Staff detail** — Per-report equipment list and “Mark collected” with optional notes.
- **Collection history** — Collection log page: pending IT pickup and closed-out events; IT can close out from this page.

**Backend (API layer)**

- `GET /api/me` — Current user (for pilot: from env).
- `GET /api/staff` — Staff list for current manager’s scope (direct + indirect).
- `GET /api/equipment` — Equipment for scope; optional `?employee_id=...` for one person; merges DB cache and ref tab.
- `POST /api/collect` — Mark item collected (validates scope, creates event, triggers IT notification).
- `GET /api/collection` — Collection events for manager’s scope.
- `POST /api/closeout` — Mark a collection event as closed out (IT received item).

**Database**

- **Users** — Employee id, display name, email, manager link, last-synced; supports hierarchy resolution.
- **EquipmentAssignment** — Optional cache: asset tag, serial, model, assigned employee, source (e.g. ref tab).
- **CollectionEvent** — Full collection log and close-out state (see Section 4).

**Notifications**

- Single configurable provider: Email (SMTP/O365), Teams webhook, or generic webhook (e.g. n8n). See Section 5.

### 2.4 Pilot Deliverables (Section 6 of outline)

| Deliverable | Status |
|-------------|--------|
| 2–3 UI prototypes: staff list by hierarchy, equipment per staff, mark collected | ✅ Table, cards, and asset-centric views; staff detail with mark collected. |
| Initial DB schema for users + collection logging + close-out | ✅ Prisma schema: User, EquipmentAssignment, CollectionEvent. |
| Notification when item marked collected (Email/Teams/webhook) | ✅ Implemented and configurable. |
| Integration plan and wiring to ref tab API (live when env set) | ✅ Ref tab client and equipment API; document below. |

---

## 3. Capabilities Outside the Web UI

The following capabilities are available regardless of the front-end (e.g. for integration, automation, or future clients).

### 3.1 REST-style API

- **Current user** — Who is acting (pilot: from env).
- **Staff scope** — List of employee IDs the current manager can see (direct + indirect).
- **Equipment** — List of equipment for that scope (DB + ref tab), optionally filtered by `employee_id`.
- **Mark collected** — Submit asset + assignee + notes; creates event and sends IT notification.
- **Collection log** — List of collection events in scope with status and close-out info.
- **Close out** — Set an event to “closed out” with timestamp and closing user.

All of these enforce manager scope; no cross-team data is returned.

### 3.2 Data and hierarchy

- **User and manager tree** — Stored in DB; hierarchy is walked to compute direct + indirect reports (no separate closure table in pilot).
- **Equipment cache** — Optional; can be populated from ref tab or seed; equipment API merges cache with live ref tab.
- **Collection log** — Full history and close-out state for reporting and auditing.

### 3.3 Integrations (non-UI)

- **Reftab** — Signed `GET /assets`, filtered to report scope; merged with DB in equipment API.
- **IT notifications** — One channel (webhook, Teams, or email) invoked on each “mark collected.”
- **Auth (pilot)** — Current user from env; production can switch to SSO and map token to `User.employeeId`.

---

## 4. Data Model (Pilot-Level)

The database is defined in `prisma/schema.prisma`. Summary:

**User**

- `id`, `employeeId` (unique), `upn`, `displayName`, `email`
- `managerId` (FK to User) — defines manager hierarchy
- `isManager`, `lastSyncedAt`, `createdAt`, `updatedAt`

**EquipmentAssignment** (optional cache)

- `id`, `assetTag`, `serial`, `model`, `assignedToEmployeeId`, `source` (e.g. `ref_tab`), `lastSyncedAt`

**CollectionEvent**

- `id`, `assetTag`, `serial`, `assignedToEmployeeId`
- `markedCollectedByManagerId`, `markedCollectedAt`, `notes`
- `status` — e.g. `COLLECTED_PENDING_IT`, `CLOSED_OUT`
- `closedOutByItEmployeeId`, `closedOutAt` (nullable)
- Optional link to `EquipmentAssignment` via `equipmentAssignmentId`

This matches the pilot-level data model described in your outline (Section 5).

---

## 5. Integrations — Reference

All integration points are configured via **environment variables** (see `.env.example`). No secrets or URLs are hardcoded.

### 5.1 Database

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pilot: `file:./dev.db` (SQLite). Production: e.g. `postgresql://user:pass@host:5432/dbname`. |

The app owns this database; no external database API is called. Used for users, optional equipment cache, and collection events.

**First-time setup:** Run `npx prisma db push` (and optionally `npm run db:seed` for pilot data).

---

### 5.2 Reftab API (equipment source)

Official documentation: [Reftab API](https://www.reftab.com/api-docs). Auth and signing follow Reftab’s documented HMAC model ([Postman guide](https://www.reftab.com/faq/postman-reftab-api); reference implementation [ReftabNode](https://github.com/Reftab/ReftabNode)).

| Variable | Description |
|----------|-------------|
| `REF_TAB_API_URL` | API base. Reftab Cloud default: `https://www.reftab.com/api`. |
| `REF_TAB_API_PUBLIC_KEY` | Public key from **Settings → API Keys** in Reftab. |
| `REF_TAB_API_SECRET_KEY` | Secret key for the same pair. |
| `REF_TAB_ASSETS_LIMIT` | Optional. Assets to fetch per `GET /assets` (default `500`). |
| `REF_TAB_ASSIGNEE_FIELD` | Optional. Dot-path on each asset that must match `User.employeeId` (default `loanee`). Tenant-specific — confirm with your `GET /assets` JSON. |
| `REF_TAB_ASSET_TAG_FIELD` | Optional. Default `id` (Reftab asset id / tag). |
| `REF_TAB_SERIAL_FIELD` | Optional. Default `serial`. |
| `REF_TAB_MODEL_FIELD` | Optional. Default `title`. |
| `REF_TAB_API_KEY` | **Legacy only:** Bearer token for a custom `/assignments?employee_id=` proxy (not used when public + secret are set). |

**How the portal integrates:** One signed **`GET {REF_TAB_API_URL}/assets?limit=…`** per equipment load, then in-memory filter by assignee to the manager’s report `employeeId` list. Results are merged with DB-cached equipment. Match the assignee field to your directory sync (same value as `User.employeeId`), or use a dot-path such as `loanee.email` if your users are keyed by email.

If public/secret keys are not set, the app uses only DB-cached equipment (e.g. seed data).

---

### 5.3 Active Directory / Entra (manager hierarchy)

The application **does not call AD/Entra at runtime**. It expects the **User** table to be populated from your directory (scheduled job or script). Required fields to sync:

- **Stable identifier** — `employeeId` (or UPN / samAccountName), used to match users and equipment.
- **Display and contact** — `displayName`, `email`.
- **Manager** — `managerId` as FK to another User (resolve manager’s `employeeId` to User `id` when syncing).
- **Optional** — `is_manager`, `last_synced_at`.

Pilot: the seed script creates sample users and manager links. For production, provide an AD/Entra field schema (or CSV/JSON headers) and implement a sync that writes/updates the User table.

---

### 5.4 IT notifications (on “mark collected”)

Exactly **one** channel is active, selected by `NOTIFICATION_PROVIDER`.

| Provider | Value | Required environment variables |
|----------|--------|---------------------------------|
| Webhook | `webhook` | `WEBHOOK_URL` — URL to POST JSON (e.g. n8n, Zapier). |
| Teams | `teams` | `TEAMS_WEBHOOK_URL` — Microsoft Teams incoming webhook URL. |
| Email | `email` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_EMAIL_TO`. |

Optional: `APP_BASE_URL` — base URL of the portal (used for links in notifications).

**Webhook payload (representative):**  
`event`, `assetTag`, `serial`, `employeeId`, `employeeName`, `markedByManagerId`, `markedByManagerName`, `notes`, `markedAt`, `eventId`, `message`, `link` (to collection page).

**Teams:** Same information sent as a MessageCard with title, text, and “View portal” link.

**Email:** Plain-text message to `NOTIFICATION_EMAIL_TO` with asset, employee, who marked it, when, notes, and link.

---

### 5.5 Authentication (pilot vs production)

**Pilot (current):**

| Variable | Description |
|----------|-------------|
| `MANAGER_EMPLOYEE_IDS` | Comma-separated employee IDs allowed to act as managers. |
| `CURRENT_USER_EMPLOYEE_ID` | If set, this user is treated as the current user (impersonation for testing). If unset, the first value in `MANAGER_EMPLOYEE_IDS` is used. |

Only users in `MANAGER_EMPLOYEE_IDS` can use manager features. No SSO in pilot.

**Production:** Replace this with your organization’s SSO (e.g. Entra/OIDC). After login, resolve the current user from the token (e.g. `oid` or email) and map to `User.employeeId`; keep using the same API and DB scope logic.

---

## 6. Environment variables — Quick reference

Copy `.env.example` to `.env` and fill in values. Summary:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite (pilot) or PostgreSQL (production). |
| `MANAGER_EMPLOYEE_IDS` | Comma-separated manager employee IDs (pilot). |
| `CURRENT_USER_EMPLOYEE_ID` | Optional override for “current user” (pilot). |
| `REF_TAB_API_URL`, `REF_TAB_API_PUBLIC_KEY`, `REF_TAB_API_SECRET_KEY`, optional field/limit vars | Reftab API (optional for pilot). |
| `NOTIFICATION_PROVIDER` | `email` \| `teams` \| `webhook`. |
| `WEBHOOK_URL` | For webhook provider. |
| `TEAMS_WEBHOOK_URL` | For Teams provider. |
| `SMTP_*`, `NOTIFICATION_EMAIL_TO` | For email provider. |
| `APP_BASE_URL` | Optional; base URL for notification links. |

---

## 7. Deployment (Coolify / Nixpacks)

- **Build:** `npm ci`, `npx prisma generate`, `npm run build` (Nixpacks or Docker).
- **Start:** `npm run start` (or `node server.js` for Docker standalone).
- **Env:** Set all variables from `.env.example` in your deployment platform. For production, use a Postgres `DATABASE_URL` and run schema apply (`prisma db push` or `prisma migrate deploy`) as part of deploy or a one-off job.
- **SQLite (pilot):** Ensure the process has write access to the path in `DATABASE_URL` (e.g. `file:./dev.db`).

The repository includes a `Dockerfile` and `nixpacks.toml` for GitHub → Coolify/Nixpacks-style deployment.

---

## 8. Repo layout (high level)

- **`src/app/`** — Next.js App Router: pages (dashboard, staff detail, collection, login, view choice) and API routes under `src/app/api/`.
- **`src/components/`** — Dashboard views (table, cards, assets), sidebar, top bar, etc.
- **`src/lib/`** — Auth, auth-session, DB client, ref tab client, notification logic.
- **`prisma/`** — Schema (`schema.prisma`) and seed script (`seed.ts`).
- **`DELIVERABLE_Software_Description_and_Integrations.md`** — This document.
- **`README.md`** — Quick start and developer commands.
- **`API_CONNECTIONS.md`** — Short reference for API/env wiring.
- **`.env.example`** — Template for all environment variables.

---

## 9. Suggested next steps (from your outline and this deliverable)

1. **Reftab** — Generate API keys in Reftab, set `REF_TAB_API_PUBLIC_KEY` / `REF_TAB_API_SECRET_KEY` (and URL if not Reftab Cloud). Inspect `GET /assets` in [api-docs](https://www.reftab.com/api-docs) or Postman and tune `REF_TAB_ASSIGNEE_FIELD` (and related field paths) so assignees align with `User.employeeId`.
2. **AD/Entra sync** — Provide or agree on AD/Entra field schema (or CSV/JSON headers) and implement a sync job that updates the User table (and optionally `lastSyncedAt`).
3. **Notification channel** — Choose pilot channel (Email vs Teams vs webhook) and set the corresponding env vars.
4. **Production auth** — Replace pilot env-based “current user” with SSO; map token to `User.employeeId` and keep existing API and scope logic.
5. **Close-out role (optional)** — Outline requested “IT role” for close-out; pilot allows any authenticated user to close out. For production, consider restricting close-out to an IT role or allowlist (e.g. via token claims or an `IT_EMPLOYEE_IDS` env var) and enforce in `POST /api/closeout`.

---

This document and the referenced files (`.env.example`, `README.md`, `API_CONNECTIONS.md`, `prisma/schema.prisma`) together describe the delivered software and all integrations in response to your project outline.
