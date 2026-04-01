# Nail Box — Project Guide

## What This Is
A nail salon booking website with a public-facing landing page and a password-protected admin dashboard. Customers book appointments; the owner manages them via the admin panel.

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router DOM
**Backend:** Express + TypeScript + PostgreSQL (Neon) + JWT auth + Resend email
**Deploy:** Vercel (frontend) · Railway (backend)
**PWA:** vite-plugin-pwa with service worker (Workbox)

## Key Directories

| Path | Purpose |
|------|---------|
| `src/components/` | Public-facing UI (Hero, Services, BookingForm, etc.) |
| `src/pages/` | Route-level pages: `AdminLogin.tsx`, `AdminPage.tsx` |
| `src/context/` | React Context — only `LangContext.tsx` (i18n state) |
| `src/data/services.ts` | Source of truth for service names, prices, durations |
| `src/i18n.ts` | All translations for zh/en/es/vi — type-safe via `TKey` |
| `src/types.ts` | Shared TypeScript interfaces (`BookingFormData`, `FormErrors`) |
| `server/src/routes/` | Express routes: `bookings.ts` (public) · `admin.ts` (protected) |
| `server/src/middleware/auth.ts` | JWT Bearer token validation |
| `server/src/db.ts` | PostgreSQL pool + schema auto-creation on startup |
| `server/src/email.ts` | Resend email templates (admin notify only — no custom domain) |
| `public/` | PWA icons (SVG) |

## Commands

**Frontend**
```
npm run dev        # dev server on :5173 (proxies /api → :3001)
npm run build      # tsc && vite build  ← must pass before pushing
npm run preview    # preview production build
```

**Backend** (run from `server/`)
```
npm run dev        # tsx watch (hot reload)
npm run build      # tsc
npm start          # node dist/index.js
```

## Routes

| URL | Component |
|-----|-----------|
| `/` | `App.tsx` — single-page with anchor sections |
| `/admin/login` | `AdminLogin.tsx` |
| `/admin` | `AdminPage.tsx` (requires JWT in localStorage) |

`vercel.json` has a catch-all rewrite so React Router works on Vercel.

## Environment Variables

**Frontend** (Vercel): `VITE_API_URL`
**Backend** (Railway): `DATABASE_URL` · `JWT_SECRET` · `ADMIN_USERNAME` · `ADMIN_PASSWORD` · `RESEND_API_KEY` · `FROM_EMAIL` · `ADMIN_EMAIL` · `FRONTEND_URL` · `PORT`

## Additional Documentation

Check these when relevant:

- [`.claude/docs/architectural_patterns.md`](.claude/docs/architectural_patterns.md) — i18n pattern, API call conventions, auth flow, DB schema, time-slot conflict detection, admin calendar rendering
