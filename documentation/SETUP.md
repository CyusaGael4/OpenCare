# OpenCare — Setup

How to install, configure and run OpenCare locally.

OpenCare is a single-clinic healthcare appointment management system: a public
guest website, a patient experience, and a doctor experience, backed by an
Express API and MongoDB.

---

## 1. Prerequisites

| Requirement | Version used | Notes |
| --- | --- | --- |
| Node.js | 24.20.0 (needs ≥ 20.19) | `node -v` |
| npm | 11.19.0 | ships with Node |
| MongoDB | Atlas cluster (cloud) | A local `mongod` also works via `MONGODB_URI` |

No global CLI tools are required.

---

## 2. Install

Dependencies are installed per package — there is no root package. Run:

```bash
cd backend  && npm install
cd ../frontend && npm install
```

---

## 3. Configure the environment

The backend reads configuration **only** from `backend/.env`. That file is
git-ignored and is never written by the application.

```bash
cp backend/.env.example backend/.env
```

Then fill in the values:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Full connection string (`mongodb+srv://…` for Atlas). |
| `MONGODB_DB_NAME` | no | Database name, default `opencare`. Used when the URI has none. |
| `SESSION_SECRET` | in production | ≥ 32 random characters. In development a random per-process value is generated (sessions then reset on restart). |
| `SESSION_MAX_AGE_MS` | no | Session lifetime, default 24 h. |
| `SESSION_COOKIE_SECURE` | no | Forces `Secure` cookies; defaults to `true` when `NODE_ENV=production`. |
| `PORT` | no | API port, default `4000`. `PORT=0` is treated as unset. |
| `CLIENT_ORIGIN` | no | Browser origin allowed credentialed requests, default `http://localhost:5173`. |
| `CLIENT_ORIGINS` | no | Extra comma-separated origins (e.g. a LAN IP for phone testing). |
| `CLINIC_TIMEZONE` | no | Clinic wall-clock label, default `Africa/Kigali`. |

Generate a production session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

---

## 4. Run

Two processes, two terminals:

```bash
# terminal 1 — API on http://localhost:4000
cd backend && npm run dev

# terminal 2 — web app on http://localhost:5173
cd frontend && npm run dev
```

`npm run dev` in the backend uses Node's built-in `--watch`, so the API restarts
on file changes without an extra dependency.

Open http://localhost:5173 — the foundation screen reports the live state of the
API and database connection.

### Verify quickly

```bash
curl http://localhost:4000/api/health
```

Healthy response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "opencare-api",
    "environment": "development",
    "database": { "state": "connected", "readyState": 1, "name": "opencare" },
    "clinicTimezone": "Africa/Kigali",
    "uptimeSeconds": 22,
    "timestamp": "2026-11-05T08:33:58.984Z"
  }
}
```

The endpoint returns **503** when the database is unavailable, so it can be used
as a readiness probe rather than a constant "OK".

---

## 5. How requests flow

```
browser :5173 ──▶ Vite dev server ──/api──▶ Express :4000 ──▶ MongoDB Atlas
```

In development the browser only ever talks to `http://localhost:5173`, and Vite
proxies `/api` to Express. Requests are therefore **same-origin**, so the session
cookie is sent without `SameSite=None` workarounds. `CLIENT_ORIGIN` exists for
direct API calls and future split-origin deployments, not for the dev proxy.

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `authentication failed` | Wrong database credentials | Check the Atlas *database user*, not your Atlas login. |
| `No cluster node accepted the connection` | Your IP is not allow-listed | Atlas → Network Access → add your current IP. |
| `cluster hostname could not be resolved` | DNS / VPN / offline | Check connectivity; verify the cluster still exists. |
| `Port 4000 is already in use` | Another process holds the port | Stop it, or set `PORT` in `backend/.env`. |
| `backend/.env is missing` | Fresh clone | `cp backend/.env.example backend/.env`. |
| Frontend shows "The API is not reachable" | API not running | Start `backend/npm run dev`. |
| Vite exits immediately | Port 5173 taken | Free the port; the config intentionally refuses to drift to 5174. |

---

## 7. Security notes

- `backend/.env` is git-ignored; only `.env.example` (placeholders) is committed.
- Session secrets never appear in code, logs, or the frontend bundle.
- Connection strings are never logged — the API logs only the cluster hostname.
- The API validates its environment at boot and refuses to start when it is
  invalid, rather than failing later at the first request.
- `x-powered-by` is disabled and Helmet security headers are applied.
