# DELETE_LOG

Date: 2026-01-03
Commit: 67bdacb
Branch (backup): cleanup/backup-2026-01-03

Removed files (generated artifacts / binaries):
- supervisor-android/build/ (generated Android build output)
- supervisor-android/app/build/ (generated app build output)
- supervisor-android/.gradle/ (local Gradle cache)
- supervisor-android/1234.apk (checked-in APK, removed)
- supervisor-android/supervisor-app-device-binding.apk (checked-in APK, removed)

Rationale: These are generated build artifacts and binary APKs that should not be tracked in source control. They were removed to reduce repo size and avoid accidental commits of generated content.

If anything breaks, you can revert using the backup branch `cleanup/backup-2026-01-03` or revert commit `67bdacb`.

Date: 2026-01-03
Commit: e74bec4
Removed: CLEANUP_PROPOSAL.md (user requested removal)

