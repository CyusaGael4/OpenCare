# OpenCare

A single-clinic healthcare appointment management system — a public guest website,
a patient experience for booking and managing appointments, and a doctor experience
built around a weekly schedule calendar.

**Stack:** React + Vite + Tailwind CSS · Node.js + Express · MongoDB (Mongoose) ·
session-based authentication.

> **Status:** milestone complete. See [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) for the
> final roadmap state, and [documentation/DELIVERY.md](documentation/DELIVERY.md) for the
> handoff checklist and delivery summary.

## Quick start

```bash
cp backend/.env.example backend/.env   # then fill in MONGODB_URI
cd backend  && npm install && npm run dev     # http://localhost:4000
cd frontend && npm install && npm run dev     # http://localhost:5173
```

Full instructions, environment variables and troubleshooting: [documentation/SETUP.md](documentation/SETUP.md).
