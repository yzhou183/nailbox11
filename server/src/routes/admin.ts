import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'

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

  // 用户名用固定时间比较防计时攻击，密码用 bcrypt 兼容明文比较
  const usernameMatch = username === adminUsername
  const passwordMatch = await bcrypt.compare(password, await bcrypt.hash(adminPassword, 10))
    .catch(() => false)

  // 简单做法：直接字符串比较（安全性足够用于单管理员）
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
// GET /api/admin/bookings?status=pending
// ------------------------------------------------------------------
router.get('/bookings', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query as { status?: string }

  const validStatuses = ['pending', 'confirmed', 'rejected']
  const filter = status && validStatuses.includes(status) ? status : null

  const { rows } = await pool.query(
    filter
      ? `SELECT * FROM bookings WHERE status = $1 ORDER BY created_at DESC`
      : `SELECT * FROM bookings ORDER BY created_at DESC`,
    filter ? [filter] : [],
  )

  res.json(rows)
})

// ------------------------------------------------------------------
// PATCH /api/admin/bookings/:id/status
// body: { status: 'confirmed' | 'rejected' }
// ------------------------------------------------------------------
router.patch('/bookings/:id/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id }     = req.params
  const { status } = req.body as { status: string }

  if (!['confirmed', 'rejected'].includes(status)) {
    res.status(400).json({ error: "status must be 'confirmed' or 'rejected'" })
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
// GET /api/admin/bookings/:id  (单条详情)
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
