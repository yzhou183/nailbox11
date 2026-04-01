import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db'
import bookingsRouter from './routes/bookings'
import adminRouter from './routes/admin'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.use('/api/bookings', bookingsRouter)
app.use('/api/admin',    adminRouter)

app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

async function start() {
  await initDb()
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
}

start().catch(err => {
  console.error('Startup error:', err)
  process.exit(1)
})
