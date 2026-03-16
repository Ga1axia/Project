# Manager Equipment Collection Portal

Lightweight manager-facing web UI to view equipment assigned to direct/indirect reports, mark items as collected, and track collection events with IT notifications and close-out.

## Quick start

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL (default file:./dev.db for SQLite)
npm install
npx prisma db push
npm run db:seed
npm run dev
```

If `npm install` fails with ENOTEMPTY, remove `node_modules` and run `npm install` again.

Open http://localhost:3000. Pilot auth uses `CURRENT_USER_EMPLOYEE_ID` (or first entry in `MANAGER_EMPLOYEE_IDS`). Seed creates manager `EMP001` (Alice) with reports EMP003–EMP005 and sample equipment.

---

## API connections required

### 1) **Database**

- **What:** SQLite (pilot) or PostgreSQL (production).
- **Env:** `DATABASE_URL`
  - SQLite: `file:./dev.db`
  - Postgres: `postgresql://user:pass@host:5432/dbname`
- **Usage:** Users (AD/Entra sync), equipment cache, collection events. No external API; app owns the DB.

---

### 2) **Ref Tab API (equipment source)**

- **What:** External API that returns equipment assignments (asset tag, serial, model, assigned user).
- **Env:**  
  - `REF_TAB_API_URL` – base URL (e.g. `https://ref-tab.example.com/api`)  
  - `REF_TAB_API_KEY` – Bearer token or API key for auth
- **Expected contract (to implement or confirm with ref tab):**
  - **Endpoint:** `GET {REF_TAB_API_URL}/assignments?employee_id={employeeId}`
  - **Response:** JSON array of assignments, e.g.  
    `[{ "asset_tag": "...", "serial": "...", "model": "...", "assigned_to_employee_id": "EMP001", "status": "..." }]`
- **Usage:** Fetched when loading equipment in the manager UI; results are merged with DB-cached assignments. If ref tab is not configured, only DB cache is used (e.g. seed data).

---

### 3) **Active Directory / Entra (manager hierarchy)**

- **What:** Source of users and manager chain (who reports to whom).
- **How (today):** No live AD/Entra API is called by the app. Users and manager links are stored in the app DB and must be **synced from AD/Entra** (e.g. scheduled job or script that writes to the `User` table).
- **Required fields to sync:**  
  `employee_id` (or UPN/samAccountName as stable id), `display_name`, `email`, `manager` (reference to another user’s `employee_id`). Set `is_manager` if they have direct reports.
- **Pilot:** Seed script fills sample users; for production you need a sync process that updates `User` (and optionally `last_synced_at`) from your directory.

---

### 4) **IT notifications (when an item is marked collected)**

Exactly one channel is used, driven by `NOTIFICATION_PROVIDER` and the corresponding env vars.

| Provider   | Env vars | Purpose |
|-----------|----------|--------|
| **webhook** | `WEBHOOK_URL` | POST JSON to URL (e.g. n8n, Zapier). Default if set. |
| **teams**   | `TEAMS_WEBHOOK_URL` | Microsoft Teams incoming webhook. |
| **email**   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_EMAIL_TO` | SMTP (e.g. O365) to notify IT. |

- **Payload (webhook):**  
  `event`, `assetTag`, `serial`, `employeeId`, `employeeName`, `markedByManagerId`, `markedByManagerName`, `notes`, `markedAt`, `eventId`, `message`, `link` (portal collection page).
- **Usage:** Called automatically when a manager marks an item as collected.

---

### 5) **Authentication (pilot vs production)**

- **Pilot:** No SSO. Current user is determined by:
  - `CURRENT_USER_EMPLOYEE_ID` if set, else
  - First value in `MANAGER_EMPLOYEE_IDS`.
  Only users in `MANAGER_EMPLOYEE_IDS` are treated as managers. No external auth API.
- **Production:** Replace this with your org SSO (e.g. Entra/OIDC). After login, set the app’s “current user” from the token (e.g. `oid` or `email` mapped to `User.employeeId` / UPN). No new “API” beyond your existing IdP.

---

## Summary table

| Connection        | Type        | Required for pilot? | Env / config |
|------------------|-------------|----------------------|--------------|
| Database         | Internal DB | Yes                  | `DATABASE_URL` |
| Ref Tab          | HTTP API    | No (use seed data)   | `REF_TAB_API_URL`, `REF_TAB_API_KEY` |
| AD/Entra         | Sync → DB   | No (use seed)        | Your sync job + `User` table |
| IT notification  | Webhook/Teams/Email | Yes (to alert IT) | `NOTIFICATION_PROVIDER` + `WEBHOOK_URL` or `TEAMS_WEBHOOK_URL` or SMTP vars |
| Auth             | Env / later SSO | Yes (env)        | `CURRENT_USER_EMPLOYEE_ID`, `MANAGER_EMPLOYEE_IDS` |

---

## Deployment (Coolify / Nixpacks)

- **Build:** Nixpacks (or Docker) uses `npm ci`, `prisma generate`, `npm run build`.
- **Start:** `npm run start` (or `node server.js` in Docker standalone).
- **Env:** Set all variables from `.env.example` in Coolify (or your platform). For production, set `DATABASE_URL` to a Postgres URL and run migrations (`prisma migrate deploy` or `prisma db push`) in the deploy pipeline or a one-off job.
- **SQLite:** For pilot, `DATABASE_URL=file:./dev.db` works; ensure the app has write access to the path. For production, prefer Postgres.

---

## Scripts

- `npm run dev` – dev server
- `npm run build` – Prisma generate + Next build
- `npm run db:push` – push schema (no migrations)
- `npm run db:seed` – seed users + equipment
- `npm run db:studio` – Prisma Studio
