# Ambe Frontend 🔧

This is the React web admin console for Ambe Service (TypeScript + Vite + TailwindCSS).

## Quick start 🚀

1. Install dependencies

```bash
cd frontend
npm install
```

2. Run development server

```bash
npm run dev
# open http://localhost:5173
```

3. Build for production

```bash
npm run build
npm run preview # to preview local build
```

## Environment variables

Copy `.env.example` to `.env` and adjust as necessary:

```bash
cp .env.example .env
```

Key variables:
- `VITE_API_URL` - base API path (defaults to `/api` in dev)
- `VITE_PUBLIC_KEY` - optional public key used by some utilities

## Notes
- The frontend expects the backend API under `/api` by default (dev proxy or same host). Update `VITE_API_URL` for different setups.
- The root `README.md` in the repository contains full project instructions.
