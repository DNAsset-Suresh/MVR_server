import { getPool, isDbConfigured, verifySchema } from '../config/db.js';

/**
 * Retrieves verified keynote speaking availability from PostgreSQL.
 * Strictly uses parameterized queries and never invents fake slots.
 *
 * @param {string} [targetDate] - Optional target date in YYYY-MM-DD format
 * @returns {Promise<object>}
 */
export async function getVerifiedAvailability(targetDate = null) {
  // 1. Validate date format if specified
  if (targetDate) {
    if (typeof targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
      return {
        success: false,
        error: 'Invalid date format. Expected YYYY-MM-DD.'
      };
    }

    const parsedDate = new Date(targetDate);
    if (isNaN(parsedDate.getTime())) {
      return {
        success: false,
        error: 'Invalid calendar date specified.'
      };
    }
  }

  // 2. Check if database credentials exist
  if (!isDbConfigured()) {
    return {
      success: true,
      dbConnected: false,
      availabilityVerified: false,
      message: 'Speaking calendar is in preview mode. Live slot verification requires PostgreSQL configuration in backend environment (see .env.example).',
      targetDate: targetDate || null,
      slots: []
    };
  }

  const pool = getPool();

  // 3. Verify that the required speaking_slots schema table exists
  const schemaStatus = await verifySchema(pool);
  if (!schemaStatus.verified || !schemaStatus.existingTables.includes('speaking_slots')) {
    return {
      success: true,
      dbConnected: true,
      availabilityVerified: false,
      message: 'PostgreSQL connection detected, but speaking_slots table has not been migrated yet. Please run migration script upon approval.',
      targetDate: targetDate || null,
      slots: []
    };
  }

  // 4. Parameterized query for actual database records
  try {
    let query;
    let params;

    if (targetDate) {
      query = `
        SELECT id, slot_date::text AS slot_date, slot_time, label, status
        FROM speaking_slots
        WHERE slot_date = $1::date
        ORDER BY slot_time ASC;
      `;
      params = [targetDate.trim()];
    } else {
      query = `
        SELECT id, slot_date::text AS slot_date, slot_time, label, status
        FROM speaking_slots
        WHERE slot_date >= CURRENT_DATE
        ORDER BY slot_date ASC, slot_time ASC
        LIMIT 50;
      `;
      params = [];
    }

    const res = await pool.query(query, params);

    return {
      success: true,
      dbConnected: true,
      availabilityVerified: true,
      count: res.rows.length,
      slots: res.rows,
      targetDate: targetDate || null,
      retrievedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('[Availability Query Error]:', err.message);
    return {
      success: false,
      error: 'An internal error occurred while querying availability records from the database.'
    };
  }
}
