# Company Management System — Ambe Service ✅

**Overview**

This repository contains the Ambe Service facility management system:

- `frontend/` — React + TypeScript admin console (Vite, TailwindCSS)
- `backend/` — Express API server (Node.js, MongoDB)
- `supervisor-android/` — Android supervisor app (native Gradle project)

This README explains how to run, test, and maintain the project, plus a small cleanup proposal that reduces repo clutter.

---

## Quick start

### 1) Frontend (development)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

Environment: copy `.env.example` to `.env` and set `VITE_API_URL` if your API runs on a non-default host.

### 2) Backend (development)

```bash
cd backend
npm install
cp .env.example .env # create your .env and fill credentials (MongoDB, Cloudinary, MAIL)
npm run dev # uses nodemon
```

Key env vars (in `backend/.env`):
- `MONGODB_URI` — MongoDB connection string
- `PORT` — server port (default 3002)
- `CLOUDINARY_*` — Cloudinary credentials for image uploads
- `BREVO_API_KEY` — for OTP email transport (optional)
- `JWT_SECRET` — JWT signing secret

### 3) Android app (build)

Open `supervisor-android/` in Android Studio and build or run on a device/emulator.

**Note:** There are generated build artifacts and APKs currently checked in. See `CLEANUP_PROPOSAL.md` for a safe cleanup recommendation.

---

## Scripts & Tests

- Frontend: `npm run dev`, `npm run build`, `npm run preview`
- Backend: `npm run dev` (nodemon), `npm test` (Jest)
- CI: `.github/workflows/tests.yml` runs backend tests and builds frontend on PRs.

---

## Cleanup Proposal

I prepared a `CLEANUP_PROPOSAL.md` file proposing removal of generated Android build artifacts and checked-in APKs that should not be in version control. Please review before any deletions are applied.

---

## Contributing & Safety

- If you approve deletions, I will create a backup branch (e.g. `cleanup/backup-YYYYMMDD`), commit the removals, and run builds/tests locally and on CI.
- All removals will be committed so changes are reversible.

---

## Contact

If you want me to proceed with the cleanup or make further edits (strip unused dependencies, improve CI), reply with approval and I will continue.


