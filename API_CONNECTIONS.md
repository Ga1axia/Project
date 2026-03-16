# API Connections Required

After deployment, wire these via **environment variables** (see `.env.example`).

---

## 1. Database

| Env | Description |
|-----|-------------|
| `DATABASE_URL` | SQLite: `file:./dev.db` (pilot). Production: `postgresql://user:pass@host:5432/dbname`. |

No external API. App uses this DB for users, equipment cache, and collection logs.

---

## 2. Ref Tab API (equipment assignments)

| Env | Description |
|-----|-------------|
| `REF_TAB_API_URL` | Base URL, e.g. `https://ref-tab.example.com/api`. |
| `REF_TAB_API_KEY` | Bearer token or API key. |

**Expected API:**

- **GET** `{REF_TAB_API_URL}/assignments?employee_id={employeeId}`
- **Headers:** `Authorization: Bearer {REF_TAB_API_KEY}`
- **Response:** JSON array of objects with at least:
  - `asset_tag` (string)
  - `serial` (string, optional)
  - `model` (string, optional)
  - `assigned_to_employee_id` (string)

If not set, the app uses only DB-cached equipment (e.g. seed data).

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

Production: replace with SSO (e.g. Entra/OIDC); resolve current user from token and map to `User.employeeId`.
