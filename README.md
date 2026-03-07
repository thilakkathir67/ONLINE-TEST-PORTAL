# Online Test Portal (Dark Navy Gradient)

Modern online test portal with **Create Test**, **Join Test**, optional **Login**, AI question generation (stubbed), shareable links, timer-based test taking, and analytics dashboard.

## Monorepo
- `apps/web` -> Next.js (App Router) + Tailwind
- `apps/api` -> Node.js + Express + MongoDB (Mongoose)

## Quick Start (Local)

### 1) API
```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```

### 2) Web
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open:
- Web: http://localhost:3000
- API: http://localhost:5000

## Notes
- AI generation endpoint is wired but returns deterministic mock questions unless you add an API key.
- Auth is optional. Create/Join works without login.
