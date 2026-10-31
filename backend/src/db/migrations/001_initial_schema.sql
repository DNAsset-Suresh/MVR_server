-- InspireUp Migration 001: Initial Schema
-- Non-destructive, idempotent DDL with table preservation and transaction safety

-- 1. Schema Migrations Ledger
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Verified Keynote Services Catalog
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_tamil VARCHAR(255),
  category VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Speaking Slots & Calendar Availability
CREATE TABLE IF NOT EXISTS speaking_slots (
  id SERIAL PRIMARY KEY,
  slot_date DATE NOT NULL,
  slot_time VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  service_type VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'available',
  booking_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_date_time_slot UNIQUE (slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_speaking_slots_date_status ON speaking_slots (slot_date, status);

-- 4. Confirmed Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  reference_code VARCHAR(32) NOT NULL UNIQUE,
  service_type VARCHAR(128) NOT NULL,
  event_date DATE NOT NULL,
  preferred_slot VARCHAR(64) NOT NULL,
  event_format VARCHAR(64) NOT NULL,
  audience_size VARCHAR(64) NOT NULL,
  organizer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  city VARCHAR(128) NOT NULL,
  theme_notes TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  idempotency_key VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_ref_code ON bookings (reference_code);
CREATE INDEX IF NOT EXISTS idx_bookings_email_date ON bookings (email, event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_idempotency ON bookings (idempotency_key);
