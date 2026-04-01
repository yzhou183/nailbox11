import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                  VARCHAR(100)  NOT NULL,
      email                 VARCHAR(255)  NOT NULL,
      wechat                VARCHAR(100),
      date                  DATE          NOT NULL,
      time_slot             VARCHAR(20)   NOT NULL,
      basic_service_id      VARCHAR(50)   NOT NULL,
      basic_service_name    VARCHAR(200)  NOT NULL,
      basic_service_duration INTEGER      NOT NULL,
      addon_services        JSONB         NOT NULL DEFAULT '[]',
      notes                 TEXT,
      status                VARCHAR(20)   NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'confirmed', 'rejected')),
      created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_date   ON bookings(date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  `)
  console.log('✓ Database ready')
}
