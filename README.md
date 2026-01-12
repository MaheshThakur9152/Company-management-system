# Company Management System

> Consolidated repository containing four active projects: **frontend**, **backend**, **BossJava**, and **supervisor-android**. Unnecessary temporary files, sample templates, generated artifacts, and large cruft were removed to keep the repo minimal and focused.

---

## Table of contents
- [Overview](#overview)
- [Kept Projects](#kept-projects)
  - [frontend](#frontend)
  - [backend](#backend)
  - [BossJava](#bossjava)
  - [supervisor-android](#supervisor-android)
- [Common tasks](#common-tasks)
  - [Prerequisites](#prerequisites)
  - [Install dependencies](#install-dependencies)
  - [Run locally (dev)](#run-locally-dev)
  - [Build for production](#build-for-production)
  - [Clean caches / free space](#clean-caches--free-space)
- [Templates & public assets](#templates--public-assets)
- [Repository history & Git](#repository-history--git)
- [What was removed](#what-was-removed)
- [Advanced / optional steps](#advanced--optional-steps)
- [Contact / Next steps](#contact--next-steps)

---

## Overview
This repository now contains only the projects you requested to keep:
- `frontend` — web UI (Vite + React + TypeScript)
- `backend` — Node.js backend APIs & scripts
- `BossJava` — Android/Java app project
- `supervisor-android` — Android project for supervisor app

All other top-level folders and large temporary/generated files were removed. `.git` is preserved so commit history remains intact locally.

---

## Kept Projects

### frontend
- Location: `./frontend`
- Stack: TypeScript, React, Vite, Tailwind

Typical commands:
```bash
cd frontend
npm install
npm run dev       # start dev server
npm run build     # produce production-ready files in dist
npm run preview   # preview built dist
```
Notes:
- Public templates used by the app live in `frontend/public/` (e.g. `Template_bill_ambeservice.xlsx`, `Bills_real.xlsx`, `elara.xlsx`).
- Temporary and analysis files previously in `frontend/temp` and `frontend/tmp` were removed.

### backend
- Location: `./backend`
- Stack: Node.js (Express-style APIs), scripts for invoicing and template generation

Typical commands:
```bash
cd backend
npm install
npm run dev       # run development server (if defined)
npm start         # run production server (if defined)
```
Notes:
- Backend references `frontend/public/Bills_real.xlsx` as a default template for bill generation.
- Generated invoice artifacts (example: `backend/Invoice_*.xlsx`) were removed when identified as temporary outputs.

### BossJava
- Location: `./BossJava`
- Classic Android/Java project. Open with Android Studio.

Build/run:
```bash
cd BossJava
# from Android Studio: import the project and run
# or run gradle commands:
./gradlew assembleDebug
./gradlew installDebug
```

### supervisor-android
- Location: `./supervisor-android`
- Android project used by the supervisor app

Build/run:
```bash
cd supervisor-android
# from Android Studio or via Gradle:
./gradlew assembleDebug
./gradlew installDebug
```
Notes:
- Keep `app/src/main/res/drawable/app_logo.png` (used in manifest and notifications).

---

## Common tasks

### Prerequisites
- Node.js (LTS) & npm
- Java JDK (for Android projects)
- Android SDK & Android Studio (for `BossJava` and `supervisor-android`)

### Install dependencies
Run per-project:
```bash
cd frontend && npm install
cd backend && npm install
```

### Run locally (dev)
1. Backend (API):
```bash
cd backend
npm run dev
```
2. Frontend:
```bash
cd frontend
npm run dev
```

### Build for production
- Frontend: `cd frontend && npm run build`
- Android: `cd <android-project> && ./gradlew assembleRelease`
- Backend: build process depends on deployment flow (Docker, host, etc.)

### Clean caches / free space
Remove per-project build artifacts when you want to reclaim disk space:
```bash
# remove Node modules and dist/build
find . -type d -name "node_modules" -exec rm -rf {} +
find . -type d -name "dist" -exec rm -rf {} +
# remove Android build outputs
find . -type d -name "build" -exec rm -rf {} +
# remove Gradle caches for projects
find . -type d -name ".gradle" -exec rm -rf {} +
# recommended: run git maintenance
git gc --aggressive --prune=now
```

---

## Templates & public assets
Templates are located in `frontend/public/`:
- `Template_bill_ambeservice.xlsx` — default frontend template
- `Bills_real.xlsx` — referenced by backend default generation
- `elara.xlsx` — used by some backend scripts

If you prefer a tidier structure, move templates into `frontend/public/templates/` and update code references (search for `/Template_bill_ambeservice.xlsx` or `/Bills_real.xlsx`). I can do this refactor if you like.

---

## Repository history & Git
- I kept `.git` to preserve full history.
- If you want the repository to only contain the four folders at the Git-history level (reduce size while keeping filtered history), I can prepare and run `git filter-repo` commands to rewrite history.
- If you prefer to drop history entirely (start fresh), deleting `.git` will remove all local history:
```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit: keep only frontend, backend, BossJava, supervisor-android"
```
Note: Deleting or rewriting history is irreversible locally — ensure any required history exists on a remote or backup first.

---

## What was removed
During cleanup I removed:
- Top-level folders not requested (`ambe-boss`, `android` (others), `Boss` (duplicates), `assets`, etc.)
- Generated APKs and invoices (e.g., `supervisor-android/app/1234.apk`, `backend/Invoice_*.xlsx`)
- `frontend/temp/`, `frontend/tmp/` analysis outputs and `.~lock.*` files
- Build caches and common artifacts when found: `node_modules`, `build`, `.gradle`, `dist`
- If you need any specific removed file restored, they can be retrieved from the remote if pushed there.

---

## Advanced / optional steps
- Shrink Git history to only the kept folders using `git filter-repo` (I can prepare commands and run them).
- Add CI, CODEOWNERS, CONTRIBUTING, or an operation runbook for deployments.
- Move templates into a `templates/` subfolder and update references.

---

## Contact / Next steps
If you'd like any of these follow-ups done I can:
- Remove `.git` and re-init to make a fresh repository
- Run `git filter-repo` to keep only certain folders in history
- Move `public/` templates into a `frontend/public/templates/` folder and update references
- Add CI / build scripts

Please tell me which of the optional steps you want me to take next and I will proceed.

---

_This README was generated by GitHub Copilot (Raptor mini (Preview))._