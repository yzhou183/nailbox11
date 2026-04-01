/**
 * @file routes/admin.ts
 * @description Protected admin API routes for managing the Nail Box booking system.
 *
 * All routes except POST /login require a valid JWT in the Authorization header
 * (enforced by the `requireAuth` middleware).
 *
 * Endpoints:
 *
 *  POST   /api/admin/login                  — Authenticate with username + password,
 *                                             receive a 24-hour JWT.
 *
 *  GET    /api/admin/bookings               — List bookings with optional filters for
 *                                             status and/or date.
 *
 *  POST   /api/admin/bookings               — Manually create a booking (admin use only),
 *                                             bypassing conflict detection; defaults to
 *                                             'confirmed' status.
 *
 *  PATCH  /api/admin/bookings/:id/status    — Update a booking's workflow status
 *                                             (pending -> confirmed or rejected).
 *
 *  DELETE /api/admin/bookings/:id           — Permanently remove a booking record.
 *
 *  GET    /api/admin/bookings/:id           — Fetch a single booking by UUID.
 */

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { BASIC_SERVICES, ADDON_SERVICES } from '../services'

// Create a modular Express router; mounted at /api/admin in index.ts.
const router = Router()

// ------------------------------------------------------------------
// POST /api/admin/login
// Validates admin credentials from environment variables and issues a JWT.
// ------------------------------------------------------------------
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  // Extract credentials from the request body.
  const { username, password } = req.body as { username: string; password: string }

  // Reject requests that are missing either field to avoid comparing against
  // empty strings (which could inadvertently match a blank env var).
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' })
    return
  }

  // Read the expected credentials from the environment.
  // Defaults are intentionally weak ('admin' / '') so that the app fails
  // obviously when env vars are not configured rather than silently using
  // hard-coded secrets.
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  // Constant-time comparison is not used here because this is a single-admin
  // system; timing attacks are not a meaningful threat at this scale.
  // For a multi-user system, consider a constant-time comparison library.
  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  // Sign a JWT containing the username as the payload.
  // The token expires in 24 hours — forcing re-authentication daily limits
  // the window of exposure if a token is ever leaked.
  // JWT_SECRET is asserted non-null (!); the server should not start without it.
  const token = jwt.sign(
    { username: adminUsername },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' },
  )

  // Return the raw token string; the frontend stores this in memory or localStorage
  // and attaches it to subsequent requests as a Bearer token.
  res.json({ token })
})

// ------------------------------------------------------------------
// GET /api/admin/bookings?status=pending&date=YYYY-MM-DD
// Returns a filtered, date-sorted list of bookings for the dashboard.
// Both query parameters are optional; when omitted, all bookings are returned.
// ------------------------------------------------------------------
router.get('/bookings', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  // Both filters are optional — the admin may want to see all bookings,
  // only pending ones, only bookings on a specific date, or both filters combined.
  const { status, date } = req.query as { status?: string; date?: string }

  // We build the WHERE clause dynamically to avoid a combinatorial set of
  // hard-coded query strings.  Parameters are accumulated in order so that
  // $1, $2, etc. match the params array at query time.
  const validStatuses = ['pending', 'confirmed', 'rejected']
  const conditions: string[] = []
  const params: unknown[] = []

  // Only apply the status filter if the value is one of the three valid statuses.
  // This prevents SQL injection and accidental no-result queries from typos.
  if (status && validStatuses.includes(status)) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }

  // Only apply the date filter if it passes the YYYY-MM-DD format check.
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    params.push(date)
    conditions.push(`date = $${params.length}`)
  }

  // Compose the optional WHERE clause; an empty conditions array means no filtering.
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // Sort by date then time_slot so the admin dashboard shows a chronological list.
  const { rows } = await pool.query(
    `SELECT * FROM bookings ${where} ORDER BY date ASC, time_slot ASC`,
    params,
  )

  res.json(rows)
})

// ------------------------------------------------------------------
// POST /api/admin/bookings  — Admin manually creates a booking.
// Key differences from the public POST /api/bookings endpoint:
//   1. No conflict detection — admins can override slot availability.
//   2. Default status is 'confirmed' rather than 'pending'.
//   3. name and email are the only required fields (email is optional here).
// ------------------------------------------------------------------
router.post('/bookings', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  // Destructure the request body.  `status` is admin-settable unlike the public route.
  const {
    name, email, wechat,
    date, timeSlot,
    basicServiceId, addonServiceIds,
    notes, status,
  } = req.body as {
    name: string; email: string; wechat?: string
    date: string; timeSlot: string
    basicServiceId: string; addonServiceIds?: string[]
    notes?: string; status?: string
  }

  // Require the core scheduling fields; email is intentionally not required here
  // because admins may add walk-in bookings where the guest has no email.
  if (!name || !date || !timeSlot || !basicServiceId) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  // Validate the service ID against the catalog.
  const basicService = BASIC_SERVICES.find(s => s.id === basicServiceId)
  if (!basicService) {
    res.status(400).json({ error: 'Invalid basic service' })
    return
  }

  // Resolve add-on IDs to full objects (id + name).
  // The admin endpoint stores objects (not just name strings) to preserve IDs
  // for potential future use (e.g., pricing lookups).
  const selectedAddons = (addonServiceIds || [])
    .map(id => ADDON_SERVICES.find(a => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))  // remove unfound IDs
    .map(a => ({ id: a.id, name: a.name }))

  // Validate the requested status, defaulting to 'confirmed' when not provided
  // or when an invalid value is submitted.  Admins are assumed to be creating
  // appointments they have already verbally confirmed with the guest.
  const bookingStatus = ['pending', 'confirmed', 'rejected'].includes(status ?? '')
    ? status
    : 'confirmed'

  // Insert the new booking. The explicit `status` column is included here
  // (unlike the public endpoint) to support the admin-specified status value.
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO bookings
       (name, email, wechat, date, time_slot,
        basic_service_id, basic_service_name, basic_service_duration,
        addon_services, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      name, email, wechat || null, date, timeSlot,
      basicServiceId, basicService.name, basicService.durationMins,
      JSON.stringify(selectedAddons), notes || null,
      bookingStatus,
    ],
  )

  // Return the new booking UUID with HTTP 201 Created.
  res.status(201).json({ id: rows[0].id })
})

// ------------------------------------------------------------------
// PATCH /api/admin/bookings/:id/status
// Transitions a booking's status. The typical flow is:
//   pending -> confirmed  (admin approves the request)
//   pending -> rejected   (admin declines; slot becomes available again)
// Changing back to 'pending' is also allowed (e.g., to revert a mistake).
// ------------------------------------------------------------------
router.patch('/bookings/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  // Extract the booking UUID from the URL path parameter.
  const { id }     = req.params

  // Extract the new status from the request body.
  const { status } = req.body as { status: string }

  // Validate the submitted status value against the allowed set.
  // This mirrors the CHECK constraint in the database schema but provides
  // a more informative error message than a raw Postgres constraint violation.
  if (!['confirmed', 'rejected', 'pending'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  // Perform the UPDATE and capture rowCount to detect "not found" cases.
  // Using parameterized queries ($1, $2) prevents SQL injection.
  const { rowCount } = await pool.query(
    `UPDATE bookings SET status = $1 WHERE id = $2`,
    [status, id],
  )

  // rowCount === 0 means no row matched the given UUID — return 404 instead
  // of silently succeeding, which would confuse the client.
  if (rowCount === 0) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  // Acknowledge success.  The full updated record is not returned here;
  // the client can re-fetch if it needs the updated row.
  res.json({ ok: true })
})

// ------------------------------------------------------------------
// DELETE /api/admin/bookings/:id
// Permanently removes a booking record from the database.
// This action is irreversible — there is no soft-delete or recycle bin.
// ------------------------------------------------------------------
router.delete('/bookings/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  // Attempt to delete the row matching the UUID from the URL.
  const { rowCount } = await pool.query(
    `DELETE FROM bookings WHERE id = $1`,
    [req.params.id],
  )

  // If no row was deleted, the booking does not exist — return 404.
  if (rowCount === 0) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  // Confirm the deletion succeeded.
  res.json({ ok: true })
})

// ------------------------------------------------------------------
// GET /api/admin/bookings/:id
// Fetches a single booking by its UUID.
// Used by the admin UI to show full details for a specific booking
// (e.g., when the admin clicks into a booking card).
// ------------------------------------------------------------------
router.get('/bookings/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  // Fetch all columns for the specified booking UUID.
  const { rows } = await pool.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [req.params.id],
  )

  // If the UUID doesn't match any record, return 404 rather than an empty array,
  // so the client can distinguish "not found" from a successful but empty list.
  if (rows.length === 0) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  // Return the single booking object (not wrapped in an array).
  res.json(rows[0])
})

export default router
