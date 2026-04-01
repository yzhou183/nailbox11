/**
 * @file routes/bookings.ts
 * @description Public-facing booking API routes.
 *
 * This router handles the two endpoints that guests interact with directly
 * through the frontend booking flow:
 *
 *  GET  /api/bookings/availability  — returns which time slots are open for a
 *                                     given date and service, based on existing
 *                                     bookings and their durations.
 *
 *  POST /api/bookings               — submits a new booking request, performs a
 *                                     server-side conflict re-check, persists the
 *                                     record, and triggers admin notification emails.
 *
 * No authentication is required for either endpoint — they are intentionally public
 * so guests can book without creating an account.
 *
 * Conflict detection strategy:
 *  Appointments are treated as continuous time intervals [start, start + duration).
 *  Two intervals overlap when: existingStart < newEnd  AND  newStart < existingEnd.
 *  This check is performed both when computing availability (read path) and when
 *  creating a booking (write path), guarding against race conditions where two
 *  guests submit bookings for conflicting slots simultaneously.
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { sendCustomerReceipt, notifyAdmin } from '../email'
import {
  BASIC_SERVICES,
  ADDON_SERVICES,
  TIME_SLOTS,
  slotToMinutes,
} from '../services'

// Create a modular Express router; it will be mounted at /api/bookings in index.ts.
const router = Router()

// ------------------------------------------------------------------
// GET /api/bookings/availability?date=YYYY-MM-DD&basic_service_id=basic-1
// Returns which time slots on the given date are open vs. blocked,
// taking into account the duration of the service being booked.
// ------------------------------------------------------------------
router.get('/availability', async (req: Request, res: Response): Promise<void> => {
  // Extract query parameters — both arrive as strings from the URL.
  const { date, basic_service_id } = req.query as Record<string, string>

  // Validate that `date` is present and matches the expected YYYY-MM-DD format.
  // Without this check a malformed date would cause an unexpected Postgres error.
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'date is required (YYYY-MM-DD)' })
    return
  }

  // Look up the requested service to get its duration.
  // If the service ID is not recognized (or omitted), fall back to 75 minutes —
  // the shortest service duration — which gives the most optimistic/conservative
  // availability view (i.e., fewer slots appear blocked than might actually be).
  const service      = BASIC_SERVICES.find(s => s.id === basic_service_id)
  const newDuration  = service?.durationMins ?? 75 // fallback: shortest service

  // Fetch all non-rejected bookings for the requested date.
  // We include 'pending' bookings (not just 'confirmed') because they represent
  // time that is tentatively reserved and should not be double-booked.
  // We need both time_slot (to compute the start minute) and basic_service_duration
  // (to compute the end minute) for each existing booking.
  const { rows } = await pool.query<{ time_slot: string; basic_service_duration: number }>(
    `SELECT time_slot, basic_service_duration
     FROM bookings
     WHERE date = $1 AND status != 'rejected'`,
    [date],
  )

  // Walk every possible time slot and determine whether placing the requested
  // service there would overlap with any existing booking.
  const booked: string[] = []

  for (const slot of TIME_SLOTS) {
    // Convert the candidate slot to a [start, end) interval in minutes.
    const newStart = slotToMinutes(slot)
    const newEnd   = newStart + newDuration

    // Check if any existing booking's interval overlaps the candidate interval.
    // Overlap condition: the two intervals share at least one minute.
    //   existStart < newEnd   — existing appointment starts before ours ends
    //   newStart   < existEnd — our appointment starts before existing one ends
    // Both conditions must be true for there to be an overlap.
    const conflict = rows.some(b => {
      const existStart = slotToMinutes(b.time_slot)
      const existEnd   = existStart + b.basic_service_duration
      // 区间重叠：existStart < newEnd && newStart < existEnd
      return existStart < newEnd && newStart < existEnd
    })

    // If placing the new appointment here would conflict, mark the slot as booked.
    if (conflict) booked.push(slot)
  }

  // Respond with two arrays: available slots (for the UI to enable) and
  // booked slots (for the UI to disable/grey out).
  res.json({
    available: TIME_SLOTS.filter(s => !booked.includes(s)),
    booked,
  })
})

// ------------------------------------------------------------------
// POST /api/bookings
// Submits a new booking request. Status defaults to 'pending'.
// Sends an admin notification email (non-blocking).
// ------------------------------------------------------------------
router.post('/', async (req: Request, res: Response): Promise<void> => {
  // Destructure and type the expected request body fields.
  // All fields are required except `wechat` and `notes`.
  const {
    name, email, wechat,
    date, timeSlot,
    basicServiceId, addonServiceIds,
    notes,
  } = req.body as {
    name:            string
    email:           string
    wechat?:         string
    date:            string
    timeSlot:        string
    basicServiceId:  string
    addonServiceIds: string[]
    notes?:          string
  }

  // Validate presence of all mandatory fields before touching the database.
  // Returning early here prevents partial-insert errors and keeps error messages clear.
  if (!name || !email || !date || !timeSlot || !basicServiceId) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  // Validate that the submitted basicServiceId matches a known service.
  // This prevents clients from injecting arbitrary service data and ensures
  // we have an accurate duration value for conflict detection and storage.
  const basicService = BASIC_SERVICES.find(s => s.id === basicServiceId)
  if (!basicService) {
    res.status(400).json({ error: 'Invalid basic service' })
    return
  }

  // ---------------------------------------------------------------------------
  // Server-side conflict re-check (prevents race conditions)
  // ---------------------------------------------------------------------------
  // The frontend already called /availability before rendering the booking form,
  // but time can pass between that check and this submission.  A second guest
  // might have booked the same slot in the interim.  We repeat the overlap check
  // here inside the same request to minimize (though not fully eliminate under
  // high concurrency) the chance of a double-booking being persisted.
  const { rows: existing } = await pool.query<{ time_slot: string; basic_service_duration: number }>(
    `SELECT time_slot, basic_service_duration
     FROM bookings
     WHERE date = $1 AND status != 'rejected'`,
    [date],
  )

  // Compute the [start, end) interval for the requested slot.
  const newStart = slotToMinutes(timeSlot)
  const newEnd   = newStart + basicService.durationMins

  // Apply the same overlap algorithm used in the availability endpoint.
  const conflict = existing.some(b => {
    const existStart = slotToMinutes(b.time_slot)
    const existEnd   = existStart + b.basic_service_duration
    return existStart < newEnd && newStart < existEnd
  })

  // Return HTTP 409 Conflict if the slot is no longer available.
  // The frontend should handle this by re-fetching availability and
  // prompting the guest to choose a different time.
  if (conflict) {
    res.status(409).json({ error: 'This time slot is no longer available' })
    return
  }

  // ---------------------------------------------------------------------------
  // Resolve add-on service names from submitted IDs
  // ---------------------------------------------------------------------------
  // The client sends an array of add-on IDs; we look each one up in the catalog
  // to get its display name.  Unknown IDs are silently filtered out (defensive).
  // We store names rather than IDs so that historical records make sense even if
  // an add-on is removed from the catalog in the future.
  const selectedAddons = (addonServiceIds || [])
    .map(id => ADDON_SERVICES.find(a => a.id === id)?.name)
    .filter((n): n is string => Boolean(n))  // type-narrow: exclude undefined

  // ---------------------------------------------------------------------------
  // Persist the booking record
  // ---------------------------------------------------------------------------
  // RETURNING id lets us send the new booking's UUID back to the client without
  // a separate SELECT, which is both efficient and race-condition safe.
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO bookings
       (name, email, wechat, date, time_slot,
        basic_service_id, basic_service_name, basic_service_duration,
        addon_services, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      name, email, wechat || null, date, timeSlot,
      basicServiceId, basicService.name, basicService.durationMins,
      JSON.stringify(selectedAddons), notes || null,
    ],
  )

  // ---------------------------------------------------------------------------
  // Send notification emails (fire-and-forget)
  // ---------------------------------------------------------------------------
  // Emails are dispatched asynchronously and their promise is not awaited on
  // the main response path. This ensures that a transient email service failure
  // does not cause the booking to appear broken to the guest.
  // Errors are logged to the server console for debugging but do not bubble up.
  const bookingInfo = {
    name, email, wechat,
    date, timeSlot,
    basicServiceName: basicService.name,
    addonServices:    selectedAddons,
    notes,
  }
  // Note: sendCustomerReceipt is not called here intentionally —
  // only the admin is notified at submission time. The admin then confirms/rejects.
  notifyAdmin(bookingInfo).catch(err => console.error('Email error:', err))

  // Return the new booking's UUID so the frontend can display a confirmation number.
  res.status(201).json({ id: rows[0].id })
})

export default router
