# Architectural Patterns

## i18n (Internationalization)

All user-visible strings go through the translation system — never hardcode Chinese/English text in components.

- **Translations:** `src/i18n.ts:7-213` — four objects (`zh`, `en`, `es`, `vi`) all typed as `typeof zh`, ensuring all languages have identical keys.
- **Type safety:** `TKey = keyof typeof zh` (`src/i18n.ts:216`). The `t()` function accepts only `TKey`, not `string` — TypeScript will catch missing keys at build time.
- **Context:** `src/context/LangContext.tsx` — `LangProvider` wraps the whole app (`src/App.tsx:10`), exposing `{ lang, setLang, t }` via `useLang()`.
- **Service names:** Components use a local helper `const svcName = (name, nameEn) => lang === 'zh' ? name : nameEn` to pick the right service name. See `src/components/Services.tsx:6`, `src/components/BookingForm.tsx:75`.

## API Call Pattern

All API calls use the native `fetch` API. No axios, no react-query.

- **Base URL:** `const API = import.meta.env.VITE_API_URL ?? ''` — defined at module top in every file that calls the API (`src/components/BookingForm.tsx:6`, `src/pages/AdminPage.tsx:5`, `src/pages/AdminLogin.tsx`).
- **Auth header helper:** Admin pages use `function authHeaders()` returning `{ Authorization: 'Bearer <token>', 'Content-Type': 'application/json' }` (`src/pages/AdminPage.tsx:31-33`).
- **Error handling:** HTTP status is checked manually (`res.ok`, `res.status === 401`, `res.status === 409`). 401 redirects to login; 409 means time-slot conflict.

## JWT Authentication Flow

1. `POST /api/admin/login` — verifies `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars (plain string compare, no bcrypt), returns signed JWT.
2. Frontend stores token: `localStorage.setItem('admin_token', token)` (`src/pages/AdminLogin.tsx`).
3. Every admin API call passes `Authorization: Bearer <token>`.
4. Backend middleware `requireAuth` (`server/src/middleware/auth.ts:1-22`) validates the token and attaches payload to `req.user`. Returns 401 on failure.
5. Frontend: any 401 response calls `navigate('/admin/login')` — see `src/pages/AdminPage.tsx:129`.

## Database Schema & Access

- **Single table:** `bookings` — auto-created on server start (`server/src/db.ts:9-34`).
- **Notable columns:** `addon_services JSONB` (array of `{id, name}`), `status` with CHECK constraint (`pending|confirmed|rejected`), `email VARCHAR(255)` nullable (admin-created bookings may omit email).
- **Date normalization:** PostgreSQL DATE columns return ISO timestamp strings (`2026-04-01T00:00:00.000Z`). Always call `normalizeDate(d)` = `d.slice(0, 10)` before comparing or displaying dates. See `src/pages/AdminPage.tsx:45`.
- **All queries** use parameterized `pool.query(sql, [params])` — no ORM.

## Time-Slot Conflict Detection

Defined in both backend (authoritative) and frontend (UX availability hints).

- **Backend** (`server/src/routes/bookings.ts`): fetches all non-rejected bookings for the date, converts each slot to minutes via `slotToMinutes()` (`server/src/services.ts`), checks interval overlap: `existStart < newEnd && newStart < existEnd`. Returns 409 on conflict.
- **Frontend** (`src/components/BookingForm.tsx:88-98`): fetches `/api/bookings/availability?date=&basic_service_id=` on date/service change, marks returned slots as disabled in the time picker.
- **Duration source:** `basic_service_duration` (minutes) comes from the DB booking record, which is copied from `server/src/services.ts` at insert time.

## Admin Calendar Rendering

The week calendar in `src/pages/AdminPage.tsx` is built from scratch (no calendar library).

- **Week navigation:** `getWeekStart(d)` snaps to Sunday; `addDays(d, n)` advances by n days; `weekDays` is a 7-element array (`src/pages/AdminPage.tsx:152`).
- **Booking grouping:** `byDate` — a `Record<string, Booking[]>` reduced from `allBookings` (`src/pages/AdminPage.tsx:140-143`). Keys are `YYYY-MM-DD` strings after normalization.
- **Card width:** Each booking card width = `(duration / 600) * 100%` of the row, so a 1-hour booking takes 10% of the row. All bookings in a day share the same row (`flex`, no wrap).
- **Time display:** `to24h(slot)` converts `"1:00 PM"` → `"13:00"` for display (`src/pages/AdminPage.tsx`).
- **Duration display:** `formatDuration(mins)` returns compact format `"1h30m"`.

## Color Palette Convention

All UI uses a consistent pink palette — no grays or blues in public-facing or admin components:

| Token | Hex | Usage |
|-------|-----|-------|
| Deep pink | `#c0507a` | Primary text, headings |
| Primary pink | `#e8789a` | Buttons, accents, active states |
| Mid pink | `#9a4065` | Body text |
| Muted pink | `#c090a0` | Secondary/label text |
| Light pink | `#f0b0c8` | Borders, tertiary info |
| Background | `#fff8fa` | Page background |
| Card bg | `#fce8ed` | Card/section fills |
