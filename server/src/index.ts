/**
 * @file index.ts
 * @description Entry point for the Nail Box backend API server.
 *
 * This file is responsible for:
 *  1. Loading environment variables from the .env file before any other module runs.
 *  2. Creating and configuring the Express application (CORS, JSON parsing).
 *  3. Mounting the two main API route groups: bookings and admin.
 *  4. Exposing a lightweight health-check endpoint for uptime monitoring.
 *  5. Initializing the database schema (idempotently), then starting the HTTP listener.
 *
 * Startup order matters: initDb() must complete successfully before the server
 * begins accepting requests, so any migration failures surface immediately and
 * crash the process with a non-zero exit code instead of silently serving broken routes.
 */

// Load .env values into process.env as the very first side-effect,
// before any other module (db, email, etc.) reads environment variables.
import 'dotenv/config'

import express from 'express'
import cors from 'cors'

// initDb runs the CREATE TABLE / ALTER TABLE idempotent setup on startup.
import { initDb } from './db'

// Route handlers mounted under /api/bookings (public-facing booking flow).
import bookingsRouter from './routes/bookings'

// Route handlers mounted under /api/admin (protected admin dashboard).
import adminRouter from './routes/admin'

// Create a single Express application instance shared across the whole server.
const app  = express()

// Read the port from the environment so the same build can run locally (3001)
// and in any cloud hosting environment without code changes.
const PORT = process.env.PORT || 3001

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Allow cross-origin requests from the frontend origin only.
// "credentials: true" is required so the browser sends cookies/auth headers
// when the frontend and API are on different origins (e.g. Vercel + Railway).
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Parse incoming JSON request bodies and expose them on req.body.
// Without this, POST/PATCH handlers would receive an empty object.
app.use(express.json())

// ---------------------------------------------------------------------------
// Route mounting
// ---------------------------------------------------------------------------

// Public booking endpoints: check availability, create a booking.
app.use('/api/bookings', bookingsRouter)

// Protected admin endpoints: login, list/update/delete bookings.
app.use('/api/admin',    adminRouter)

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

// Simple liveness probe used by hosting platforms (Railway, Render, etc.) and
// uptime monitors to verify the process is running and the event loop is alive.
// Returns a JSON body with ok:true and the current server timestamp.
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

/**
 * Initializes the database schema and starts the HTTP server.
 *
 * Keeping startup async allows us to await database readiness before
 * accepting traffic — preventing "table does not exist" errors on cold starts.
 */
async function start() {
  // Run idempotent SQL migrations (CREATE TABLE IF NOT EXISTS, etc.).
  // Throws if the database is unreachable, which is caught below.
  await initDb()

  // Begin listening only after the database is confirmed ready.
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
}

// Top-level error boundary: if initDb() or listen() fails (e.g., bad DATABASE_URL,
// port already in use), log the reason and exit with a non-zero code so the
// process manager (Docker, systemd, Railway) knows to restart or alert.
start().catch(err => {
  console.error('Startup error:', err)
  process.exit(1)
})
