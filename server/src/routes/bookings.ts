import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { sendCustomerReceipt, notifyAdmin } from '../email'
import {
  BASIC_SERVICES,
  ADDON_SERVICES,
  TIME_SLOTS,
  slotToMinutes,
} from '../services'

const router = Router()

// ------------------------------------------------------------------
// GET /api/bookings/availability?date=YYYY-MM-DD&basic_service_id=basic-1
// 返回当天每个时间槽是否可用（基于时长冲突检测）
// ------------------------------------------------------------------
router.get('/availability', async (req: Request, res: Response): Promise<void> => {
  const { date, basic_service_id } = req.query as Record<string, string>

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'date is required (YYYY-MM-DD)' })
    return
  }

  const service      = BASIC_SERVICES.find(s => s.id === basic_service_id)
  const newDuration  = service?.durationMins ?? 75 // 未选服务时用最短时长做保守估计

  const { rows } = await pool.query<{ time_slot: string; basic_service_duration: number }>(
    `SELECT time_slot, basic_service_duration
     FROM bookings
     WHERE date = $1 AND status != 'rejected'`,
    [date],
  )

  const booked: string[] = []

  for (const slot of TIME_SLOTS) {
    const newStart = slotToMinutes(slot)
    const newEnd   = newStart + newDuration

    const conflict = rows.some(b => {
      const existStart = slotToMinutes(b.time_slot)
      const existEnd   = existStart + b.basic_service_duration
      // 区间重叠：existStart < newEnd && newStart < existEnd
      return existStart < newEnd && newStart < existEnd
    })

    if (conflict) booked.push(slot)
  }

  res.json({
    available: TIME_SLOTS.filter(s => !booked.includes(s)),
    booked,
  })
})

// ------------------------------------------------------------------
// POST /api/bookings
// 提交预约（状态默认 pending，发邮件回执）
// ------------------------------------------------------------------
router.post('/', async (req: Request, res: Response): Promise<void> => {
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

  // 必填校验
  if (!name || !email || !date || !timeSlot || !basicServiceId) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const basicService = BASIC_SERVICES.find(s => s.id === basicServiceId)
  if (!basicService) {
    res.status(400).json({ error: 'Invalid basic service' })
    return
  }

  // 服务端二次校验时间冲突
  const { rows: existing } = await pool.query<{ time_slot: string; basic_service_duration: number }>(
    `SELECT time_slot, basic_service_duration
     FROM bookings
     WHERE date = $1 AND status != 'rejected'`,
    [date],
  )

  const newStart = slotToMinutes(timeSlot)
  const newEnd   = newStart + basicService.durationMins

  const conflict = existing.some(b => {
    const existStart = slotToMinutes(b.time_slot)
    const existEnd   = existStart + b.basic_service_duration
    return existStart < newEnd && newStart < existEnd
  })

  if (conflict) {
    res.status(409).json({ error: 'This time slot is no longer available' })
    return
  }

  // 获取增值服务名称
  const selectedAddons = (addonServiceIds || [])
    .map(id => ADDON_SERVICES.find(a => a.id === id)?.name)
    .filter((n): n is string => Boolean(n))

  // 写入数据库
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

  // 发送邮件（不影响主流程）
  const bookingInfo = {
    name, email, wechat,
    date, timeSlot,
    basicServiceName: basicService.name,
    addonServices:    selectedAddons,
    notes,
  }
  notifyAdmin(bookingInfo).catch(err => console.error('Email error:', err))

  res.status(201).json({ id: rows[0].id })
})

export default router
