import { getPool, isDbConfigured, verifySchema } from '../config/db.js';

/**
 * Validates booking submission fields strictly.
 *
 * @param {object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateBookingPayload(data = {}) {
  const errors = [];
  const {
    serviceType,
    eventDate,
    preferredSlot,
    eventFormat,
    audienceSize,
    organizerName,
    email,
    phone,
    organization,
    city
  } = data;

  if (!serviceType || typeof serviceType !== 'string' || !serviceType.trim()) {
    errors.push('serviceType is required and must be a string.');
  }

  if (!eventDate || typeof eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate.trim())) {
    errors.push('eventDate is required in YYYY-MM-DD format.');
  } else {
    const trimmedDate = eventDate.trim();
    const [yStr, mStr, dStr] = trimmedDate.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const parsed = new Date(`${trimmedDate}T00:00:00Z`);
    if (
      isNaN(parsed.getTime()) ||
      parsed.getUTCFullYear() !== y ||
      parsed.getUTCMonth() + 1 !== m ||
      parsed.getUTCDate() !== d
    ) {
      errors.push('eventDate must be a valid calendar date.');
    } else {
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (trimmedDate < todayIST) {
        errors.push('eventDate cannot be in the past.');
      }
    }
  }

  if (!preferredSlot || typeof preferredSlot !== 'string' || !preferredSlot.trim()) {
    errors.push('preferredSlot is required.');
  }

  if (!eventFormat || typeof eventFormat !== 'string' || !eventFormat.trim()) {
    errors.push('eventFormat is required.');
  }

  if (!audienceSize || typeof audienceSize !== 'string' || !audienceSize.trim()) {
    errors.push('audienceSize is required.');
  }

  if (!organizerName || typeof organizerName !== 'string' || organizerName.trim().length < 2) {
    errors.push('organizerName must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    errors.push('A valid phone number (at least 7 characters) is required.');
  }

  if (!organization || typeof organization !== 'string' || organization.trim().length < 2) {
    errors.push('organization must be at least 2 characters long.');
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    errors.push('city must be at least 2 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Executes a transactional booking workflow in PostgreSQL.
 * Guarantees:
 * 1. Duplicate submission protection (idempotency key & temporal deduplication).
 * 2. Slot row locking (`FOR UPDATE`) to prevent double-booking.
 * 3. Atomic `BEGIN ... COMMIT / ROLLBACK` transaction.
 * 4. Never marks a booking confirmed unless the transaction succeeds.
 *
 * @param {object} bookingData
 * @param {string} [idempotencyKey]
 * @returns {Promise<object>}
 */
export async function createBookingWithTransaction(bookingData, idempotencyKey = null) {
  // 1. Server-side Payload Validation
  const validation = validateBookingPayload(bookingData);
  if (!validation.isValid) {
    return {
      success: false,
      code: 'VALIDATION_FAILED',
      errors: validation.errors,
      error: `Validation failed: ${validation.errors.join('; ')}`
    };
  }

  // 2. Check Database Configuration & Readiness
  if (!isDbConfigured()) {
    return {
      success: false,
      code: 'DB_UNCONFIGURED',
      error: 'PostgreSQL database is not configured. Real bookings cannot be finalized without a verified database connection (see .env.example).'
    };
  }

  const pool = getPool();
  const schemaStatus = await verifySchema(pool);
  if (!schemaStatus.verified) {
    return {
      success: false,
      code: 'SCHEMA_NOT_MIGRATED',
      error: 'PostgreSQL schema is not initialized. Please run migration script (npm run db:migrate) before confirming bookings.'
    };
  }

  // 3. Begin Transaction
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    console.error('[DB Connection Error during Booking]:', connErr.message);
    return {
      success: false,
      code: 'DB_CONNECTION_ERROR',
      error: 'Database connection failed. Please try again later.'
    };
  }

  try {
    await client.query('BEGIN');

    // 4. Duplicate Submission Protection
    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
      const existingRes = await client.query(
        `SELECT id, reference_code, service_type, event_date::text AS event_date, preferred_slot, status, created_at 
         FROM bookings 
         WHERE idempotency_key = $1`,
        [idempotencyKey.trim()]
      );

      if (existingRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: true,
          duplicate: true,
          booking: existingRes.rows[0],
          message: 'Booking request was already processed with this idempotency key.'
        };
      }
    }

    // Temporal Duplicate Protection: Check if identical booking was submitted in last 10 minutes
    const duplicateCheckRes = await client.query(
      `SELECT id, reference_code, status 
       FROM bookings 
       WHERE email = $1 
         AND event_date = $2::date 
         AND preferred_slot = $3 
         AND created_at > NOW() - INTERVAL '10 minutes'`,
      [bookingData.email.trim().toLowerCase(), bookingData.eventDate.trim(), bookingData.preferredSlot.trim()]
    );

    if (duplicateCheckRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        code: 'DUPLICATE_SUBMISSION',
        error: 'A duplicate booking inquiry for this date and slot was already received recently. Please allow our desk time to review.'
      };
    }

    // 5. Row-level Lock on Speaking Slot (`FOR UPDATE`) to Prevent Overlapping Bookings
    const slotRes = await client.query(
      `SELECT id, status, slot_date::text AS slot_date, slot_time 
       FROM speaking_slots 
       WHERE slot_date = $1::date AND slot_time = $2 
       FOR UPDATE`,
      [bookingData.eventDate.trim(), bookingData.preferredSlot.trim()]
    );

    if (slotRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        code: 'SLOT_NOT_FOUND',
        error: `No speaking slot exists for ${bookingData.eventDate} at '${bookingData.preferredSlot}'.`
      };
    }

    const slot = slotRes.rows[0];
    if (slot.status !== 'available') {
      await client.query('ROLLBACK');
      return {
        success: false,
        code: 'SLOT_UNAVAILABLE',
        error: `The speaking slot on ${bookingData.eventDate} (${bookingData.preferredSlot}) is already ${slot.status}. Please select an alternate slot.`
      };
    }

    // 6. Generate Reference Code
    const year = new Date(bookingData.eventDate).getFullYear();
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceCode = `INSP-${year}-${randPart}`;

    // 7. Insert Confirmed Booking Record
    const insertRes = await client.query(
      `INSERT INTO bookings (
        reference_code, service_type, event_date, preferred_slot, event_format,
        audience_size, organizer_name, email, phone, organization, city,
        theme_notes, status, idempotency_key, created_at, updated_at
      ) VALUES (
        $1, $2, $3::date, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, 'confirmed', $13, NOW(), NOW()
      ) RETURNING id, reference_code, service_type, event_date::text AS event_date, preferred_slot, organizer_name, email, organization, city, status, created_at`,
      [
        referenceCode,
        bookingData.serviceType.trim(),
        bookingData.eventDate.trim(),
        bookingData.preferredSlot.trim(),
        bookingData.eventFormat.trim(),
        bookingData.audienceSize.trim(),
        bookingData.organizerName.trim(),
        bookingData.email.trim().toLowerCase(),
        bookingData.phone.trim(),
        bookingData.organization.trim(),
        bookingData.city.trim(),
        bookingData.themeNotes ? bookingData.themeNotes.trim() : null,
        idempotencyKey ? idempotencyKey.trim() : null
      ]
    );

    const confirmedBooking = insertRes.rows[0];

    // 8. Update Slot Status to Booked
    await client.query(
      `UPDATE speaking_slots 
       SET status = 'booked', booking_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [confirmedBooking.id, slot.id]
    );

    // 9. Commit Transaction
    await client.query('COMMIT');

    return {
      success: true,
      confirmed: true,
      booking: confirmedBooking,
      message: 'Booking confirmed successfully through database transaction.'
    };
  } catch (txErr) {
    await client.query('ROLLBACK');
    console.error('[Booking Transaction Rollback Exception]:', txErr.message);
    return {
      success: false,
      code: 'TRANSACTION_ROLLBACK',
      error: 'Transaction failed. No changes were committed to the database.'
    };
  } finally {
    client.release();
  }
}
