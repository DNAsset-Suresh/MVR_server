import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../.env' });

const { Pool } = pg;

// Read PostgreSQL configuration from backend environment variables
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'inspireup_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
    };

let pool = null;
let mockPool = null;

/**
 * Injects a mock pool for deterministic testing without live database or credentials.
 */
export function setMockDbPool(injectedPool) {
  mockPool = injectedPool;
}

/**
 * Resets the mock pool.
 */
export function resetMockDbPool() {
  mockPool = null;
}

/**
 * Checks if PostgreSQL configuration credentials exist.
 */
export function isDbConfigured() {
  if (mockPool) return true;
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() && !process.env.DATABASE_URL.includes('your_postgres_password')) {
    return true;
  }
  return Boolean(
    process.env.PGDATABASE &&
    process.env.PGUSER &&
    process.env.PGPASSWORD &&
    process.env.PGPASSWORD !== 'your_postgres_password_here' &&
    process.env.PGPASSWORD !== 'your_password_here'
  );
}

/**
 * Returns safe database connection status without exposing passwords or internal secrets.
 */
export function getDbConfigStatus() {
  const isConfigured = isDbConfigured();
  return {
    configured: isConfigured,
    host: poolConfig.host || 'from_url',
    port: poolConfig.port || 5432,
    database: poolConfig.database || 'from_url',
    user: poolConfig.user || 'from_url',
    status: isConfigured
      ? 'PostgreSQL credentials configured'
      : 'Awaiting verified environment credentials (see .env.example)'
  };
}

/**
 * Returns active connection pool (mocked or real).
 */
export function getPool() {
  if (mockPool) return mockPool;
  if (!pool) {
    pool = new Pool(poolConfig);
  }
  return pool;
}

/**
 * Safely tests connection to PostgreSQL server with a timeout.
 * Never throws unhandled errors or exposes connection strings.
 */
export async function testDbConnection() {
  if (mockPool) {
    try {
      const client = await mockPool.connect();
      try {
        await client.query('SELECT 1');
        return { ok: true, configured: true, message: 'Mock database connection healthy' };
      } finally {
        client.release?.();
      }
    } catch (err) {
      return { ok: false, configured: true, error: err.message };
    }
  }

  if (!isDbConfigured()) {
    return {
      ok: false,
      configured: false,
      error: 'PostgreSQL database credentials are not configured in environment (see .env.example).'
    };
  }

  try {
    const currentPool = getPool();
    const client = await currentPool.connect();
    try {
      await client.query('SELECT 1');
      return { ok: true, configured: true, message: 'Connection to PostgreSQL server verified successfully.' };
    } finally {
      client.release?.();
    }
  } catch (err) {
    console.warn('[PostgreSQL Connection Test Notice]:', err.message);
    return {
      ok: false,
      configured: true,
      error: 'Unable to connect to PostgreSQL server. Please verify database host, port, credentials, and network.'
    };
  }
}

/**
 * Verifies that the required schema tables exist in the public schema.
 */
export async function verifySchema(currentPool = getPool()) {
  try {
    const res = await currentPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('services', 'speaking_slots', 'bookings')
    `);
    const tables = (res.rows || []).map((r) => r.table_name);
    return {
      verified: tables.includes('speaking_slots') && tables.includes('bookings'),
      existingTables: tables
    };
  } catch (err) {
    console.warn('[Schema Verification Notice]:', err.message);
    return { verified: false, existingTables: [] };
  }
}
