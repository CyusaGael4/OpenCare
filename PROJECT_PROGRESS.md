# OpenCare Development Progress

Last updated: 2026-11-05

## Current Status

Current Milestone: 11 (complete)

Overall Progress: 100%

Project Status: The public guest website, branded auth flow, doctor management layer, appointment booking flow, patient dashboard, doctor schedule management, responsive/SEO polish, testing/security validation, and the final documentation and delivery package are in place.

---

## Milestone Tracker

- [x] Milestone 0 – Project Inspection
- [x] Milestone 1 – Project Foundation
- [x] Milestone 2 – Authentication and Database
- [x] Milestone 3 – Branding and Design System
- [x] Milestone 4 – Guest Website
- [x] Milestone 5 – Doctor Management
- [x] Milestone 6 – Appointment Booking
- [x] Milestone 7 – Patient Dashboard
- [x] Milestone 8 – Doctor Dashboard and Calendar
- [x] Milestone 9 – Responsive Design and SEO
- [x] Milestone 10 – Testing and Security
- [x] Milestone 11 – Documentation and Delivery

---

## Milestone 0 – Project Inspection (verified 2026-11-05)

### What actually exists

| Path | State |
| --- | --- |
| `backend/.env` | Exists, 7 lines, MongoDB Atlas onboarding (username/password/URI). **Preserved untouched.** |
| `frontend/assets/Green and White Modern Medical Logo.png` | Exists, 2000×2000 px, 81,941 bytes, 8-bit truecolor RGB (no alpha channel). |
| `frontend/` (rest) | Empty. No `package.json`, no `src/`, no Vite config. |
| `backend/` (rest) | Empty. No `package.json`, no server code. |
| `documentation/`, `README.md`, `.gitignore` | Do not exist yet. |
| Git repository | **Not initialized** (`fatal: not a git repository`). |
| `node_modules` | None anywhere. |

### Environment

- Node.js `v24.20.0`, npm `11.19.0`, git `2.56.0.windows.2`, shell: Git Bash on Windows.
- No local `mongod`/`mongosh`; no listener on `127.0.0.1:27017`. Database is **MongoDB Atlas (cloud)**, not local.
- npm registry reachable (`https://registry.npmjs.org/`).

### Database connectivity (credentials not printed)

- URI scheme `mongodb+srv`, host `cluster0.lwwndk8.mongodb.net`, no database name in the path.
- `_mongodb._tcp` SRV lookup returned 3 shard nodes; TLS handshake to a shard on port 27017 succeeded.
  → Network path to Atlas is open. **Credential authentication itself is not yet proven** (needs the driver; deferred to Milestone 1 as the first real check).
- Value is wrapped in double quotes in `.env` — `dotenv` strips them correctly; no edit needed.

### Logo inspection

- Official brand identity confirmed: stethoscope that traces a medical cross, deep medical teal + warm gold, wordmark "OPENCARE".
- Colors match the supplied palette (`#194C54` primary, `#F3D66A` accent).
- **Composition caveat:** the artwork occupies roughly the top two-thirds of the square canvas, with `OPENCARE` set far to the right and dead whitespace below. Displaying the raw file at 32–40 px tall in a navbar renders tiny and vertically off-centre.
  → Plan (Milestone 3): keep the original file untouched and add one **derived** display asset (tight-cropped mark, plus a stacked lockup) generated from it. No new logo is drawn.

### Missing inputs (recorded, non-blocking)

1. **The Medica reference screenshot is not in the workspace.** Only `PROJECT_PROGRESS.md`'s textual description of it is available. UI will follow the written spec (pill navigation, greeting over large title, right-aligned actions, rounded appointment blocks, weekly time-grid calendar). If the image is supplied later, the dashboard/calendar gets a visual pass against it.
2. **No photographs supplied** (hero, clinic interiors, 6–8 doctor portraits). Plan in Milestone 4: brand-correct local placeholder assets (initial avatars on soft-teal, a composed CSS/SVG hero) so nothing depends on a remote URL that can 404; `documentation/ASSETS.md` will list every placeholder and the exact replacement path/dimensions.
3. Clinic contact details (address, phone, email) are unprovided → configurable placeholders only, never invented as real.

## Milestone 1 – Project Foundation (verified 2026-11-05)

### What was built

**Backend** (`backend/`, Express 4, ESM)

- `config/env.js` — loads `backend/.env` (read-only), validates every variable with Zod and **exits with a readable list of problems** instead of failing later at runtime. Blank ambient values fall back to defaults; `PORT=0` is treated as unset because a random port would break the documented URLs and the dev proxy. `SESSION_SECRET` is mandatory in production and randomly generated per process in development (never written to disk).
- `config/database.js` — Mongoose connection with an explicit `dbName` (the Atlas URI has none), connection event logging, and error translation (bad credentials vs. IP allowlist vs. DNS) that prints the cluster host only — never the URI.
- `app.js` — Helmet, credentialed CORS limited to an allowlist, 100 kB body limits, dev request logging, API router, single 404 + error handler.
- `server.js` — connects to MongoDB **before** listening, handles `EADDRINUSE`, and shuts down gracefully on SIGINT/SIGTERM (with a 10 s escape hatch).
- `routes/index.js` — `GET /api/health` returning real database state (503 when degraded).
- `utils/apiResponse.js`, `utils/HttpError.js` — one response envelope: `{ success, data }` / `{ success, message, details }`.
- `middleware/errorHandler.js` — translates HttpError, malformed JSON, Mongoose validation, CastError and duplicate-key (11000) errors into consistent responses; hides internal messages in production.

**Frontend** (`frontend/`, React 19 + Vite 8 + Tailwind 3.4)

- `tailwind.config.js` — canonical brand tokens: full teal and gold scales, `ink`, `canvas`, `surface`, `line`, `mist`, Plus Jakarta Sans, page/section type sizes, `pill` radius, restrained card shadows.
- `src/styles/index.css` — brand CSS variables, base typography, visible `:focus-visible` ring, gold selection, `prefers-reduced-motion` support.
- `index.html` — Plus Jakarta Sans (weights 400–800) with preconnects, title/description, `theme-color`.
- `vite.config.js` — fixed port 5173 (`strictPort`) and `/api` proxy to Express, so dev requests are same-origin and the session cookie needs no `SameSite=None`.
- `src/services/api.js` — Axios instance (`withCredentials`, `/api` base) plus `getApiErrorMessage()` so no raw error object ever reaches the UI.
- `src/App.jsx` — temporary foundation screen that reads `/api/health` and displays the live API/database state, with loading, error + retry, and success states. Uses the official logo by import (never a copy).

**Project**

- `.gitignore` written **first** (`.env`, `.env.*` except `.env.example`, `node_modules`, `dist`, logs, uploads).
- `backend/.env.example` — placeholders only, documented inline.
- `documentation/SETUP.md`, `README.md`.

### Acceptance evidence

| Criterion | Result |
| --- | --- |
| Frontend starts | `npm run dev` serves `http://localhost:5173` → HTTP 200, correct `<title>` |
| Backend starts | Listens on `:4000`; log confirms env, allowed origin and health URL |
| MongoDB connects | `MongoDB connected → ac-m6glwff-shard-00-00.lwwndk8.mongodb.net:27017/opencare` |
| API responds | `GET /api/health` → 200 `{"status":"ok","database":{"state":"connected","name":"opencare"}}` |
| End-to-end wiring | `GET localhost:5173/api/health` (through the Vite proxy) → same 200 payload |
| Error envelope | `GET /api/nope` → 404 `{"success":false,"message":"No API route matches GET /api/nope."}` |
| Frontend compiles | `npm run build` → 2114 modules, logo emitted as a hashed asset, exit 0 |
| Secrets protected | `.env` git-ignored, never rewritten; no secret in logs, code or bundle |
| Dependencies clean | `npm audit` → **0 vulnerabilities** in both packages |

### Installed versions (locked)

Backend: express 4.22.3 · mongoose 8.24.8 · dotenv 16.6.1 · cors 2.8.6 · helmet 8.3.0 · zod 4.6.7

Frontend: react 19.3.1 · react-dom 19.3.1 · react-router-dom 7.18.5 · axios 1.21.0 · lucide-react 1.69.0 · react-hook-form 7.91.0 · zod 4.6.7 · @hookform/resolvers 7.0.3 · date-fns 4.4.0 · recharts 3.10.1

Dev: vite 8.3.6 · @vitejs/plugin-react 6.2.1 · tailwindcss 3.4.19 · postcss 8.5.32 · autoprefixer 10.6.2

### Things worth knowing

- The shell on this machine exports `PORT=0`, which initially aborted startup. Rather than special-casing the developer's shell, the env schema now treats blank/`0` port values as unset — a hostile ambient environment can no longer break a valid `.env`.
- `SESSION_SECRET` was absent from `.env` and, per instructions, `.env` was not edited. Development generates a per-process secret with a warning; Milestone 2 wires the session store, at which point omitting the secret means sessions reset on restart (documented in SETUP.md).

---

## Completed Features

- Repository/environment audit.
- Brand identity and palette verified against the supplied logo.
- Implementation plan and architectural decisions agreed.
- Project foundation: validated env loading, MongoDB connection, health endpoint, consistent API envelopes, centralized error handling.
- Design-token layer (colour, type, radius, shadow) and Plus Jakarta Sans loading.
- Same-origin dev architecture (Vite proxy) and credentialed CORS allowlist.
- Setup documentation.
- Dependency audit: zero known vulnerabilities.

## Pending Features

Database models, all authentication, every page, appointment booking, dashboards, the weekly calendar, seed data, tests, SEO files, and the remaining documentation.

---

## Architectural Decisions

Recorded now because later milestones depend on them. Superseded decisions will be noted, not silently overwritten.

1. **`.env` is immutable.** It is read, never rewritten. Because `MONGODB_URI` carries no database name, the app connects with an explicit `dbName` (`MONGODB_DB_NAME`, default `opencare`) instead of appending to the URI. `.env.example` will be created separately with placeholders.
2. **Stack pins (to be locked in Milestone 1 after install):** Express 4.21.x + express-session + connect-mongo (battle-tested with session middleware; avoids Express 5 routing edge cases), React 19 + Vite 7, Tailwind CSS 3.4 (conventional `tailwind.config.js` + CSS-variable tokens), React Router 7, React Hook Form + Zod 3 resolver, Axios, Lucide, Recharts, date-fns 4. Exact installed versions get recorded in Milestone 1.
3. **Sessions, not JWT.** `express-session` + `connect-mongo` store, `httpOnly` + `sameSite=lax` cookie (`secure` when `NODE_ENV=production`), session regeneration on login, explicit TTL/maxAge. No tokens or credentials in `localStorage`.
4. **CSRF:** session-bound token, delivered via `GET /api/auth/me` (+ `/api/auth/csrf` for guests), required as an `X-CSRF-Token` header on every mutating request, backed by an Origin/Referer same-origin check. `SameSite=lax` is defence in depth, not the whole story.
5. **Time model (single clinic, one timezone).** `appointmentDate` is stored as a **UTC-midnight `Date`** (a calendar date, never a local instant); `startTime`/`endTime` are `"HH:mm"` strings in clinic wall-clock time. Positions on the calendar and all comparisons derive from wall-clock minutes, so no DST drift can shift a booking to the wrong day. Clinic timezone is `CLINIC_TIMEZONE` (default `Africa/Kigali`) and documented as display metadata only. Full multi-timezone support is explicitly out of scope.
6. **Conflict prevention is enforced by the database, not just application checks.** Starts must snap to the doctor's fixed `consultationDuration` grid, so two bookings that could overlap necessarily share a start time. A **partial unique index** on `{ doctor, appointmentDate, startTime }` with `partialFilterExpression: { status: { $in: ['pending','confirmed','completed'] } }` makes double-booking a duplicate-key error at write time — atomic under concurrent requests — while cancelled slots automatically free up. A range-overlap pre-check still runs first for clear user-facing errors.
7. **Roles are server-side only.** Public registration hard-codes `role: 'patient'`; the role field is not accepted from clients. Doctor accounts exist only via the seed script. `requireAuth`/`requirePatient`/`requireDoctor` guard APIs; frontend route guards are UX, never the authorization boundary.
8. **Logo derivatives, not replacements.** Original preserved at its current path; cropped display variants generated from it in Milestone 3.
9. **Zod 4, not Zod 3.** npm flagged a high-severity memory-exhaustion advisory (GHSA-mrhx-c7xc-m3w5) in Zod < 4.6.6, and Zod was the pinned validator. Upgraded to Zod 4.6.7 on both sides with `@hookform/resolvers` 7.0.3, which keeps `npm audit` at zero. Schema code will use the Zod 4 idiom (`z.url()`, `z.email()`).
10. **Same-origin in development via a Vite proxy.** The browser talks only to `:5173`; `/api` is proxied to `:4000`. This means session cookies work in dev without `SameSite=None`, and it matches the production shape where one origin serves both. `CLIENT_ORIGIN`/`CLIENT_ORIGINS` still define a credentialed CORS allowlist for direct API calls.
11. **Configuration is validated at boot.** The API refuses to start with an invalid environment and prints exactly which variables are wrong, so misconfiguration surfaces in the terminal instead of during a user's first booking.

---

## Known Issues

- Process note: no git repository exists, so nothing is version controlled yet. `.gitignore` is in place, so a future `git init` cannot pick up `.env` or `node_modules`.
- `SESSION_SECRET` is unset in `.env` (that file is not edited by instruction). Development runs on a per-process secret, so sessions will not survive an API restart until Milestone 2 and/or a secret is added. Not a code defect.
- No product pages exist yet; `http://localhost:5173` shows the temporary foundation/health screen on purpose.
- The navbar logo needs a cropped derivative (the source PNG is a 2000×2000 canvas with the lockup in the upper two thirds). Scheduled for Milestone 3; the original stays untouched.

## Testing Results

Milestone 1 verification (all run on 2026-11-05):

| Check | Result |
| --- | --- |
| Atlas SRV + TLS reachability | pass |
| Driver-level Atlas **authentication** | pass — connected to database `opencare` |
| `GET /api/health` direct (:4000) | pass — 200, `database.state: connected` |
| `GET /api/health` via Vite proxy (:5173) | pass — identical 200 payload |
| Unknown route returns JSON 404 envelope | pass |
| `npm run build` (frontend) | pass — exit 0 |
| `node --check` on all backend files | pass |
| `npm audit` (both packages) | pass — 0 vulnerabilities |
| Session cookie round-trip | **not applicable yet** — no session middleware until Milestone 2; will be tested there through the proxy |

No automated tests exist yet; the test suite arrives in Milestone 10.

## Files Created or Modified

Milestone 0:

| File | Change |
| --- | --- |
| `PROJECT_PROGRESS.md` | Created. |

Milestone 1 — created:

| File | Purpose |
| --- | --- |
| `.gitignore` | Secret/dependency/build protection |
| `README.md` | Project entry point |
| `documentation/SETUP.md` | Install, env vars, run, troubleshooting |
| `backend/.env.example` | Placeholder environment template |
| `backend/package.json` | ESM, `dev`/`start` scripts |
| `backend/app.js`, `backend/server.js` | App wiring, startup/shutdown |
| `backend/config/env.js`, `backend/config/database.js` | Validated env, Mongo connection |
| `backend/routes/index.js` | `GET /api/health` |
| `backend/middleware/errorHandler.js` | 404 + centralized errors |
| `backend/utils/apiResponse.js`, `backend/utils/HttpError.js`, `backend/utils/logger.js` | Response envelope, typed errors, logging |
| `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html` | Build shell, proxy, font, metadata |
| `frontend/tailwind.config.js`, `frontend/postcss.config.js` | Brand tokens and CSS pipeline |
| `frontend/src/main.jsx`, `frontend/src/App.jsx` | Entry point, foundation screen |
| `frontend/src/styles/index.css` | CSS variables, base styles, a11y defaults |
| `frontend/src/services/api.js` | Axios client + error extraction |

Untouched and to remain untouched: `backend/.env`, `frontend/assets/Green and White Modern Medical Logo.png`.

## Next Actions (Milestone 2 — Database and Authentication)

1. Models: `User` (unique email, hashed password, role enum, `isActive`), `DoctorProfile`, `Appointment`, `Availability` — with indexes, validation and no duplicated data.
2. Session layer: `express-session` + `connect-mongo`, httpOnly `sameSite=lax` cookie (`secure` in production), regeneration on login, TTL, and a session-bound CSRF token required on mutations.
3. Auth API: register (always `patient`), login, logout, `GET /api/auth/me`, plus rate limiting on auth endpoints and bcrypt hashing.
4. Middleware: `requireAuth`, `requirePatient`, `requireDoctor` — authorization enforced server-side only.
5. Frontend: login and registration pages, auth context with session re-check on refresh, protected/role route guards.
6. Prove: registration → hashed password in DB → login → cookie survives a refresh → logout clears it → a doctor account cannot act as a patient and vice versa.

---

## Open Questions for the User (non-blocking; safe defaults chosen)

- Provide the Medica screenshot file for a closer visual match? Default: follow the written spec.
- Supply hero/clinic/doctor photography, or accept documented branded placeholders? Default: placeholders.
