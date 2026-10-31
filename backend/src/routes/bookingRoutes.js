import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getVerifiedAvailability } from '../services/availabilityService.js';
import { createBookingWithTransaction } from '../services/bookingService.js';

export const bookingRouter = Router();

// Rate limiter for availability checks: 60 requests per 15 min
export const availabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many availability requests. Please try again after 15 minutes.'
  }
});

// Rate limiter for booking submissions: 20 requests per 15 min
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many booking requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * GET /api/availability
 * Queries verified keynote availability from PostgreSQL database.
 */
bookingRouter.get('/availability', availabilityLimiter, async (req, res) => {
  try {
    const { date } = req.query || {};
    const result = await getVerifiedAvailability(date);
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (err) {
    console.error('[Availability Route Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while fetching availability.'
    });
  }
});

/**
 * POST /api/bookings
 * Submits confirmed booking inquiry backed by PostgreSQL transactions and row-level locking.
 */
bookingRouter.post('/bookings', bookingLimiter, async (req, res) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;
    const result = await createBookingWithTransaction(req.body, idempotencyKey);

    if (result.success) {
      return res.status(201).json(result);
    }

    // Map error code to semantic HTTP status codes
    let status = 400;
    switch (result.code) {
      case 'VALIDATION_FAILED':
        status = 400;
        break;
      case 'DUPLICATE_SUBMISSION':
      case 'SLOT_UNAVAILABLE':
        status = 409;
        break;
      case 'SLOT_NOT_FOUND':
        status = 404;
        break;
      case 'DB_UNCONFIGURED':
      case 'SCHEMA_NOT_MIGRATED':
      case 'DB_CONNECTION_ERROR':
        status = 503;
        break;
      case 'TRANSACTION_ROLLBACK':
        status = 500;
        break;
      default:
        status = 400;
    }

    return res.status(status).json(result);
  } catch (err) {
    console.error('[Booking Route Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while processing your booking.'
    });
  }
});
