# Image Uploads

This document explains the new upload middleware and endpoints added to the backend.

## Middleware
- `src/middleware/upload.js` — Multer-based memory storage with file filter (jpg/jpeg/png) and 6MB per-file limit.
- `src/utils/cloudinaryHelper.js` — Helper `uploadBufferToCloudinary(buffer, folder)` that streams the buffer to Cloudinary.

## Endpoints
- `POST /api/employees` accepts multipart/form-data and a `photo` file field (single). Example field names:
  - `photo` (file) — Employee profile image
  - other form fields like `name`, `id`, `siteId` as string fields

- `PUT /api/employees/:id` accepts multipart/form-data and `photo` (single) to update profile photo.

- `POST /api/uploads/images` accepts multipart/form-data with `photos` (array of files) and returns an array of uploaded file metadata:
  ```json
  { "uploaded": [ { "originalName": "img1.jpg", "url": "https://...", "public_id": "..." }, ... ] }
  ```

## Usage (curl example)
- Upload single photo while creating an employee:

  curl -X POST "http://localhost:3002/api/employees" \
    -F "name=Alex" \
    -F "id=emp123" \
    -F "photo=@/path/to/photo.jpg"

- Upload multiple images:

  curl -X POST "http://localhost:3002/api/uploads/images" \
    -F "photos=@/path/img1.jpg" \
    -F "photos=@/path/img2.png"

## Notes
- Existing behavior (sending `photoUrl` as a base64 string in JSON) still works and will be uploaded to Cloudinary via the existing helper when detected.
- The middleware streams directly to Cloudinary (no large temporary file on disk).
- Adjust file size limits or allowed MIME types in `src/middleware/upload.js` if needed.

If you'd like, I can also:
- Add server-side rate limiting for the uploads endpoint
- Add tests for these endpoints (Jest + Supertest)
- Add client-side examples in the frontend (React) to use these endpoints

---
