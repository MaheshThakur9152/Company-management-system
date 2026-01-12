# Company Management System — Ambe Service 

A full-stack application for managing company operations — employee management, attendance tracking, payroll & invoices, ledgers, site management, and supervisor mobile app integration.

---

## Table of contents
1. Project overview
2. Key features
3. Architecture & repo layout
4. Setup & environment
5. Development & running
6. Testing
7. Scripts & utilities
8. Data models & functionality
9. Deployment notes
10. Contributing & license

---

## 1) Project overview 🔧
This repository contains the Ambe Service facility management system with three main parts:

- `backend/` — Node.js/Express API and business logic (MongoDB models, email, file uploads, scripts).
- `frontend/` — React + Vite admin console (TypeScript, TailwindCSS) for admins and office users.
- `supervisor-android/` — Android supervisor app (native Gradle project) used for on-site check-ins.

The system records employee attendance (including site-based attendance), computes payroll, generates invoices and ledger entries, and provides admin controls via a web UI.

---

## 2) Key features ✅
- Employee CRUD and role management
- Attendance logging (check-in/out, site & device info)
- Payroll generation and `SalaryRecord` persistence
- Invoice creation & editing, PDF export
- Ledger & manual ledger entries for accounting
- File uploads via Cloudinary
- Email notifications via Brevo/SMTP
- JWT-based authentication and role enforcement
- Utility scripts for data migration, seeding and admin utilities

---

## 3) Architecture & repo layout 📁
Root contains workspace configs (`package.json`, `vite.config.ts`, `README.md`).

Backend (`/backend`):
- `src/app.js` — Express app bootstrap and middleware
- `src/api/index.js` — routes and API endpoints
- `src/middleware/` — `rateLimiter.js`, `upload.js`
- `src/models/` — Mongoose models (`User.js`, `Employee.js`, `Attendance.js`, `SalaryRecord.js`, `Invoice.js`, `LedgerEntry.js`, `ManualLedgerEntry.js`, `LocationLog.js`, `Site.js`, `JobRole.js`, etc.)
- `src/utils/` — `db.js`, `cloudinaryHelper.js`, and other helpers
- `src/scripts/` — maintenance scripts (seed, migrations, reset admin)
- `tests/` — Jest tests (e.g., `uploads.test.js`)

Frontend (`/frontend`):
- `src/` — `App.tsx`, `index.tsx`, `components/`, `pages/`, `services/mockData.ts`, `utils/`
- `public/` — static assets including `metadata.json`

Supervisor Android (`/supervisor-android`):
- Native Gradle project with app source under `app/src/main` for activities, layouts, resources.

---

## 4) Setup & environment ⚙️
**Important:** Never commit `.env` files with secrets. Use `.env.example` for the required keys and set real values in local or CI environment variables.

Backend environment variables (examples):
- `MONGODB_URI` — MongoDB connection string
- `PORT` — server port (default: 3002)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`
- `JWT_SECRET`
- `EMAIL_FROM`, `TEST_EMAIL_RECIPIENT`, `BREVO_API_KEY`

Frontend: set `VITE_API_URL` if the API is hosted on a non-default host.

Android: ensure `local.properties` has correct SDK paths before building.

---

## 5) Development & running ▶️
Backend:
```bash
cd backend
npm install
cp .env.example .env  # fill in credentials
npm run dev
```
Key backend scripts (check `backend/package.json`):
- `npm run dev` — development server (nodemon)
- `npm test` — runs Jest tests
- seed and migration scripts in `src/scripts/`

Frontend:
```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```
Build & preview:
- `npm run build`
- `npm run preview`

Android:
- Open `supervisor-android/` in Android Studio and run or use Gradle: `./gradlew assembleDebug`

---

## 6) Testing ✅
- Backend tests: `cd backend && npm test` (Jest)
- Frontend: run any unit/integration tests and use `services/mockData.ts` for UI checks
- Use `TEST_EMAIL_RECIPIENT` for email transport tests (local only)

---

## 7) Scripts & utilities 🔧
- `src/scripts/seedData.js` — seeds initial data
- `create_user_mahesh.js`, `reset_admin.js`, etc. — admin utilities

> Note: ad-hoc debug/inspection scripts have been archived to `src/scripts/archived-tests/` to keep the main scripts folder clean.

- `cloudinaryHelper.js` — Cloudinary upload helper
- `db.js` — MongoDB connection and retry logic


API endpoints of interest:
- `GET /api/invoices/export?siteId=<siteId|siteName>&month=<m>&year=<yyyy>` — build a single `.xlsx` workbook with one worksheet per invoice matching the filters and stream it to the client. Useful for "Download All" from the Attendance grid.
  - Limits: max 120 invoices per request to avoid memory/CPU spikes.
  - If month/year are omitted, returns all invoices for the site (subject to server limit).


---

## 8) Data models & functionality 📊
- Attendance — check-in/out with site/device info and location logs
- SalaryRecord — payroll entries per period
- LedgerEntry / ManualLedgerEntry — accounting entries
- Invoice — creation, editing and exports
- LocationLog — geo/audit logging
- Role-based `User` model for auth and permissions

---

## 9) Deployment notes 🚀
- Backend: deploy with secure environment variable storage (Heroku, Vercel serverless functions, Docker on cloud VM)
- Frontend: deploy to Vercel/Netlify or any static host; set `VITE_API_URL` for production
- Android: produce signed APK/AAB for Play Store per standard procedures

---

## 10) Cleanup & maintenance
A `CLEANUP_PROPOSAL.md` exists proposing removal of generated Android build artifacts and checked-in APKs. Recommended workflow:
1. Create a backup branch: `git checkout -b cleanup/backup-YYYYMMDD` ✅
2. Remove build artifacts and add appropriate `.gitignore` entries
3. Run local builds and CI to validate nothing breaks

---

## Contributing & contact 🤝
- Fork → branch → PR with tests for new features
- Open issues for bugs or feature requests
- Do not commit secrets or `.env` files

**I can also:**
- Add a `backend/.env.example` with required keys (no values)
- Create a `README` section that documents the most important scripts and examples of common maintenance tasks

---

> **Note:** If you'd like me to also create the `backend/.env.example` and/or add a `CLEANUP_PROPOSAL` change branch, tell me and I will proceed.

---

*Last updated: 2026-01-03*


