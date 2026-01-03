# MIGRATION_NOTES

**Status:** Frontend migration complete and validated (builds succeed). Backend files migrated into `backend-1/` and need runtime validation (install/start).

## Summary of Work Done ✅
- Created `frontend-1/` and `backend-1/` packages and moved files per the migration plan.
- Migrated React components, pages, services, utils and assets into `frontend-1/src/` (aliases configured in `frontend-1/tsconfig.json` and `vite.config.ts`).
- Migrated backend `api/`, `models/`, and `scripts/` into `backend-1/src/`.
- Added `.env.example` templates to both packages.
- Fixed multiple build issues iteratively (vite config escaping, tsconfig baseUrl, missing index.html, missing exported helpers) so that `frontend-1` builds successfully.

## File Mapping (representative)
- `components/` → `frontend-1/src/components/`
- `screens/` / `web/` → `frontend-1/src/pages/` (Admin web app copied to `src/pages/AdminWebApp.tsx`)
- `services/` → `frontend-1/src/services/` & `backend-1/src/scripts/`
- `utils/` → `frontend-1/src/utils/` & `backend-1/src/utils/`
- `backend/api/` → `backend-1/src/api/`
- `backend/models/` → `backend-1/src/models/`
- `backend/scripts/*` → `backend-1/src/scripts/`

> Note: This is a high-level mapping. If you want a full file-by-file table I can generate it.

## How to build & run (local)
### Frontend (`frontend-1`)
- Install: `cd frontend-1 && npm install`
- Dev: `npm run dev` (starts Vite dev server)
- Prod build: `npm run build`
- Notes: If `npm ci` is required by CI, generate a `package-lock.json` first with `npm install`.

### Backend (`backend-1`)
- Install: `cd backend-1 && npm install`
- Start: `npm run dev` or `npm start` (check `package.json` scripts)
- Required env vars: Copy `backend-1/.env.example` → `.env` and fill keys (MONGO_URI, JWT_SECRET, CLOUDINARY_*, etc.)
- Notes: I have not yet validated a running server against a real DB — I will attempt this next if you want.

## Known issues & notes ⚠️
- Node engine warnings seen for some packages (react-native) during `npm install` — not blocking, but consider aligning Node version to match package engine expectations if you plan to run RN packages.
- Some scripts reference env secrets (Cloudinary, Brevo, DB). You must populate `.env` before running backend scripts.
- I added `baseUrl` + `paths` to `frontend-1/tsconfig.json` and updated imports to use `@` aliases (e.g., `@services/*`). This avoids brittle long relative paths.
- `frontend-1` build succeeded locally after fixes. `backend-1` startup and integration tests are pending.

## Tests performed ✅
- `frontend-1`: `npm install` and `npm run build` — successful production build produced `dist/` assets.
- Linting and unit/integration tests: I did not run project-specific test suites (none configured in migration target) — tell me if you want me to run additional tests.

## Next recommended steps ▶️
1. Review these notes and the proposed `DELETE_LOG` (draft in repo) and confirm which files to remove.
2. I will create a backup branch/tag (`migration/backup-before-delete` + `pre-delete-migration`) before any deletions.
3. Validate `backend-1` by installing and starting it against a test DB (I can do this; please provide a test DB URI or allow me to run with environment stubs).
4. Run any smoke/integration tests you consider important (CI recommended).
5. Once validated and after you approve, I will remove legacy files and update `DELETE_LOG.md` with exact file paths and commit SHAs.
6. **Action taken:** I archived the proposed legacy files into `archived_deleted_files/` and committed the changes on branch `migration/backup-before-delete` (commit message: "chore(migration): archive legacy files per restructuring proposal"). If you'd like permanent deletion, say "Permanently delete archives" and I will remove them and record the SHAs in `DELETE_LOG.md`.

## Rollback plan
- Before deleting: create branch `migration/backup-before-delete` and tag `pre-delete-migration` on the current commit.
- After deletion (if a problem occurs): revert the deletion commit or check out the backup branch.

---

If this summary looks good, I will proceed to validate `backend-1` next (install + start + surface any startup/runtime errors). Alternatively, I can first produce a full file-by-file deletion list for your review.