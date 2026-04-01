/**
 * @file db.ts
 * @description PostgreSQL connection pool and database initialization.
 *
 * This module exports:
 *  - `pool`   — the shared pg.Pool instance used by all query sites in the app.
 *  - `initDb` — an async function that creates the schema on first run and
 *               applies safe ALTER TABLE migrations on subsequent runs.
 *
 * Design notes:
 *  - A single shared pool is used throughout the application rather than
 *    opening a new connection per request, which keeps connection overhead low
 *    and respects the database server's connection limit.
 *  - SSL is enabled with `rejectUnauthorized: false` to support managed cloud
 *    databases (e.g., Supabase, Railway) that use self-signed certificates.
 *  - All DDL statements are idempotent (IF NOT EXISTS / safe ALTER), so
 *    `initDb` can be called on every cold start without risk of data loss.
 */

import { Pool } from 'pg'

// ---------------------------------------------------------------------------
// Connection pool
// ---------------------------------------------------------------------------

/**
 * Shared PostgreSQL connection pool.
 *
 * Configuration is read entirely from environment variables so the same code
 * works in local development (.env) and production (hosting platform secrets).
 *
 *  DATABASE_URL — full postgres:// connection string, e.g.:
 *                 postgres://user:pass@host:5432/dbname
 *  ssl.rejectUnauthorized: false — accept self-signed TLS certificates from
 *                                   cloud-managed Postgres providers.
 *  max: 10 — cap the pool at 10 concurrent connections; sufficient for a
 *             single-studio booking app and well within free-tier limits.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

// ---------------------------------------------------------------------------
// Schema initialization
// ---------------------------------------------------------------------------

/**
 * Creates (or verifies) the database schema required by the application.
 *
 * This function is called once at server startup before any HTTP traffic is
 * accepted. It is safe to call multiple times — every statement is idempotent:
 *
 *  - CREATE TABLE IF NOT EXISTS  -> no-op if the table already exists.
 *  - CREATE INDEX IF NOT EXISTS  -> no-op if the index already exists.
 *  - ALTER COLUMN DROP NOT NULL  -> idempotent in PostgreSQL (no error if the
 *                                  column is already nullable).
 *
 * @returns A promise that resolves when the schema is ready, or rejects if
 *          the database is unreachable or the SQL fails.
 */
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      -- Surrogate primary key: auto-generated UUID avoids sequential ID
      -- enumeration attacks and works well across distributed inserts.
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      -- Guest identity — name is required; email and WeChat are contact channels.
      -- At least one contact method is expected at the application layer but the
      -- DB allows email to be null (see ALTER below) for flexibility.
      name                  VARCHAR(100)  NOT NULL,
      email                 VARCHAR(255),
      wechat                VARCHAR(100),

      -- Appointment slot — stored as a DATE + a free-form time string (e.g. "2:30 PM")
      -- rather than a full TIMESTAMPTZ so that timezone-ambiguous display strings
      -- from the UI are preserved exactly as the guest selected them.
      date                  DATE          NOT NULL,
      time_slot             VARCHAR(20)   NOT NULL,

      -- Denormalized service snapshot: store the service ID, human-readable name,
      -- and duration at booking time so historical records remain accurate even if
      -- the service catalog is updated later.
      basic_service_id      VARCHAR(50)   NOT NULL,
      basic_service_name    VARCHAR(200)  NOT NULL,
      basic_service_duration INTEGER      NOT NULL,

      -- Array of selected add-on service names stored as JSONB.
      -- Using JSONB (rather than a junction table) keeps the schema simple for
      -- this single-operator use-case and allows querying with Postgres JSON operators.
      addon_services        JSONB         NOT NULL DEFAULT '[]',

      -- Optional free-text note from the guest (e.g. nail shape preference).
      notes                 TEXT,

      -- Workflow state: pending -> confirmed or rejected.
      -- A CHECK constraint enforces the closed set of valid values at the DB level,
      -- providing a safety net beyond application-layer validation.
      status                VARCHAR(20)   NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'confirmed', 'rejected')),

      -- Audit timestamp: recorded in UTC with timezone offset for unambiguous sorting.
      created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    -- Index on date accelerates the most common query pattern: fetching all
    -- bookings for a given day (availability check + admin calendar view).
    CREATE INDEX IF NOT EXISTS idx_bookings_date   ON bookings(date);

    -- Index on status speeds up admin dashboard queries filtered to 'pending'.
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

    -- Allow email to be nullable (safe to run multiple times)
    -- This ALTER is here because the column was originally NOT NULL and was
    -- relaxed in a later iteration to support WeChat-only customers.
    ALTER TABLE bookings ALTER COLUMN email DROP NOT NULL;
  `)
  console.log('✓ Database ready')
}
