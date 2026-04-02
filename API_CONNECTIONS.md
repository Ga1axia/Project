# API Connections Required

After deployment, wire these via **environment variables** (see `.env.example`).

---

## 1. Database

| Env | Description |
|-----|-------------|
| `DATABASE_URL` | SQLite: `file:./dev.db` (pilot). Production: `postgresql://user:pass@host:5432/dbname`. |

No external API. App uses this DB for users, equipment cache, and collection logs.

---

## 2. Reftab API (equipment source)

Official docs: [Reftab API documentation](https://www.reftab.com/api-docs).  
Authentication and signing: [How to use Postman with Reftab’s API](https://www.reftab.com/faq/postman-reftab-api) (same HMAC scheme this app uses).  
Example Node client from Reftab: [ReftabNode on GitHub](https://github.com/Reftab/ReftabNode).

### How this app integrates

Reftab does **not** use a simple Bearer token on `/assignments`. It uses **public + secret API keys** and **HMAC-SHA256** signing on each request (`Authorization: RT {publicKey}:{signature}`, plus `x-rt-date`). The portal:

1. Calls **`GET {REF_TAB_API_URL}/assets?limit={N}`** once per equipment load (for the manager’s report scope).
2. Parses the JSON array of assets and keeps rows where the assignee field matches a report’s `User.employeeId` (case-insensitive for strings).
3. Maps each row to your internal equipment shape (`asset_tag`, `serial`, `model`, `assigned_to_employee_id`).

If **both** `REF_TAB_API_PUBLIC_KEY` and `REF_TAB_API_SECRET_KEY` are set, this native Reftab flow runs. If **only** `REF_TAB_API_KEY` is set (legacy), the app instead calls a **custom proxy** shape: `GET …/assignments?employee_id=` with `Authorization: Bearer …` (not the live Reftab cloud API).

### Environment variables

| Env | Description |
|-----|-------------|
| `REF_TAB_API_URL` | API base URL. Reftab Cloud default: `https://www.reftab.com/api` (no trailing slash required). |
| `REF_TAB_API_PUBLIC_KEY` | Public key from Reftab **Settings → API Keys → Create API Key**. |
| `REF_TAB_API_SECRET_KEY` | Secret key for the same key pair. |
| `REF_TAB_ASSETS_LIMIT` | Optional. Default `500`. Max assets returned per request (`?limit=`). Raise if you have more assets; if you exceed Reftab’s max per call, add pagination later (see Reftab docs). |
| `REF_TAB_ASSIGNEE_FIELD` | Optional. Default `loanee`. Dot-path to the field on each asset that should match **this app’s `User.employeeId`** (e.g. `loanee`, `loanee.email`). Tenant-specific — confirm from a sample `GET /assets` response in [api-docs](https://www.reftab.com/api-docs) or Postman. |
| `REF_TAB_ASSET_TAG_FIELD` | Optional. Default `id` (Reftab’s asset id, e.g. tag). |
| `REF_TAB_SERIAL_FIELD` | Optional. Default `serial`. |
| `REF_TAB_MODEL_FIELD` | Optional. Default `title`. |
| `REF_TAB_API_KEY` | **Legacy only.** Bearer auth for a **custom** gateway; not used when public/secret keys are set. |

### Identity alignment

The value read from `REF_TAB_ASSIGNEE_FIELD` (e.g. email, employee number, or object resolved to `email` / `id`) must match how you populate **`User.employeeId`** in the portal (from AD/Entra sync). If Reftab stores email and your directory uses employee numbers, either sync the same canonical id into both systems or point `REF_TAB_ASSIGNEE_FIELD` at a field that matches your `User.employeeId`.

If Reftab env vars are not set (or keys missing), the app uses only **DB-cached** equipment (e.g. seed data).

---

## 3. Active Directory / Entra (manager hierarchy)

Not a runtime API. Populate the **User** table from AD/Entra (scheduled job or script). Required fields:

- `employeeId` (or UPN / samAccountName as stable id)
- `displayName`, `email`
- `managerId` (FK to another User’s `id`, from manager’s `employeeId`)

Pilot can use seed data only.

---

## 4. IT notifications (on “mark collected”)

Set **one** of the following.

| Provider | Env vars |
|----------|----------|
| **webhook** | `NOTIFICATION_PROVIDER=webhook`, `WEBHOOK_URL=https://...` |
| **Teams** | `NOTIFICATION_PROVIDER=teams`, `TEAMS_WEBHOOK_URL=https://...` |
| **email** | `NOTIFICATION_PROVIDER=email`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_EMAIL_TO` |

Optional: `APP_BASE_URL` for links in notifications.

---

## 5. Auth (pilot)

| Env | Description |
|-----|-------------|
| `MANAGER_EMPLOYEE_IDS` | Comma-separated employee IDs allowed to act as managers. |
| `CURRENT_USER_EMPLOYEE_ID` | Impersonate this user (pilot). Omit in production when using SSO. |

API routes use these env vars (plus `DATABASE_URL` / `User` rows) to authorize `/api/collect` and related calls. **Coolify / production:** set `MANAGER_EMPLOYEE_IDS` and optional `CURRENT_USER_EMPLOYEE_ID` to IDs that exist in the deployed database, or mark-collected requests will fail with 401/403/404. See [README.md](./README.md) (section *Coolify / production: env vars for pilot auth and “Mark collected”*).

Production: replace with SSO (e.g. Entra/OIDC); resolve current user from token and map to `User.employeeId`.
