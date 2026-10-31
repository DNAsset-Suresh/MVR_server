import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getBooksCatalog,
  getBookById,
  calculateOrderPricing,
  createOrder,
  verifyOrderPayment,
  getOrderByNumber,
  getAllOrders
} from '../services/bookstoreService.js';

export const bookstoreRouter = Router();

// Rate limiter for catalog queries: 120 per 15 minutes
export const catalogLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many catalog requests. Please try again after 15 minutes.'
  }
});

// Rate limiter for order calculation and creation: 30 per 15 minutes
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many order requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * GET /api/books
 * Retrieves the verified books catalog. Supports optional ?category and ?q search queries.
 */
bookstoreRouter.get('/books', catalogLimiter, async (req, res) => {
  try {
    const { category, q } = req.query || {};
    const books = await getBooksCatalog({ category, query: q });
    return res.json({
      success: true,
      count: books.length,
      books
    });
  } catch (err) {
    console.error('[Bookstore Catalog Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve bookstore catalogue.'
    });
  }
});

/**
 * GET /api/books/:id
 * Retrieves details for a specific book.
 */
bookstoreRouter.get('/books/:id', catalogLimiter, async (req, res) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: `Book with ID "${req.params.id}" not found.`
      });
    }
    return res.json({
      success: true,
      book
    });
  } catch (err) {
    console.error('[Bookstore Book Detail Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve book details.'
    });
  }
});

/**
 * POST /api/orders/calculate
 * Calculates verified pricing, shipping charges, and applicable taxes strictly on backend.
 * Never trusts prices or totals sent by client browser.
 */
bookstoreRouter.post('/orders/calculate', orderLimiter, async (req, res) => {
  try {
    const { items } = req.body || {};
    const result = await calculateOrderPricing(items);
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      verifiedItems: result.verifiedItems,
      subtotal: result.subtotal,
      shipping: result.shipping,
      tax: result.tax,
      total: result.total,
      currency: 'INR'
    });
  } catch (err) {
    console.error('[Order Calculation Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal error while calculating order pricing.'
    });
  }
});

/**
 * POST /api/orders/create
 * Creates a pending order backed by server-side price recalculation, stock reservation, and idempotency protection.
 */
bookstoreRouter.post('/orders/create', orderLimiter, async (req, res) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;
    const result = await createOrder(req.body, idempotencyKey);

    if (result.success) {
      const statusCode = result.duplicate ? 200 : 201;
      return res.status(statusCode).json(result);
    }

    let status = 400;
    switch (result.code) {
      case 'VALIDATION_FAILED':
      case 'PRICE_CALCULATION_FAILED':
        status = 400;
        break;
      case 'OUT_OF_STOCK':
        status = 409;
        break;
      default:
        status = 400;
    }

    return res.status(status).json(result);
  } catch (err) {
    console.error('[Order Creation Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal error occurred while creating order.'
    });
  }
});

/**
 * POST /api/orders/verify
 * Verifies payment server-side (HMAC SHA256 signature or test sandbox), decrements stock, and issues receipt.
 */
bookstoreRouter.post('/orders/verify', orderLimiter, async (req, res) => {
  try {
    const result = await verifyOrderPayment(req.body);

    if (result.success) {
      return res.json(result);
    }

    let status = 400;
    if (result.code === 'ORDER_NOT_FOUND') status = 404;
    if (result.code === 'SIGNATURE_VERIFICATION_FAILED') status = 403;

    return res.status(status).json(result);
  } catch (err) {
    console.error('[Order Payment Verification Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal error during payment verification.'
    });
  }
});

/**
 * GET /api/orders/:orderNumber
 * Retrieves verified order status and receipt.
 */
bookstoreRouter.get('/orders/:orderNumber', catalogLimiter, async (req, res) => {
  try {
    const order = await getOrderByNumber(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order "${req.params.orderNumber}" not found.`
      });
    }

    return res.json({
      success: true,
      order: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        email: order.email,
        phone: order.phone,
        shippingAddress: {
          address: order.shipping_address,
          city: order.city,
          state: order.state,
          pincode: order.pincode
        },
        items: order.items,
        subtotal: order.subtotal_amount,
        shipping: order.shipping_amount,
        tax: order.tax_amount,
        total: order.total_amount,
        paymentStatus: order.payment_status,
        fulfillmentStatus: order.fulfillment_status,
        paymentId: order.payment_id,
        createdAt: order.created_at
      }
    });
  } catch (err) {
    console.error('[Order Lookup Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve order details.'
    });
  }
});

/**
 * GET /api/orders
 * Admin list of all orders.
 */
bookstoreRouter.get('/orders', catalogLimiter, async (req, res) => {
  try {
    const orders = await getAllOrders();
    return res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    console.error('[All Orders Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders.'
    });
  }
});
