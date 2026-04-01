import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { BASIC_SERVICES, ADDON_SERVICES } from '../services'

const router = Router()

// ------------------------------------------------------------------
// POST /api/admin/login
// ------------------------------------------------------------------
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string }

  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' })
    return
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign(
    { username: adminUsername },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' },
  )

  res.json({ token })
})

// ------------------------------------------------------------------
// GET /api/admin/bookings?status=pending&date=YYYY-MM-DD
// ------------------------------------------------------------------
router.get('/bookings', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, date } = req.query as { status?: string; date?: string }

  const validStatuses = ['pending', 'confirmed', 'rejected']
  const conditions: string[] = []
  const params: unknown[] = []

  if (status && validStatuses.includes(status)) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    params.push(date)
    conditions.push(`date = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(
    `SELECT * FROM bookings ${where} ORDER BY date ASC, time_slot ASC`,
    params,
  )

  res.json(rows)
})

// ------------------------------------------------------------------
// POST /api/admin/bookings  (管理员手动添加，跳过冲突检测，默认 confirmed)
// ------------------------------------------------------------------
router.post('/bookings', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
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

  if (!name || !email || !date || !timeSlot || !basicServiceId) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const basicService = BASIC_SERVICES.find(s => s.id === basicServiceId)
  if (!basicService) {
    res.status(400).json({ error: 'Invalid basic service' })
    return
  }

  const selectedAddons = (addonServiceIds || [])
    .map(id => ADDON_SERVICES.find(a => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map(a => ({ id: a.id, name: a.name }))

  const bookingStatus = ['pending', 'confirmed', 'rejected'].includes(status ?? '')
    ? status
    : 'confirmed'

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

  res.status(201).json({ id: rows[0].id })
})

// ------------------------------------------------------------------
// PATCH /api/admin/bookings/:id/status
// ------------------------------------------------------------------
router.patch('/bookings/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id }     = req.params
  const { status } = req.body as { status: string }

  if (!['confirmed', 'rejected', 'pending'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  const { rowCount } = await pool.query(
    `UPDATE bookings SET status = $1 WHERE id = $2`,
    [status, id],
  )

  if (rowCount === 0) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  res.json({ ok: true })
})

// ------------------------------------------------------------------
// DELETE /api/admin/bookings/:id
// ------------------------------------------------------------------
router.delete('/bookings/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { rowCount } = await pool.query(
    `DELETE FROM bookings WHERE id = $1`,
    [req.params.id],
  )

  if (rowCount === 0) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  res.json({ ok: true })
})

// ------------------------------------------------------------------
// GET /api/admin/bookings/:id
// ------------------------------------------------------------------
router.get('/bookings/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [req.params.id],
  )
  if (rows.length === 0) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(rows[0])
})

export default router
